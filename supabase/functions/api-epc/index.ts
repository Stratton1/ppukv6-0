/**
 * EPC (Energy Performance Certificate) API Edge Function
 * Fetches EPC data from the UK EPC Register API
 * 
 * Endpoint: /functions/v1/api-epc
 * Method: POST
 * Body: { postcode: string, address?: string, uprn?: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { 
  EPCRequestSchema, 
  EPCResponseSchema, 
  validateRequest, 
  validateResponse 
} from '../shared/validation.ts';
import { 
  createRequestContext, 
  ApiErrorHandler, 
  Logger, 
  RateLimiter, 
  CacheManager, 
  HttpUtils, 
  ExternalApiClient,
  PerformanceMonitor,
  validatePostcode 
} from '../shared/utils.ts';
import type { EPCData, RequestContext } from '../shared/types.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EPC_API_KEY = Deno.env.get('EPC_API_KEY');
const EPC_API_BASE_URL = Deno.env.get('EPC_API_BASE_URL') || 'https://epc.opendatacommunities.org/api/v1';

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
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    await RateLimiter.checkRateLimit(`epc:${clientId}`, 100, 3600); // 100 requests per hour

    // Validate request method
    if (req.method !== 'POST') {
      const error = ApiErrorHandler.createError(
        'METHOD_NOT_ALLOWED',
        'Only POST method is allowed',
        undefined,
        context.requestId
      );
      return HttpUtils.createErrorResponse(error, 405);
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedRequest = validateRequest(EPCRequestSchema, body);

    // Validate postcode format
    if (!validatePostcode(validatedRequest.postcode)) {
      const error = ApiErrorHandler.createValidationError(
        'Invalid postcode format',
        { postcode: validatedRequest.postcode },
        context.requestId
      );
      return HttpUtils.createErrorResponse(error, 400);
    }

    logger.info('EPC API request received', { 
      postcode: validatedRequest.postcode,
      address: validatedRequest.address,
      uprn: validatedRequest.uprn 
    });

    // Check cache first
    const cacheKey = CacheManager.generateCacheKey('epc', validatedRequest);
    const cachedData = await CacheManager.get<EPCData>(cacheKey);
    
    if (cachedData) {
      logger.info('EPC data served from cache', { cacheKey });
      const response = {
        success: true,
        data: cachedData,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
        cache: CacheManager.getCacheInfo(cacheKey, 3600),
      };
      return HttpUtils.createResponse(response);
    }

    // Fetch EPC data from external API
    const epcData = await PerformanceMonitor.measure(
      'epc-api-fetch',
      () => fetchEPCData(validatedRequest, logger),
      logger
    );

    // Validate response data
    const validatedData = validateResponse(EPCResponseSchema, {
      success: true,
      data: epcData,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
    });

    // Cache the result
    await CacheManager.set(cacheKey, epcData, 3600); // Cache for 1 hour

    // Log successful response
    logger.info('EPC data fetched successfully', { 
      certificateNumber: epcData.certificateNumber,
      currentRating: epcData.currentRating 
    });

    return HttpUtils.createResponse(validatedData);

  } catch (error) {
    logger.error('EPC API error', error as Error, { context });

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Rate limit exceeded')) {
        const rateLimitError = ApiErrorHandler.createRateLimitError(undefined, context.requestId);
        return HttpUtils.createErrorResponse(rateLimitError, 429);
      }

      if (error.message.includes('Validation error')) {
        const validationError = ApiErrorHandler.createValidationError(
          error.message,
          undefined,
          context.requestId
        );
        return HttpUtils.createErrorResponse(validationError, 400);
      }

      if (error.message.includes('API request failed')) {
        const apiError = ApiErrorHandler.createExternalApiError(
          'EPC',
          error.message,
          context.requestId
        );
        return HttpUtils.createErrorResponse(apiError, 502);
      }
    }

    // Generic error response
    const genericError = ApiErrorHandler.createInternalError(
      'An unexpected error occurred',
      context.requestId
    );
    return HttpUtils.createErrorResponse(genericError, 500);
  }
});

/**
 * Fetch EPC data from the UK EPC Register API
 */
