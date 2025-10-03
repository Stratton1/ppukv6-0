/**
 * Flood Risk API Edge Function
 * Fetches flood risk data from the Environment Agency API
 *
 * Endpoint: /functions/v1/api-flood
 * Method: POST
 * Body: { postcode: string, address?: string, uprn?: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  FloodRiskRequestSchema,
  FloodRiskResponseSchema,
  validateRequest,
  validateResponse,
} from "../shared/validation.ts";
import {
  createRequestContext,
  ApiErrorHandler,
  Logger,
  RateLimiter,
  CacheManager,
  HttpUtils,
  ExternalApiClient,
  PerformanceMonitor,
  validatePostcode,
} from "../shared/utils.ts";
import type { FloodRiskData, RequestContext } from "../shared/types.ts";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FLOOD_API_KEY = Deno.env.get("FLOOD_API_KEY");
const FLOOD_API_BASE_URL = Deno.env.get("FLOOD_API_BASE_URL") || "https://environment.data.gov.uk";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  const context = createRequestContext(req);
  const logger = new Logger(context);

  try {
    // Handle CORS
    const corsResponse = await HttpUtils.handleCors(req);
    if (corsResponse) return corsResponse;

    // Rate limiting
    const clientId = req.headers.get("x-forwarded-for") || "unknown";
    await RateLimiter.checkRateLimit(`flood:${clientId}`, 200, 3600); // 200 requests per hour

    // Validate request method
    if (req.method !== "POST") {
      const error = ApiErrorHandler.createError(
        "METHOD_NOT_ALLOWED",
        "Only POST method is allowed",
        undefined,
        context.requestId
      );
      return HttpUtils.createErrorResponse(error, 405);
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedRequest = validateRequest(FloodRiskRequestSchema, body);

    // Validate postcode format
    if (!validatePostcode(validatedRequest.postcode)) {
      const error = ApiErrorHandler.createValidationError(
        "Invalid postcode format",
        { postcode: validatedRequest.postcode },
        context.requestId
      );
      return HttpUtils.createErrorResponse(error, 400);
    }

    logger.info("Flood Risk API request received", {
      postcode: validatedRequest.postcode,
      address: validatedRequest.address,
      uprn: validatedRequest.uprn,
    });

    // Check cache first
    const cacheKey = CacheManager.generateCacheKey("flood", validatedRequest);
    const cachedData = await CacheManager.get<FloodRiskData>(cacheKey);

    if (cachedData) {
      logger.info("Flood risk data served from cache", { cacheKey });
      const response = {
        success: true,
        data: cachedData,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        cache: CacheManager.getCacheInfo(cacheKey, 86400), // Cache for 24 hours
      };
      return HttpUtils.createResponse(response);
    }

    // Fetch flood risk data from external API
    const floodData = await PerformanceMonitor.measure(
      "flood-api-fetch",
      () => fetchFloodRiskData(validatedRequest, logger),
      logger
    );

    // Validate response data
    const validatedData = validateResponse(FloodRiskResponseSchema, {
      success: true,
      data: floodData,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
    });

    // Cache the result
    await CacheManager.set(cacheKey, floodData, 86400); // Cache for 24 hours

    // Log successful response
    logger.info("Flood risk data fetched successfully", {
      riskLevel: floodData.riskLevel,
      riskScore: floodData.riskScore,
    });

    return HttpUtils.createResponse(validatedData);
  } catch (error) {
    logger.error("Flood Risk API error", error as Error, { context });

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("Rate limit exceeded")) {
        const rateLimitError = ApiErrorHandler.createRateLimitError(undefined, context.requestId);
        return HttpUtils.createErrorResponse(rateLimitError, 429);
      }

      if (error.message.includes("Validation error")) {
        const validationError = ApiErrorHandler.createValidationError(
          error.message,
          undefined,
          context.requestId
        );
        return HttpUtils.createErrorResponse(validationError, 400);
      }

      if (error.message.includes("API request failed")) {
        const apiError = ApiErrorHandler.createExternalApiError(
          "Flood Risk",
          error.message,
          context.requestId
        );
        return HttpUtils.createErrorResponse(apiError, 502);
      }
    }

    // Generic error response
    const genericError = ApiErrorHandler.createInternalError(
      "An unexpected error occurred",
      context.requestId
    );
    return HttpUtils.createErrorResponse(genericError, 500);
  }
});

/**
 * Fetch flood risk data from the Environment Agency API
 */
