/**
 * PPUK v6 EPC Edge Function
 * Fetches Energy Performance Certificate data from UK EPC Open Data
 * Created: 2025-01-03
 * Purpose: EPC data integration with caching and rate limiting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';
import { getServerConfig, getProviderConfig } from '../../server/env.ts';
import { CacheManager } from '../../server/cache.ts';
import { EPCReport, ApiResponse, ApiError } from '../../server/types.ts';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const EPCRequestSchema = z.object({
  postcode: z.string().min(1, 'Postcode is required'),
  address: z.string().optional(),
  uprn: z.string().optional(),
  rrn: z.string().optional(), // Report Reference Number
});

type EPCRequest = z.infer<typeof EPCRequestSchema>;

// ============================================================================
// EPC API CLIENT
// ============================================================================

class EPCAPIClient {
  private baseUrl: string;
  private apiKey?: string;
  private cache: CacheManager;

  constructor() {
    const config = getProviderConfig('epc');
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.cache = new CacheManager();
  }

  /**
   * Fetch EPC data from UK EPC Open Data API
   */
  async fetchEPCData(request: EPCRequest): Promise<EPCReport[]> {
    const cacheKey = this.generateCacheKey(request);
    
    // Try to get from cache first
    const cached = await this.cache.get<EPCReport[]>('epc', cacheKey);
    if (cached) {
      return cached;
    }

    // Build API URL
    const url = this.buildAPIUrl(request);
    
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PPUK-API-Client/1.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`EPC API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const epcReports = this.transformEPCData(data, request);
    
    // Cache the result
    await this.cache.set('epc', cacheKey, epcReports, 86400); // 24 hours
    
    return epcReports;
  }

  /**
   * Build API URL for EPC request
   */
  private buildAPIUrl(request: EPCRequest): string {
    const url = new URL('/domestic/search', this.baseUrl);
    
    if (request.rrn) {
      url.searchParams.set('report-reference-number', request.rrn);
    } else if (request.uprn) {
      url.searchParams.set('uprn', request.uprn);
    } else if (request.postcode) {
      url.searchParams.set('postcode', request.postcode);
      if (request.address) {
        url.searchParams.set('address', request.address);
      }
    }
    
    // Add common parameters
    url.searchParams.set('size', '100');
    url.searchParams.set('from-date', '2008-01-01');
    url.searchParams.set('to-date', new Date().toISOString().split('T')[0]);
    
    return url.toString();
  }

  /**
   * Transform raw EPC API data to our domain model
   */
  private transformEPCData(data: any, request: EPCRequest): EPCReport[] {
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: any) => ({
      certificateNumber: result.certificateNumber || '',
      address: result.address || request.address || '',
      postcode: result.postcode || request.postcode,
      propertyType: result.propertyType || '',
      builtForm: result.builtForm || '',
      totalFloorArea: parseFloat(result.totalFloorArea) || 0,
      currentRating: this.normalizeRating(result.currentRating),
      currentEfficiency: parseInt(result.currentEfficiency) || 0,
      environmentalImpactRating: this.normalizeRating(result.environmentalImpactRating),
      environmentalImpactEfficiency: parseInt(result.environmentalImpactEfficiency) || 0,
      mainFuelType: result.mainFuelType || '',
      mainHeatingDescription: result.mainHeatingDescription || '',
      hotWaterDescription: result.hotWaterDescription || '',
      lightingDescription: result.lightingDescription || '',
      windowsDescription: result.windowsDescription || '',
      wallsDescription: result.wallsDescription || '',
      roofDescription: result.roofDescription || '',
      floorDescription: result.floorDescription || '',
      co2EmissionsCurrent: parseFloat(result.co2EmissionsCurrent) || 0,
      co2EmissionsPotential: parseFloat(result.co2EmissionsPotential) || 0,
      totalCostCurrent: parseFloat(result.totalCostCurrent) || 0,
      totalCostPotential: parseFloat(result.totalCostPotential) || 0,
      inspectionDate: result.inspectionDate || '',
      localAuthority: result.localAuthority || '',
      constituency: result.constituency || '',
      county: result.county || '',
      tenure: result.tenure || '',
      uprn: result.uprn || request.uprn || '',
      created_at: new Date().toISOString(),
      expires_at: this.calculateExpiryDate(result.inspectionDate),
    }));
  }

  /**
   * Normalize EPC rating to standard format
   */
  private normalizeRating(rating: string): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' {
    const normalized = rating?.toString().toUpperCase().trim();
    if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(normalized)) {
      return normalized as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
    }
    return 'G'; // Default to worst rating if invalid
  }

  /**
   * Calculate EPC expiry date (10 years from inspection)
   */
  private calculateExpiryDate(inspectionDate: string): string {
    if (!inspectionDate) {
      return new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    const inspection = new Date(inspectionDate);
    const expiry = new Date(inspection.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
    return expiry.toISOString();
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: EPCRequest): string {
    const parts = [];
    if (request.rrn) parts.push(`rrn:${request.rrn}`);
    if (request.uprn) parts.push(`uprn:${request.uprn}`);
    if (request.postcode) parts.push(`postcode:${request.postcode}`);
    if (request.address) parts.push(`address:${request.address}`);
    return parts.join('|');
  }
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

async function authenticateUser(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user.id;
}

async function authorizePropertyAccess(userId: string, propertyId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .from('property_parties')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function createErrorResponse(error: string, status: number = 500): Response {
  const errorResponse: ApiError = {
    code: 'EPC_API_ERROR',
    message: error,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };

  return new Response(JSON.stringify({
    success: false,
    error: errorResponse,
    timestamp: new Date().toISOString(),
    requestId: errorResponse.requestId,
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function createSuccessResponse<T>(data: T, requestId: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Only allow GET and POST
    if (req.method !== 'GET' && req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse request body
    let requestData: EPCRequest;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      requestData = {
        postcode: url.searchParams.get('postcode') || '',
        address: url.searchParams.get('address') || undefined,
        uprn: url.searchParams.get('uprn') || undefined,
        rrn: url.searchParams.get('rrn') || undefined,
      };
    } else {
      const body = await req.json();
      requestData = body;
    }

    // Validate request
    const validationResult = EPCRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return createErrorResponse(
        `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const userId = await authenticateUser(authHeader);

    // Check if property access is required (if property_id is provided)
    const propertyId = req.headers.get('X-Property-ID');
    if (propertyId && !(await authorizePropertyAccess(userId, propertyId))) {
      return createErrorResponse('Access denied to property', 403);
    }

    // Fetch EPC data
    const epcClient = new EPCAPIClient();
    const epcData = await epcClient.fetchEPCData(validationResult.data);

    // Return success response
    return createSuccessResponse(epcData, requestId);

  } catch (error) {
    console.error('EPC function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage, 500);
  }
});