async function fetchEPCData(request: any, logger: Logger): Promise<EPCData> {
  const apiClient = new ExternalApiClient(
    EPC_API_BASE_URL,
    EPC_API_KEY,
    logger
  );

  try {
    // Build query parameters
    const params: Record<string, string> = {
      postcode: request.postcode.toUpperCase().replace(/\s/g, ''),
    };

    if (request.address) {
      params.address = request.address;
    }

    if (request.uprn) {
      params.uprn = request.uprn;
    }

    // Make API request
    const response = await apiClient.get('/domestic/search', params);

    if (!response || !response.rows || response.rows.length === 0) {
      throw new Error('No EPC data found for the specified property');
    }

    // Get the most recent certificate
    const latestCertificate = response.rows[0];
    
    // Transform the API response to our EPCData format
    const epcData: EPCData = {
      certificateNumber: latestCertificate['lmk-key'] || '',
      address: latestCertificate.address || '',
      postcode: latestCertificate.postcode || '',
      propertyType: latestCertificate['property-type'] || '',
      builtForm: latestCertificate['built-form'] || '',
      totalFloorArea: parseFloat(latestCertificate['total-floor-area']) || 0,
      currentRating: latestCertificate['current-energy-rating'] || 'G',
      currentEfficiency: parseInt(latestCertificate['current-energy-efficiency']) || 0,
      environmentalImpactRating: latestCertificate['environmental-impact-rating'] || 'G',
      environmentalImpactEfficiency: parseInt(latestCertificate['environmental-impact-efficiency']) || 0,
      mainFuelType: latestCertificate['main-fuel-type'] || '',
      mainHeatingDescription: latestCertificate['main-heating-description'] || '',
      mainHeatingControls: latestCertificate['main-heating-controls'] || '',
      secondaryHeatingDescription: latestCertificate['secondary-heating-description'] || undefined,
      hotWaterDescription: latestCertificate['hot-water-description'] || '',
      lightingDescription: latestCertificate['lighting-description'] || '',
      windowsDescription: latestCertificate['windows-description'] || '',
      wallsDescription: latestCertificate['walls-description'] || '',
      roofDescription: latestCertificate['roof-description'] || '',
      floorDescription: latestCertificate['floor-description'] || '',
      mainHeatingEnergyEff: latestCertificate['main-heating-energy-eff'] || '',
      mainHeatingEnvEff: latestCertificate['main-heating-env-eff'] || '',
      hotWaterEnergyEff: latestCertificate['hot-water-energy-eff'] || '',
      hotWaterEnvEff: latestCertificate['hot-water-env-eff'] || '',
      lightingEnergyEff: latestCertificate['lighting-energy-eff'] || '',
      lightingEnvEff: latestCertificate['lighting-env-eff'] || '',
      windowsEnergyEff: latestCertificate['windows-energy-eff'] || '',
      windowsEnvEff: latestCertificate['windows-env-eff'] || '',
      wallsEnergyEff: latestCertificate['walls-energy-eff'] || '',
      wallsEnvEff: latestCertificate['walls-env-eff'] || '',
      roofEnergyEff: latestCertificate['roof-energy-eff'] || '',
      roofEnvEff: latestCertificate['roof-env-eff'] || '',
      floorEnergyEff: latestCertificate['floor-energy-eff'] || '',
      floorEnvEff: latestCertificate['floor-env-eff'] || '',
      mainFuel: latestCertificate['main-fuel'] || '',
      windTurbineCount: parseInt(latestCertificate['wind-turbine-count']) || 0,
      heatLossCorridor: latestCertificate['heat-loss-corridor'] || '',
      unheatedCorridorLength: parseFloat(latestCertificate['unheated-corridor-length']) || 0,
      floorHeight: parseFloat(latestCertificate['floor-height']) || 0,
      photoSupply: parseInt(latestCertificate['photo-supply']) || 0,
      solarWaterHeatingFlag: latestCertificate['solar-water-heating-flag'] === 'Y',
      mechanicalVentilation: latestCertificate['mechanical-ventilation'] || '',
      address1: latestCertificate['address1'] || '',
      address2: latestCertificate['address2'] || undefined,
      address3: latestCertificate['address3'] || undefined,
      localAuthority: latestCertificate['local-authority'] || '',
      constituency: latestCertificate['constituency'] || '',
      county: latestCertificate['county'] || '',
      lodgementDate: latestCertificate['lodgement-date'] || '',
      transactionType: latestCertificate['transaction-type'] || '',
      environmentImpactPotential: parseInt(latestCertificate['environment-impact-potential']) || 0,
      co2EmissionsCurrent: parseFloat(latestCertificate['co2-emissions-current']) || 0,
      co2EmissionsPotential: parseFloat(latestCertificate['co2-emissions-potential']) || 0,
      lightingCostCurrent: parseFloat(latestCertificate['lighting-cost-current']) || 0,
      lightingCostPotential: parseFloat(latestCertificate['lighting-cost-potential']) || 0,
      heatingCostCurrent: parseFloat(latestCertificate['heating-cost-current']) || 0,
      heatingCostPotential: parseFloat(latestCertificate['heating-cost-potential']) || 0,
      hotWaterCostCurrent: parseFloat(latestCertificate['hot-water-cost-current']) || 0,
      hotWaterCostPotential: parseFloat(latestCertificate['hot-water-cost-potential']) || 0,
      totalCostCurrent: parseFloat(latestCertificate['total-cost-current']) || 0,
      totalCostPotential: parseFloat(latestCertificate['total-cost-potential']) || 0,
      lzcEnergySources: parseInt(latestCertificate['lzc-energy-sources']) || 0,
      renewableSources: parseInt(latestCertificate['renewable-sources']) || 0,
      renewableSourcesDescription: latestCertificate['renewable-sources-description'] || undefined,
      energyTariff: latestCertificate['energy-tariff'] || '',
      mcsInstallationId: latestCertificate['mcs-installation-id'] || undefined,
      inspectionDate: latestCertificate['inspection-date'] || '',
      localAuthorityLabel: latestCertificate['local-authority-label'] || '',
      constituencyLabel: latestCertificate['constituency-label'] || '',
      tenure: latestCertificate['tenure'] || '',
      fixedLightingOutletsCount: parseInt(latestCertificate['fixed-lighting-outlets-count']) || 0,
      lowEnergyFixedLightingOutletsCount: parseInt(latestCertificate['low-energy-fixed-lighting-outlets-count']) || 0,
      uprn: latestCertificate['uprn'] || '',
      uprnSource: latestCertificate['uprn-source'] || '',
      sheffieldSolarPanel: latestCertificate['sheffield-solar-panel'] === 'Y',
      sheffieldSolarWaterHeating: latestCertificate['sheffield-solar-water-heating'] === 'Y',
      sheffieldWindTurbine: latestCertificate['sheffield-wind-turbine'] === 'Y',
      builtForm: latestCertificate['built-form'] || '',
      extensionsCount: parseInt(latestCertificate['extensions-count']) || 0,
      percentRoofArea: parseFloat(latestCertificate['percent-roof-area']) || 0,
      glazedArea: parseFloat(latestCertificate['glazed-area']) || 0,
      glazedType: latestCertificate['glazed-type'] || '',
      numberHabitableRooms: parseInt(latestCertificate['number-habitable-rooms']) || 0,
      numberHeatedRooms: parseInt(latestCertificate['number-heated-rooms']) || 0,
      lowEnergyLighting: parseInt(latestCertificate['low-energy-lighting']) || 0,
      numberOpenFireplaces: parseInt(latestCertificate['number-open-fireplaces']) || 0,
      puma: latestCertificate['puma'] || '',
    };

    return epcData;

  } catch (error) {
    logger.error('Failed to fetch EPC data from external API', error as Error);
    throw new Error(`EPC API request failed: ${error.message}`);
  }
}