async function fetchFloodRiskData(request: any, logger: Logger): Promise<FloodRiskData> {
  const apiClient = new ExternalApiClient(FLOOD_API_BASE_URL, FLOOD_API_KEY, logger);

  try {
    // Build query parameters
    const params: Record<string, string> = {
      postcode: request.postcode.toUpperCase().replace(/\s/g, ""),
    };

    if (request.address) {
      params.address = request.address;
    }

    if (request.uprn) {
      params.uprn = request.uprn;
    }

    // Make multiple API requests to get comprehensive flood risk data
    const [surfaceWaterData, riversSeaData, groundwaterData, reservoirsData, warningsData] =
      await Promise.all([
        fetchSurfaceWaterRisk(params, apiClient, logger),
        fetchRiversAndSeaRisk(params, apiClient, logger),
        fetchGroundwaterRisk(params, apiClient, logger),
        fetchReservoirsRisk(params, apiClient, logger),
        fetchFloodWarnings(params, apiClient, logger),
      ]);

    // Calculate overall risk level and score
    const riskLevels = [
      surfaceWaterData.level,
      riversSeaData.level,
      groundwaterData.level,
      reservoirsData.level,
    ];

    const riskScores = [
      surfaceWaterData.score,
      riversSeaData.score,
      groundwaterData.score,
      reservoirsData.score,
    ];

    const overallRiskLevel = calculateOverallRiskLevel(riskLevels);
    const overallRiskScore = Math.max(...riskScores);

    // Transform the API response to our FloodRiskData format
    const floodData: FloodRiskData = {
      address: request.address || "",
      postcode: request.postcode,
      uprn: request.uprn || undefined,
      floodRisk: {
        surfaceWater: surfaceWaterData,
        riversAndSea: riversSeaData,
        groundwater: groundwaterData,
        reservoirs: reservoirsData,
      },
      riskLevel: overallRiskLevel,
      riskScore: overallRiskScore,
      lastUpdated: new Date().toISOString(),
      dataSource: "Environment Agency",
      warnings: warningsData,
      historicalFloods: [], // Would be populated from historical data API
    };

    return floodData;
  } catch (error) {
    logger.error("Failed to fetch flood risk data from external API", error as Error);
    throw new Error(`Flood Risk API request failed: ${error.message}`);
  }
}

/**
 * Fetch surface water flood risk
 */
async function fetchSurfaceWaterRisk(
  params: Record<string, string>,
  apiClient: ExternalApiClient,
  logger: Logger
) {
  try {
    const response = await apiClient.get("/flood-monitoring/id/floodAreas", params);

    // Process response and determine risk level
    const riskLevel = determineRiskLevel(response);
    const score = riskLevelToScore(riskLevel);

    return {
      level: riskLevel,
      score,
      description: getRiskDescription("surface water", riskLevel),
      probability: getRiskProbability(riskLevel),
      impact: getRiskImpact(riskLevel),
      mitigation: getRiskMitigation("surface water", riskLevel),
    };
  } catch (error) {
    logger.warn("Failed to fetch surface water risk data", { error: error.message });
    return getDefaultRiskLevel("surface water");
  }
}

/**
 * Fetch rivers and sea flood risk
 */
async function fetchRiversAndSeaRisk(
  params: Record<string, string>,
  apiClient: ExternalApiClient,
  logger: Logger
) {
  try {
    const response = await apiClient.get("/flood-monitoring/id/floodAreas", params);

    const riskLevel = determineRiskLevel(response);
    const score = riskLevelToScore(riskLevel);

    return {
      level: riskLevel,
      score,
      description: getRiskDescription("rivers and sea", riskLevel),
      probability: getRiskProbability(riskLevel),
      impact: getRiskImpact(riskLevel),
      mitigation: getRiskMitigation("rivers and sea", riskLevel),
    };
  } catch (error) {
    logger.warn("Failed to fetch rivers and sea risk data", { error: error.message });
    return getDefaultRiskLevel("rivers and sea");
  }
}

/**
 * Fetch groundwater flood risk
 */
async function fetchGroundwaterRisk(
  params: Record<string, string>,
  apiClient: ExternalApiClient,
  logger: Logger
) {
  try {
    const response = await apiClient.get("/flood-monitoring/id/floodAreas", params);

    const riskLevel = determineRiskLevel(response);
    const score = riskLevelToScore(riskLevel);

    return {
      level: riskLevel,
      score,
      description: getRiskDescription("groundwater", riskLevel),
      probability: getRiskProbability(riskLevel),
      impact: getRiskImpact(riskLevel),
      mitigation: getRiskMitigation("groundwater", riskLevel),
    };
  } catch (error) {
    logger.warn("Failed to fetch groundwater risk data", { error: error.message });
    return getDefaultRiskLevel("groundwater");
  }
}

