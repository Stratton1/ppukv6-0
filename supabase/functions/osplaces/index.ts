import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { ExternalLinksPayload } from "../../server/types.ts";

// Request schema
const OSPlacesRequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  uprn: z.string().optional(),
  address: z.string().optional(),
});

type OSPlacesRequest = z.infer<typeof OSPlacesRequestSchema>;

// Response types
interface OSPlacesResponse {
  success: boolean;
  data?: ExternalLinksPayload;
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

// Generate OS Places links and guidance
async function generateOSPlacesLinks(request: OSPlacesRequest, logger: Logger): Promise<ExternalLinksPayload> {
  try {
    const linksPayload: ExternalLinksPayload = {
      kind: "links",
      title: "OS Places API - Address Data",
      description: "Access to Ordnance Survey Places API for detailed address information, UPRN lookups, and geocoding services. Note: This is a paid service requiring API key registration.",
      items: [
        {
          label: "OS Places API Documentation",
          url: "https://osdatahub.os.uk/docs/places/overview",
          notes: "Official documentation for OS Places API including authentication and usage examples",
          parameters: {
            service: "places",
            version: "v1",
            format: "json",
          },
        },
        {
          label: "OS Data Hub Registration",
          url: "https://osdatahub.os.uk/",
          notes: "Register for OS Data Hub to access Places API and other Ordnance Survey services",
          parameters: {
            service: "places",
            plan: "developer",
          },
        },
        {
          label: "OS Places API Explorer",
          url: "https://osdatahub.os.uk/docs/places/overview",
          notes: "Interactive API explorer to test Places API endpoints and parameters",
          parameters: {
            endpoint: "places",
            method: "GET",
            format: "json",
          },
        },
        {
          label: "UPRN Lookup Service",
          url: "https://osdatahub.os.uk/docs/places/overview",
          notes: "Service to lookup Unique Property Reference Numbers (UPRN) for addresses",
          parameters: {
            query: request.address || request.postcode || "",
            uprn: request.uprn || "",
          },
        },
        {
          label: "Address Search API",
          url: "https://osdatahub.os.uk/docs/places/overview",
          notes: "Search for addresses using postcode, street name, or partial address",
          parameters: {
            postcode: request.postcode || "",
            street: request.address || "",
            limit: "10",
          },
        },
        {
          label: "Geocoding Service",
          url: "https://osdatahub.os.uk/docs/places/overview",
          notes: "Convert addresses to coordinates and vice versa",
          parameters: {
            address: request.address || "",
            postcode: request.postcode || "",
            format: "json",
          },
        },
        {
          label: "Alternative: Postcodes.io",
          url: "https://postcodes.io/",
          notes: "Free alternative for postcode lookups and geocoding (limited functionality)",
          parameters: {
            postcode: request.postcode || "",
            format: "json",
          },
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    logger.info("OS Places links generated successfully", {
      itemsCount: linksPayload.items.length,
      address: request.address,
      postcode: request.postcode,
    });

    return linksPayload;

  } catch (error) {
    logger.error("Failed to generate OS Places links", error);
    throw new Error(`OS Places links generation failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: OSPlacesRequest): string {
  const identifier = request.uprn || request.postcode || request.address || request.property_id;
  return `osplaces:${identifier}`;
}

// Main handler
async function handleOSPlacesRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("OS Places request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = OSPlacesRequestSchema.parse(body);

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
    const cachedData = await cache.get("osplaces", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached OS Places links");
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

    // Generate fresh links
    const osplacesData = await generateOSPlacesLinks(validatedRequest, logger);

    // Cache the result (7 day TTL)
    await cache.set("osplaces", cacheKey, osplacesData, 7 * 24 * 60 * 60);

    const response: OSPlacesResponse = {
      success: true,
      data: osplacesData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("OS Places request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("OS Places request failed", error);

    const response: OSPlacesResponse = {
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
serve(handleOSPlacesRequest);
