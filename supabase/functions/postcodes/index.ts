/**
 * PPUK v6 Postcodes Edge Function
 * Fetches postcode data from postcodes.io API
 * Created: 2025-01-03
 * Purpose: Postcode validation and geocoding with caching and rate limiting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';
import { getServerConfig, getProviderConfig } from '../../server/env.ts';
import { CacheManager } from '../../server/cache.ts';
import { PostcodeData, ApiResponse, ApiError } from '../../server/types.ts';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const PostcodeRequestSchema = z.object({
  postcode: z.string().min(1, 'Postcode is required'),
  validate: z.boolean().optional().default(true),
});

type PostcodeRequest = z.infer<typeof PostcodeRequestSchema>;

// ============================================================================
// POSTCODES API CLIENT
// ============================================================================

class PostcodesAPIClient {
  private baseUrl: string;
  private cache: CacheManager;

  constructor() {
    const config = getProviderConfig('postcodes');
    this.baseUrl = config.baseUrl;
    this.cache = new CacheManager();
  }

  /**
   * Fetch postcode data from postcodes.io API
   */
  async fetchPostcodeData(request: PostcodeRequest): Promise<PostcodeData> {
    const cacheKey = this.generateCacheKey(request);
    
    // Try to get from cache first
    const cached = await this.cache.get<PostcodeData>('postcodes', cacheKey);
    if (cached) {
      return cached;
    }

    // Validate postcode format if requested
    if (request.validate && !this.isValidPostcode(request.postcode)) {
      throw new Error('Invalid postcode format');
    }

    // Make API request
    const response = await fetch(`${this.baseUrl}/postcodes/${encodeURIComponent(request.postcode)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PPUK-API-Client/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Postcode not found');
      }
      throw new Error(`Postcodes API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.result) {
      throw new Error('Invalid postcode data received');
    }

    const postcodeData = this.transformPostcodeData(data.result);
    
    // Cache the result
    await this.cache.set('postcodes', cacheKey, postcodeData, 86400); // 24 hours
    
    return postcodeData;
  }

  /**
   * Search postcodes by query
   */
  async searchPostcodes(query: string, limit: number = 10): Promise<PostcodeData[]> {
    const cacheKey = `search:${query}:${limit}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<PostcodeData[]>('postcodes', cacheKey);
    if (cached) {
      return cached;
    }

    // Make API request
    const response = await fetch(`${this.baseUrl}/postcodes?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PPUK-API-Client/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Postcodes search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }

    const postcodeData = data.result.map((result: any) => this.transformPostcodeData(result));
    
    // Cache the result
    await this.cache.set('postcodes', cacheKey, postcodeData, 3600); // 1 hour
    
    return postcodeData;
  }

  /**
   * Get postcode from coordinates
   */
  async getPostcodeFromCoordinates(latitude: number, longitude: number): Promise<PostcodeData | null> {
    const cacheKey = `reverse:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<PostcodeData>('postcodes', cacheKey);
    if (cached) {
      return cached;
    }

    // Make API request
    const response = await fetch(`${this.baseUrl}/postcodes?lat=${latitude}&lon=${longitude}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PPUK-API-Client/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Postcodes reverse API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.result) {
      return null;
    }

    const postcodeData = this.transformPostcodeData(data.result);
    
    // Cache the result
    await this.cache.set('postcodes', cacheKey, postcodeData, 86400); // 24 hours
    
    return postcodeData;
  }

  /**
   * Transform raw postcode API data to our domain model
   */
  private transformPostcodeData(data: any): PostcodeData {
    return {
      postcode: data.postcode || '',
      quality: parseInt(data.quality) || 0,
      eastings: parseInt(data.eastings) || 0,
      northings: parseInt(data.northings) || 0,
      country: data.country || '',
      nhs_ha: data.nhs_ha || '',
      longitude: parseFloat(data.longitude) || 0,
      latitude: parseFloat(data.latitude) || 0,
      parliamentary_constituency: data.parliamentary_constituency || '',
      european_electoral_region: data.european_electoral_region || '',
      primary_care_trust: data.primary_care_trust || '',
      region: data.region || '',
      lsoa: data.lsoa || '',
      msoa: data.msoa || '',
      incode: data.incode || '',
      outcode: data.outcode || '',
      admin_district: data.admin_district || '',
      parish: data.parish || '',
      admin_county: data.admin_county || undefined,
      admin_ward: data.admin_ward || '',
      ced: data.ced || undefined,
      ccg: data.ccg || '',
      nuts: data.nuts || '',
      codes: {
        admin_district: data.codes?.admin_district || '',
        admin_county: data.codes?.admin_county || undefined,
        admin_ward: data.codes?.admin_ward || '',
        parish: data.codes?.parish || '',
        parliamentary_constituency: data.codes?.parliamentary_constituency || '',
        ccg: data.codes?.ccg || '',
        ccg_id: data.codes?.ccg_id || '',
        ced: data.codes?.ced || undefined,
        nuts: {
          code: data.codes?.nuts?.code || '',
          name: data.codes?.nuts?.name || '',
        },
      },
    };
  }

  /**
   * Validate postcode format
   */
  private isValidPostcode(postcode: string): boolean {
    // UK postcode regex pattern
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: PostcodeRequest): string {
    return `postcode:${request.postcode.toLowerCase().replace(/\s/g, '')}`;
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

// ============================================================================
// ERROR HANDLING
// ============================================================================

function createErrorResponse(error: string, status: number = 500): Response {
  const errorResponse: ApiError = {
    code: 'POSTCODES_API_ERROR',
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

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const userId = await authenticateUser(authHeader);

    // Parse request
    let requestData: PostcodeRequest;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action') || 'lookup';
      
      if (action === 'search') {
        const query = url.searchParams.get('q');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        if (!query) {
          return createErrorResponse('Search query is required', 400);
        }

        const postcodesClient = new PostcodesAPIClient();
        const results = await postcodesClient.searchPostcodes(query, limit);
        return createSuccessResponse(results, requestId);
      }
      
      if (action === 'reverse') {
        const lat = parseFloat(url.searchParams.get('lat') || '0');
        const lng = parseFloat(url.searchParams.get('lng') || '0');
        
        if (lat === 0 && lng === 0) {
          return createErrorResponse('Latitude and longitude are required', 400);
        }

        const postcodesClient = new PostcodesAPIClient();
        const result = await postcodesClient.getPostcodeFromCoordinates(lat, lng);
        return createSuccessResponse(result, requestId);
      }
      
      // Default to lookup
      requestData = {
        postcode: url.searchParams.get('postcode') || '',
        validate: url.searchParams.get('validate') !== 'false',
      };
    } else {
      const body = await req.json();
      requestData = body;
    }

    // Validate request
    const validationResult = PostcodeRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return createErrorResponse(
        `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    // Fetch postcode data
    const postcodesClient = new PostcodesAPIClient();
    const postcodeData = await postcodesClient.fetchPostcodeData(validationResult.data);

    // Return success response
    return createSuccessResponse(postcodeData, requestId);

  } catch (error) {
    console.error('Postcodes function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage, 500);
  }
});