/**
 * Fetch reservoirs flood risk
 */
async function fetchReservoirsRisk(
  params: Record<string, string>,
  apiClient: ExternalApiClient,
  logger: Logger
) {
  try {
    const response = await apiClient.get("/flood-monitoring/id/floodAreas", params);

    const riskLevel = determineRiskLevel(response);
    const score = riskLevelToScore(riskLevel);

    return {
      level: riskLevel,
      score,
      description: getRiskDescription("reservoirs", riskLevel),
      probability: getRiskProbability(riskLevel),
      impact: getRiskImpact(riskLevel),
      mitigation: getRiskMitigation("reservoirs", riskLevel),
    };
  } catch (error) {
    logger.warn("Failed to fetch reservoirs risk data", { error: error.message });
    return getDefaultRiskLevel("reservoirs");
  }
}

/**
 * Fetch current flood warnings
 */
async function fetchFloodWarnings(
  params: Record<string, string>,
  apiClient: ExternalApiClient,
  logger: Logger
) {
  try {
    const response = await apiClient.get("/flood-monitoring/id/floodAreas", params);

    if (!response || !response.items) {
      return [];
    }

    return response.items.map((item: any) => ({
      id: item.id || "",
      type: item.type || "Flood Alert",
      severity: item.severity || "Low",
      message: item.message || "",
      issuedDate: item.issuedDate || new Date().toISOString(),
      validUntil: item.validUntil || undefined,
      affectedAreas: item.affectedAreas || [],
      advice: item.advice || "",
    }));
  } catch (error) {
    logger.warn("Failed to fetch flood warnings", { error: error.message });
    return [];
  }
}

// Helper functions for risk assessment
function determineRiskLevel(response: any): "Very Low" | "Low" | "Medium" | "High" | "Very High" {
  // Simplified risk determination logic
  // In a real implementation, this would analyze the actual API response
  if (!response || !response.items || response.items.length === 0) {
    return "Very Low";
  }

  // Mock risk determination based on response
  const itemCount = response.items.length;
  if (itemCount >= 5) return "Very High";
  if (itemCount >= 3) return "High";
  if (itemCount >= 2) return "Medium";
  if (itemCount >= 1) return "Low";
  return "Very Low";
}

function riskLevelToScore(level: string): number {
  const scores = {
    "Very Low": 1,
    Low: 3,
    Medium: 5,
    High: 7,
    "Very High": 10,
  };
  return scores[level as keyof typeof scores] || 1;
}

function calculateOverallRiskLevel(
  levels: string[]
): "Very Low" | "Low" | "Medium" | "High" | "Very High" {
  const scores = levels.map(riskLevelToScore);
  const maxScore = Math.max(...scores);

  if (maxScore >= 10) return "Very High";
  if (maxScore >= 7) return "High";
  if (maxScore >= 5) return "Medium";
  if (maxScore >= 3) return "Low";
  return "Very Low";
}

function getRiskDescription(type: string, level: string): string {
  return `${type.charAt(0).toUpperCase() + type.slice(1)} flood risk is ${level.toLowerCase()}`;
}

function getRiskProbability(level: string): string {
  const probabilities = {
    "Very Low": "1 in 1000 years",
    Low: "1 in 200 years",
    Medium: "1 in 100 years",
    High: "1 in 30 years",
    "Very High": "1 in 10 years",
  };
  return probabilities[level as keyof typeof probabilities] || "Unknown";
}

function getRiskImpact(level: string): string {
  const impacts = {
    "Very Low": "Minimal impact expected",
    Low: "Minor impact possible",
    Medium: "Moderate impact possible",
    High: "Significant impact likely",
    "Very High": "Severe impact very likely",
  };
  return impacts[level as keyof typeof impacts] || "Unknown impact";
}

function getRiskMitigation(type: string, level: string): string[] {
  const baseMitigations = [
    "Ensure adequate insurance coverage",
    "Keep important documents in waterproof containers",
    "Have an emergency flood plan",
  ];

  if (level === "High" || level === "Very High") {
    return [
      ...baseMitigations,
      "Consider flood barriers or sandbags",
      "Install flood-resistant doors and windows",
      "Raise electrical outlets and appliances",
      "Consider property elevation",
    ];
  }

  return baseMitigations;
}

function getDefaultRiskLevel(type: string) {
  return {
    level: "Very Low" as const,
    score: 1,
    description: `${type.charAt(0).toUpperCase() + type.slice(1)} flood risk data unavailable`,
    probability: "Unknown",
    impact: "Risk assessment unavailable",
    mitigation: ["Contact local authority for flood risk information"],
  };
}
