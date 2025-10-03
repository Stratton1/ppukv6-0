/**
 * HMLR (HM Land Registry) API Edge Function
 * Fetches property title information and transaction history
 *
 * Endpoint: /functions/v1/api-hmlr
 * Method: POST
 * Body: { postcode: string, address?: string, titleNumber?: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  HMLRRequestSchema,
  HMLRResponseSchema,
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
import type { HMLRData, RequestContext } from "../shared/types.ts";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMLR_API_KEY = Deno.env.get("HMLR_API_KEY");
const HMLR_API_BASE_URL = Deno.env.get("HMLR_API_BASE_URL") || "https://api.landregistry.gov.uk";

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
    await RateLimiter.checkRateLimit(`hmlr:${clientId}`, 50, 3600); // 50 requests per hour

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
    const validatedRequest = validateRequest(HMLRRequestSchema, body);

    // Validate postcode format
    if (!validatePostcode(validatedRequest.postcode)) {
      const error = ApiErrorHandler.createValidationError(
        "Invalid postcode format",
        { postcode: validatedRequest.postcode },
        context.requestId
      );
      return HttpUtils.createErrorResponse(error, 400);
    }

    logger.info("HMLR API request received", {
      postcode: validatedRequest.postcode,
      address: validatedRequest.address,
      titleNumber: validatedRequest.titleNumber,
    });

    // Check cache first
    const cacheKey = CacheManager.generateCacheKey("hmlr", validatedRequest);
    const cachedData = await CacheManager.get<HMLRData>(cacheKey);

    if (cachedData) {
      logger.info("HMLR data served from cache", { cacheKey });
      const response = {
        success: true,
        data: cachedData,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        cache: CacheManager.getCacheInfo(cacheKey, 7200), // Cache for 2 hours
      };
      return HttpUtils.createResponse(response);
    }

    // Fetch HMLR data from external API
    const hmlrData = await PerformanceMonitor.measure(
      "hmlr-api-fetch",
      () => fetchHMLRData(validatedRequest, logger),
      logger
    );

    // Validate response data
    const validatedData = validateResponse(HMLRResponseSchema, {
      success: true,
      data: hmlrData,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
    });

    // Cache the result
    await CacheManager.set(cacheKey, hmlrData, 7200); // Cache for 2 hours

    // Log successful response
    logger.info("HMLR data fetched successfully", {
      titleNumber: hmlrData.titleNumber,
      tenure: hmlrData.tenure,
    });

    return HttpUtils.createResponse(validatedData);
  } catch (error) {
    logger.error("HMLR API error", error as Error, { context });

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
          "HMLR",
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
 * Fetch HMLR data from the HM Land Registry API
 */
async function fetchHMLRData(request: any, logger: Logger): Promise<HMLRData> {
  const apiClient = new ExternalApiClient(HMLR_API_BASE_URL, HMLR_API_KEY, logger);

  try {
    let hmlrData: HMLRData;

    if (request.titleNumber) {
      // Fetch by title number
      hmlrData = await fetchByTitleNumber(request.titleNumber, apiClient, logger);
    } else {
      // Search by postcode/address
      hmlrData = await searchByPostcode(request, apiClient, logger);
    }

    return hmlrData;
  } catch (error) {
    logger.error("Failed to fetch HMLR data from external API", error as Error);
    throw new Error(`HMLR API request failed: ${error.message}`);
  }
}

/**
 * Fetch HMLR data by title number
 */
async function fetchByTitleNumber(
  titleNumber: string,
  apiClient: ExternalApiClient,
  logger: Logger
): Promise<HMLRData> {
  try {
    const response = await apiClient.get(`/title/${titleNumber}`);

    if (!response || !response.title) {
      throw new Error("No title data found for the specified title number");
    }

    const title = response.title;

    // Transform the API response to our HMLRData format
    const hmlrData: HMLRData = {
      titleNumber: title.titleNumber || "",
      address: title.address || "",
      postcode: title.postcode || "",
      tenure: title.tenure || "Freehold",
      pricePaid: title.pricePaid ? parseFloat(title.pricePaid) : undefined,
      pricePaidDate: title.pricePaidDate || undefined,
      propertyType: title.propertyType || "",
      newBuild: title.newBuild === "Y",
      estateType: title.estateType || "",
      saon: title.saon || undefined,
      paon: title.paon || undefined,
      street: title.street || undefined,
      locality: title.locality || undefined,
      town: title.town || undefined,
      district: title.district || undefined,
      county: title.county || undefined,
      ppdCategoryType: title.ppdCategoryType || "",
      recordStatus: title.recordStatus || "",
      transactions: title.transactions
        ? title.transactions.map((t: any) => ({
            price: parseFloat(t.price),
            date: t.date,
            category: t.category,
            newBuild: t.newBuild === "Y",
            estateType: t.estateType,
            saon: t.saon || undefined,
            paon: t.paon || undefined,
            street: t.street || undefined,
            locality: t.locality || undefined,
            town: t.town || undefined,
            district: t.district || undefined,
            county: t.county || undefined,
            ppdCategoryType: t.ppdCategoryType,
            recordStatus: t.recordStatus,
          }))
        : undefined,
      charges: title.charges
        ? title.charges.map((c: any) => ({
            chargeNumber: c.chargeNumber,
            chargeType: c.chargeType,
            chargeDescription: c.chargeDescription,
            chargeDate: c.chargeDate,
            chargeAmount: c.chargeAmount ? parseFloat(c.chargeAmount) : undefined,
            chargeHolder: c.chargeHolder,
          }))
        : undefined,
      restrictions: title.restrictions
        ? title.restrictions.map((r: any) => ({
            restrictionType: r.restrictionType,
            restrictionDescription: r.restrictionDescription,
            restrictionDate: r.restrictionDate,
            restrictionHolder: r.restrictionHolder || undefined,
          }))
        : undefined,
    };

    return hmlrData;
  } catch (error) {
    logger.error("Failed to fetch HMLR data by title number", error as Error);
    throw error;
  }
}

/**
 * Search HMLR data by postcode
 */
async function searchByPostcode(
  request: any,
  apiClient: ExternalApiClient,
  logger: Logger
): Promise<HMLRData> {
  try {
    // Build search parameters
    const params: Record<string, string> = {
      postcode: request.postcode.toUpperCase().replace(/\s/g, ""),
    };

    if (request.address) {
      params.address = request.address;
    }

    // Make search request
    const response = await apiClient.get("/search", params);

    if (!response || !response.results || response.results.length === 0) {
      throw new Error("No HMLR data found for the specified property");
    }

    // Get the first result (most relevant)
    const result = response.results[0];

    // Fetch detailed data for the first result
    return await fetchByTitleNumber(result.titleNumber, apiClient, logger);
  } catch (error) {
    logger.error("Failed to search HMLR data by postcode", error as Error);
    throw error;
  }
}
