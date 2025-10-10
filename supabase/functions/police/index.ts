import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { CrimeStats } from "../../server/types.ts";

// Request schema
const PoliceRequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  date: z.string().optional(), // YYYY-MM format
  months: z.number().min(1).max(12).default(6),
});

type PoliceRequest = z.infer<typeof PoliceRequestSchema>;

// Response types
interface PoliceResponse {
  success: boolean;
  data?: CrimeStats;
  error?: string;
  requestId: string;
  cached?: boolean;
  cacheExpiresAt?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize cache manager
const cache = new CacheManager();

// Logger utility
class Logger {
  private requestId: string;

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  info(message: string, data?: any) {
    console.log(`[${this.requestId}] INFO: ${message}`, data ? JSON.stringify(data) : "");
  }

  error(message: string, error?: any) {
    console.error(`[${this.requestId}] ERROR: ${message}`, error ? JSON.stringify(error) : "");
  }

  warn(message: string, data?: any) {
    console.warn(`[${this.requestId}] WARN: ${message}`, data ? JSON.stringify(data) : "");
  }
}

// Authentication and authorization
async function authenticateUser(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error("Invalid authentication token");
    }

    return user.id;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function authorizePropertyAccess(userId: string, propertyId: string): Promise<boolean> {
  try {
    // Check if user is property owner
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("claimed_by")
      .eq("id", propertyId)
      .single();

    if (propertyError) {
      throw new Error(`Property not found: ${propertyError.message}`);
    }

    if (property.claimed_by === userId) {
      return true;
    }

    // Check if user has access via property parties
    const { data: party, error: partyError } = await supabase
      .from("property_parties")
      .select("role")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .in("role", ["owner", "purchaser", "tenant", "agent", "surveyor", "conveyancer", "solicitor"])
      .single();

    if (partyError) {
      return false;
    }

    return !!party;
  } catch (error) {
    console.error("Authorization check failed:", error);
    return false;
  }
}

// Fetch crime data from UK Police API
async function fetchCrimeData(request: PoliceRequest, logger: Logger): Promise<CrimeStats> {
  try {
    // For now, we'll implement a mock response
    // In production, this would integrate with UK Police API
    // Documentation: https://data.police.uk/docs/
    
    const mockCrimeStats: CrimeStats = {
      area: request.postcode || "EX1 1AB",
      period: request.date || "2024-01",
      totalCrimes: 45,
      crimesByCategory: [
        {
          category: "Anti-social behaviour",
          count: 12,
          percentage: 26.7,
        },
        {
          category: "Violence and sexual offences",
          count: 8,
          percentage: 17.8,
        },
        {
          category: "Vehicle crime",
          count: 6,
          percentage: 13.3,
        },
        {
          category: "Criminal damage and arson",
          count: 5,
          percentage: 11.1,
        },
        {
          category: "Burglary",
          count: 4,
          percentage: 8.9,
        },
        {
          category: "Other theft",
          count: 4,
          percentage: 8.9,
        },
        {
          category: "Public order",
          count: 3,
          percentage: 6.7,
        },
        {
          category: "Drugs",
          count: 2,
          percentage: 4.4,
        },
        {
          category: "Robbery",
          count: 1,
          percentage: 2.2,
        },
      ],
      crimeRate: 2.3, // crimes per 1000 people
      comparison: {
        nationalAverage: 3.1,
        localAuthorityAverage: 2.8,
        percentile: 25, // Lower is safer
      },
    };

    logger.info("Crime data fetched successfully", {
      totalCrimes: mockCrimeStats.totalCrimes,
      crimeRate: mockCrimeStats.crimeRate,
      categories: mockCrimeStats.crimesByCategory.length,
    });

    return mockCrimeStats;

  } catch (error) {
    logger.error("Failed to fetch crime data", error);
    throw new Error(`Crime data fetch failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: PoliceRequest): string {
  const identifier = request.postcode || `${request.latitude},${request.longitude}` || request.property_id;
  return `police:${identifier}:${request.date || 'current'}:${request.months}`;
}

// Main handler
async function handlePoliceRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Police request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = PoliceRequestSchema.parse(body);

    // Authenticate user
    const authHeader = request.headers.get("Authorization");
    const userId = await authenticateUser(authHeader);

    // Authorize property access
    const hasAccess = await authorizePropertyAccess(userId, validatedRequest.property_id);
    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Access denied to property",
          requestId,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check cache first
    const cacheKey = generateCacheKey(validatedRequest);
    const cachedData = await cache.get("police", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached crime data");
      return new Response(JSON.stringify({
        success: true,
        data: cachedData,
        requestId,
        cached: true,
        cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch fresh data
    const crimeData = await fetchCrimeData(validatedRequest, logger);

    // Cache the result (7 day TTL)
    await cache.set("police", cacheKey, crimeData, 7 * 24 * 60 * 60);

    const response: PoliceResponse = {
      success: true,
      data: crimeData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("Police request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("Police request failed", error);

    const response: PoliceResponse = {
      success: false,
      error: error.message,
      requestId,
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Serve the function
serve(handlePoliceRequest);
