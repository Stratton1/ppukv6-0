/**
 * PPUK v6 Flood Risk Edge Function
 * Fetches flood risk data from Environment Agency APIs
 * Created: 2025-01-03
 * Purpose: Flood risk assessment integration with caching and rate limiting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.16.1/mod.ts';
import { getServerConfig, getProviderConfig } from '../../server/env.ts';
import { CacheManager } from '../../server/cache.ts';
import { FloodRiskReport, ApiResponse, ApiError } from '../../server/types.ts';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const FloodRequestSchema = z.object({
  postcode: z.string().min(1, 'Postcode is required'),
  address: z.string().optional(),
  uprn: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

type FloodRequest = z.infer<typeof FloodRequestSchema>;

// ============================================================================
// FLOOD RISK API CLIENT
// ============================================================================

class FloodRiskAPIClient {
  private baseUrl: string;
  private apiKey?: string;
  private cache: CacheManager;

  constructor() {
    const config = getProviderConfig('flood');
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.cache = new CacheManager();
  }

  /**
   * Fetch flood risk data from Environment Agency APIs
   */
  async fetchFloodRiskData(request: FloodRequest): Promise<FloodRiskReport> {
    const cacheKey = this.generateCacheKey(request);
    
    // Try to get from cache first
    const cached = await this.cache.get<FloodRiskReport>('flood', cacheKey);
    if (cached) {
      return cached;
    }

    // Get coordinates if not provided
    let lat = request.latitude;
    let lng = request.longitude;
    
    if (!lat || !lng) {
      const coords = await this.getCoordinates(request);
      lat = coords.latitude;
      lng = coords.longitude;
    }

    // Fetch flood risk data from multiple sources
    const [surfaceWaterRisk, riverSeaRisk, groundwaterRisk, reservoirRisk] = await Promise.all([
      this.fetchSurfaceWaterRisk(lat, lng),
      this.fetchRiverSeaRisk(lat, lng),
      this.fetchGroundwaterRisk(lat, lng),
      this.fetchReservoirRisk(lat, lng),
    ]);

    // Calculate overall risk level
    const riskLevel = this.calculateOverallRisk([
      surfaceWaterRisk,
      riverSeaRisk,
      groundwaterRisk,
      reservoirRisk,
    ]);

    const riskScore = this.calculateRiskScore([
      surfaceWaterRisk,
      riverSeaRisk,
      groundwaterRisk,
      reservoirRisk,
    ]);

    // Fetch current warnings
    const warnings = await this.fetchCurrentWarnings(lat, lng);

    // Fetch historical flood data
    const historicalFloods = await this.fetchHistoricalFloods(lat, lng);

    const floodReport: FloodRiskReport = {
      address: request.address || '',
      postcode: request.postcode,
      uprn: request.uprn,
      floodRisk: {
        surfaceWater: surfaceWaterRisk,
        riversAndSea: riverSeaRisk,
        groundwater: groundwaterRisk,
        reservoirs: reservoirRisk,
      },
      riskLevel,
      riskScore,
      lastUpdated: new Date().toISOString(),
      dataSource: 'Environment Agency',
      warnings,
      historicalFloods,
    };

    // Cache the result
    await this.cache.set('flood', cacheKey, floodReport, 604800); // 7 days
    
    return floodReport;
  }

  /**
   * Get coordinates from postcode
   */
  private async getCoordinates(request: FloodRequest): Promise<{ latitude: number; longitude: number }> {
    if (request.latitude && request.longitude) {
      return { latitude: request.latitude, longitude: request.longitude };
    }

    // Use postcodes.io to get coordinates
    const response = await fetch(`https://api.postcodes.io/postcodes/${request.postcode}`);
    if (!response.ok) {
      throw new Error('Unable to resolve postcode to coordinates');
    }

    const data = await response.json();
    if (!data.result) {
      throw new Error('Invalid postcode');
    }

    return {
      latitude: data.result.latitude,
      longitude: data.result.longitude,
    };
  }

  /**
   * Fetch surface water flood risk
   */
  private async fetchSurfaceWaterRisk(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/flood-risk/surface-water?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PPUK-API-Client/1.0',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        return this.createDefaultRiskLevel('Low', 2);
      }

      const data = await response.json();
      return this.parseRiskLevel(data);
    } catch (error) {
      console.error('Surface water risk fetch error:', error);
      return this.createDefaultRiskLevel('Low', 2);
    }
  }

  /**
   * Fetch river and sea flood risk
   */
  private async fetchRiverSeaRisk(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/flood-risk/river-sea?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PPUK-API-Client/1.0',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        return this.createDefaultRiskLevel('Low', 2);
      }

      const data = await response.json();
      return this.parseRiskLevel(data);
    } catch (error) {
      console.error('River/sea risk fetch error:', error);
      return this.createDefaultRiskLevel('Low', 2);
    }
  }

  /**
   * Fetch groundwater flood risk
   */
  private async fetchGroundwaterRisk(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/flood-risk/groundwater?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PPUK-API-Client/1.0',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        return this.createDefaultRiskLevel('Low', 2);
      }

      const data = await response.json();
      return this.parseRiskLevel(data);
    } catch (error) {
      console.error('Groundwater risk fetch error:', error);
      return this.createDefaultRiskLevel('Low', 2);
    }
  }

  /**
   * Fetch reservoir flood risk
   */
  private async fetchReservoirRisk(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/flood-risk/reservoir?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PPUK-API-Client/1.0',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        return this.createDefaultRiskLevel('Very Low', 1);
      }

      const data = await response.json();
      return this.parseRiskLevel(data);
    } catch (error) {
      console.error('Reservoir risk fetch error:', error);
      return this.createDefaultRiskLevel('Very Low', 1);
    }
  }

  /**
   * Fetch current flood warnings
   */
  private async fetchCurrentWarnings(lat: number, lng: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/flood-warnings?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PPUK-API-Client/1.0',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.warnings || [];
    } catch (error) {
      console.error('Flood warnings fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch historical flood data
   */
  private async fetchHistoricalFloods(lat: number, lng: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/historical-floods?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PPUK-API-Client/1.0',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.floods || [];
    } catch (error) {
      console.error('Historical floods fetch error:', error);
      return [];
    }
  }

  /**
   * Parse risk level from API response
   */
  private parseRiskLevel(data: any): any {
    const level = data.riskLevel || data.level || 'Low';
    const score = data.riskScore || data.score || 2;
    
    return {
      level: this.normalizeRiskLevel(level),
      score: Math.max(1, Math.min(10, score)),
      description: data.description || this.getRiskDescription(level),
      probability: data.probability || this.getRiskProbability(level),
      impact: data.impact || this.getRiskImpact(level),
      mitigation: data.mitigation || this.getRiskMitigation(level),
    };
  }

  /**
   * Create default risk level
   */
  private createDefaultRiskLevel(level: string, score: number): any {
    return {
      level: this.normalizeRiskLevel(level),
      score,
      description: this.getRiskDescription(level),
      probability: this.getRiskProbability(level),
      impact: this.getRiskImpact(level),
      mitigation: this.getRiskMitigation(level),
    };
  }

  /**
   * Normalize risk level to standard format
   */
  private normalizeRiskLevel(level: string): 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High' {
    const normalized = level.toString().toLowerCase().trim();
    if (normalized.includes('very high')) return 'Very High';
    if (normalized.includes('high')) return 'High';
    if (normalized.includes('medium')) return 'Medium';
    if (normalized.includes('low')) return 'Low';
    return 'Very Low';
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRisk(risks: any[]): 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High' {
    const maxScore = Math.max(...risks.map(r => r.score));
    
    if (maxScore >= 9) return 'Very High';
    if (maxScore >= 7) return 'High';
    if (maxScore >= 5) return 'Medium';
    if (maxScore >= 3) return 'Low';
    return 'Very Low';
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(risks: any[]): number {
    const scores = risks.map(r => r.score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Get risk description
   */
  private getRiskDescription(level: string): string {
    const descriptions = {
      'Very Low': 'Minimal flood risk',
      'Low': 'Low flood risk',
      'Medium': 'Moderate flood risk',
      'High': 'High flood risk',
      'Very High': 'Very high flood risk',
    };
    return descriptions[level as keyof typeof descriptions] || 'Unknown risk level';
  }

  /**
   * Get risk probability
   */
  private getRiskProbability(level: string): string {
    const probabilities = {
      'Very Low': '1 in 1000 years',
      'Low': '1 in 100 years',
      'Medium': '1 in 30 years',
      'High': '1 in 10 years',
      'Very High': '1 in 3 years',
    };
    return probabilities[level as keyof typeof probabilities] || 'Unknown probability';
  }

  /**
   * Get risk impact
   */
  private getRiskImpact(level: string): string {
    const impacts = {
      'Very Low': 'Minimal impact',
      'Low': 'Low impact',
      'Medium': 'Moderate impact',
      'High': 'High impact',
      'Very High': 'Severe impact',
    };
    return impacts[level as keyof typeof impacts] || 'Unknown impact';
  }

  /**
   * Get risk mitigation
   */
  private getRiskMitigation(level: string): string[] {
    const mitigations = {
      'Very Low': ['Monitor weather conditions'],
      'Low': ['Monitor weather conditions', 'Check flood warnings'],
      'Medium': ['Monitor weather conditions', 'Check flood warnings', 'Prepare emergency kit'],
      'High': ['Monitor weather conditions', 'Check flood warnings', 'Prepare emergency kit', 'Consider flood insurance'],
      'Very High': ['Monitor weather conditions', 'Check flood warnings', 'Prepare emergency kit', 'Flood insurance essential', 'Consider property protection measures'],
    };
    return mitigations[level as keyof typeof mitigations] || ['Monitor weather conditions'];
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: FloodRequest): string {
    const parts = [];
    if (request.uprn) parts.push(`uprn:${request.uprn}`);
    if (request.postcode) parts.push(`postcode:${request.postcode}`);
    if (request.latitude && request.longitude) {
      parts.push(`lat:${request.latitude.toFixed(4)}`);
      parts.push(`lng:${request.longitude.toFixed(4)}`);
    }
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
    code: 'FLOOD_API_ERROR',
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
    let requestData: FloodRequest;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      requestData = {
        postcode: url.searchParams.get('postcode') || '',
        address: url.searchParams.get('address') || undefined,
        uprn: url.searchParams.get('uprn') || undefined,
        latitude: url.searchParams.get('latitude') ? parseFloat(url.searchParams.get('latitude')!) : undefined,
        longitude: url.searchParams.get('longitude') ? parseFloat(url.searchParams.get('longitude')!) : undefined,
      };
    } else {
      const body = await req.json();
      requestData = body;
    }

    // Validate request
    const validationResult = FloodRequestSchema.safeParse(requestData);
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

    // Fetch flood risk data
    const floodClient = new FloodRiskAPIClient();
    const floodData = await floodClient.fetchFloodRiskData(validationResult.data);

    // Return success response
    return createSuccessResponse(floodData, requestId);

  } catch (error) {
    console.error('Flood function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage, 500);
  }
});
