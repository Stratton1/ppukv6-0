import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { PricePaidEntry } from "../../server/types.ts";

// Request schema
const PricePaidRequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  uprn: z.string().optional(),
  address: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
});

type PricePaidRequest = z.infer<typeof PricePaidRequestSchema>;

// Response types
interface PricePaidResponse {
  success: boolean;
  data?: {
    entries: PricePaidEntry[];
    total: number;
    postcode: string;
    lastUpdated: string;
  };
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

// Fetch price paid data from HM Land Registry
async function fetchPricePaidData(request: PricePaidRequest, logger: Logger): Promise<{
  entries: PricePaidEntry[];
  total: number;
  postcode: string;
  lastUpdated: string;
}> {
  try {
    // For now, we'll implement a mock response
    // In production, this would fetch from HM Land Registry Price Paid Data
    // Available at: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
    
    const mockEntries: PricePaidEntry[] = [
      {
        transactionId: "1234567890",
        price: 450000,
        date: "2023-06-15",
        postcode: request.postcode || "EX1 1AB",
        propertyType: "Terraced",
        tenure: "Freehold",
        paon: "123",
        saon: "Flat 1",
        street: "Example Street",
        locality: "Example Town",
        town: "Example City",
        district: "Example District",
        county: "Example County",
        category: "A",
        recordStatus: "Added",
      },
      {
        transactionId: "1234567891",
        price: 380000,
        date: "2021-03-22",
        postcode: request.postcode || "EX1 1AB",
        propertyType: "Terraced",
        tenure: "Freehold",
        paon: "123",
        saon: "Flat 2",
        street: "Example Street",
        locality: "Example Town",
        town: "Example City",
        district: "Example District",
        county: "Example County",
        category: "A",
        recordStatus: "Added",
      },
      {
        transactionId: "1234567892",
        price: 520000,
        date: "2019-11-08",
        postcode: request.postcode || "EX1 1AB",
        propertyType: "Terraced",
        tenure: "Freehold",
        paon: "125",
        street: "Example Street",
        locality: "Example Town",
        town: "Example City",
        district: "Example District",
        county: "Example County",
        category: "A",
        recordStatus: "Added",
      },
    ];

    // Filter by limit
    const limitedEntries = mockEntries.slice(0, request.limit);

    logger.info("Price paid data fetched successfully", {
      entriesCount: limitedEntries.length,
      totalAvailable: mockEntries.length,
    });

    return {
      entries: limitedEntries,
      total: mockEntries.length,
      postcode: request.postcode || "EX1 1AB",
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    logger.error("Failed to fetch price paid data", error);
    throw new Error(`Price paid data fetch failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: PricePaidRequest): string {
  const identifier = request.uprn || request.postcode || request.address || request.property_id;
  return `pricepaid:${identifier}:${request.limit}`;
}

// Main handler
async function handlePricePaidRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Price paid request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = PricePaidRequestSchema.parse(body);

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
    const cachedData = await cache.get("pricepaid", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached price paid data");
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
    const pricePaidData = await fetchPricePaidData(validatedRequest, logger);

    // Cache the result (7 day TTL)
    await cache.set("pricepaid", cacheKey, pricePaidData, 7 * 24 * 60 * 60);

    const response: PricePaidResponse = {
      success: true,
      data: pricePaidData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("Price paid request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("Price paid request failed", error);

    const response: PricePaidResponse = {
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
serve(handlePricePaidRequest);
