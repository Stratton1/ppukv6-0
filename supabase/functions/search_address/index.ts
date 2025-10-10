/**
 * PPUK v6 Address Search Edge Function
 * Searches addresses using OS Places and postcodes.io APIs
 * Created: 2025-01-03
 * Purpose: Address search and validation with multiple data sources
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';
import { getServerConfig, getProviderConfig } from '../../server/env.ts';
import { CacheManager } from '../../server/cache.ts';
import { AddressSearchResult, AddressSearchResponse, ApiResponse, ApiError } from '../../server/types.ts';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const AddressSearchRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(50).optional().default(10),
  include_postcodes: z.boolean().optional().default(true),
  include_osplaces: z.boolean().optional().default(true),
  postcode_only: z.boolean().optional().default(false),
});

type AddressSearchRequest = z.infer<typeof AddressSearchRequestSchema>;

// ============================================================================
// ADDRESS SEARCH CLIENT
// ============================================================================

class AddressSearchClient {
  private cache: CacheManager;
  private postcodesConfig: any;
  private osplacesConfig: any;

  constructor() {
    this.cache = new CacheManager();
    this.postcodesConfig = getProviderConfig('postcodes');
    this.osplacesConfig = getProviderConfig('osplaces');
  }

  /**
   * Search addresses using multiple sources
   */
  async searchAddresses(request: AddressSearchRequest): Promise<AddressSearchResponse> {
    const cacheKey = this.generateCacheKey(request);
    
    // Try to get from cache first
    const cached = await this.cache.get<AddressSearchResponse>('postcodes', cacheKey);
    if (cached) {
      return cached;
    }

    const results: AddressSearchResult[] = [];
    const suggestions: string[] = [];

    // Search postcodes.io if enabled
    if (request.include_postcodes) {
      try {
        const postcodeResults = await this.searchPostcodes(request.query, request.limit);
        results.push(...postcodeResults);
      } catch (error) {
        console.error('Postcodes search error:', error);
      }
    }

    // Search OS Places if enabled and we have an API key
    if (request.include_osplaces && this.osplacesConfig.apiKey) {
      try {
        const osplacesResults = await this.searchOSPlaces(request.query, request.limit);
        results.push(...osplacesResults);
      } catch (error) {
        console.error('OS Places search error:', error);
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = this.deduplicateResults(results);
    const sortedResults = this.sortResultsByRelevance(uniqueResults, request.query);

    // Generate suggestions
    const addressSuggestions = this.generateSuggestions(sortedResults, request.query);
    suggestions.push(...addressSuggestions);

    const response: AddressSearchResponse = {
      results: sortedResults.slice(0, request.limit),
      total: sortedResults.length,
      query: request.query,
      suggestions: suggestions.slice(0, 5),
    };

    // Cache the result
    await this.cache.set('postcodes', cacheKey, response, 3600); // 1 hour
    
    return response;
  }

  /**
   * Search using postcodes.io API
   */
  private async searchPostcodes(query: string, limit: number): Promise<AddressSearchResult[]> {
    const response = await fetch(`${this.postcodesConfig.baseUrl}/postcodes?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PPUK-API-Client/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Postcodes API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.result || !Array.isArray(data.result)) {
      return [];
    }

    return data.result.map((result: any) => this.transformPostcodeResult(result));
  }

  /**
   * Search using OS Places API
   */
  private async searchOSPlaces(query: string, limit: number): Promise<AddressSearchResult[]> {
    const response = await fetch(`${this.osplacesConfig.baseUrl}/addresses?query=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PPUK-API-Client/1.0',
        'Authorization': `Bearer ${this.osplacesConfig.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OS Places API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: any) => this.transformOSPlacesResult(result));
  }

  /**
   * Transform postcodes.io result to our format
   */
  private transformPostcodeResult(result: any): AddressSearchResult {
    return {
      uprn: result.uprn || '',
      address: result.address || '',
      postcode: result.postcode || '',
      easting: result.eastings || 0,
      northing: result.northings || 0,
      latitude: result.latitude || 0,
      longitude: result.longitude || 0,
      classification: result.classification || '',
      local_type: result.local_type || '',
      administrative_area: result.administrative_area || '',
      district_borough: result.district_borough || '',
      county_unitary: result.county_unitary || '',
      region: result.region || '',
      country: result.country || 'England',
      created_date: result.created_date || '',
      last_updated_date: result.last_updated_date || '',
    };
  }

  /**
   * Transform OS Places result to our format
   */
  private transformOSPlacesResult(result: any): AddressSearchResult {
    return {
      uprn: result.uprn || '',
      address: result.address || '',
      postcode: result.postcode || '',
      easting: result.easting || 0,
      northing: result.northing || 0,
      latitude: result.latitude || 0,
      longitude: result.longitude || 0,
      classification: result.classification || '',
      local_type: result.local_type || '',
      administrative_area: result.administrative_area || '',
      district_borough: result.district_borough || '',
      county_unitary: result.county_unitary || '',
      region: result.region || '',
      country: result.country || 'England',
      created_date: result.created_date || '',
      last_updated_date: result.last_updated_date || '',
    };
  }

  /**
   * Remove duplicate results based on UPRN
   */
  private deduplicateResults(results: AddressSearchResult[]): AddressSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.uprn)) {
        return false;
      }
      seen.add(result.uprn);
      return true;
    });
  }

  /**
   * Sort results by relevance to query
   */
  private sortResultsByRelevance(results: AddressSearchResult[], query: string): AddressSearchResult[] {
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      // Exact matches first
      const aExact = a.address.toLowerCase().includes(queryLower);
      const bExact = b.address.toLowerCase().includes(queryLower);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Postcode matches
      const aPostcode = a.postcode.toLowerCase().includes(queryLower);
      const bPostcode = b.postcode.toLowerCase().includes(queryLower);
      
      if (aPostcode && !bPostcode) return -1;
      if (!aPostcode && bPostcode) return 1;
      
      // Alphabetical order
      return a.address.localeCompare(b.address);
    });
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(results: AddressSearchResult[], query: string): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Extract unique postcodes
    const postcodes = [...new Set(results.map(r => r.postcode))].filter(p => 
      p.toLowerCase().includes(queryLower)
    );
    
    // Extract unique areas
    const areas = [...new Set(results.map(r => r.district_borough))].filter(a => 
      a.toLowerCase().includes(queryLower)
    );
    
    // Extract unique streets
    const streets = [...new Set(results.map(r => {
      const parts = r.address.split(',');
      return parts[0]?.trim();
    }))].filter(s => 
      s.toLowerCase().includes(queryLower)
    );
    
    suggestions.push(...postcodes.slice(0, 2));
    suggestions.push(...areas.slice(0, 2));
    suggestions.push(...streets.slice(0, 1));
    
    return suggestions.filter(Boolean);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AddressSearchRequest): string {
    return `search:${request.query.toLowerCase()}:${request.limit}:${request.include_postcodes}:${request.include_osplaces}`;
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
    code: 'ADDRESS_SEARCH_ERROR',
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
    let requestData: AddressSearchRequest;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      requestData = {
        query: url.searchParams.get('q') || url.searchParams.get('query') || '',
        limit: parseInt(url.searchParams.get('limit') || '10'),
        include_postcodes: url.searchParams.get('include_postcodes') !== 'false',
        include_osplaces: url.searchParams.get('include_osplaces') !== 'false',
        postcode_only: url.searchParams.get('postcode_only') === 'true',
      };
    } else {
      const body = await req.json();
      requestData = body;
    }

    // Validate request
    const validationResult = AddressSearchRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return createErrorResponse(
        `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const userId = await authenticateUser(authHeader);

    // Search addresses
    const searchClient = new AddressSearchClient();
    const searchResults = await searchClient.searchAddresses(validationResult.data);

    // Return success response
    return createSuccessResponse(searchResults, requestId);

  } catch (error) {
    console.error('Address search function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage, 500);
  }
});
