import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { ExternalLinksPayload } from "../../server/types.ts";

// Request schema
const InspireRequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  uprn: z.string().optional(),
  address: z.string().optional(),
});

type InspireRequest = z.infer<typeof InspireRequestSchema>;

// Response types
interface InspireResponse {
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

// Generate INSPIRE links and guidance
async function generateInspireLinks(request: InspireRequest, logger: Logger): Promise<ExternalLinksPayload> {
  try {
    const linksPayload: ExternalLinksPayload = {
      kind: "links",
      title: "INSPIRE / National Polygon Service",
      description: "Access to property boundary and land parcel data through official government services. These services provide detailed spatial information about property boundaries, land use, and environmental constraints.",
      items: [
        {
          label: "INSPIRE Portal",
          url: "https://inspire.ec.europa.eu/",
          notes: "European INSPIRE directive portal for spatial data access",
          parameters: {
            search: request.address || request.postcode || "",
            country: "GB",
          },
        },
        {
          label: "National Polygon Service",
          url: "https://www.gov.uk/government/collections/national-polygon-service",
          notes: "HM Land Registry's National Polygon Service for property boundary data",
          parameters: {
            postcode: request.postcode || "",
            uprn: request.uprn || "",
          },
        },
        {
          label: "Land Registry INSPIRE Data",
          url: "https://www.gov.uk/government/collections/land-registry-inspire-data",
          notes: "Download INSPIRE-compliant property boundary datasets",
          parameters: {
            format: "GML",
            coordinate_system: "EPSG:27700",
          },
        },
        {
          label: "Environment Agency INSPIRE",
          url: "https://environment.data.gov.uk/",
          notes: "Environmental data including flood zones, protected areas, and land use",
          parameters: {
            service: "WFS",
            version: "2.0.0",
            typename: "ef:FloodZone",
          },
        },
        {
          label: "Natural England Open Data",
          url: "https://naturalengland-defra.opendata.arcgis.com/",
          notes: "Protected areas, nature reserves, and environmental constraints",
          parameters: {
            search: request.address || request.postcode || "",
            category: "Protected Areas",
          },
        },
        {
          label: "Ordnance Survey Open Data",
          url: "https://www.ordnancesurvey.co.uk/business-government/products/open-map-products",
          notes: "Free OS OpenData products including property boundaries and land use",
          parameters: {
            product: "OS Open Map Local",
            format: "ESRI Shapefile",
          },
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    logger.info("INSPIRE links generated successfully", {
      itemsCount: linksPayload.items.length,
      address: request.address,
      postcode: request.postcode,
    });

    return linksPayload;

  } catch (error) {
    logger.error("Failed to generate INSPIRE links", error);
    throw new Error(`INSPIRE links generation failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: InspireRequest): string {
  const identifier = request.uprn || request.postcode || request.address || request.property_id;
  return `inspire:${identifier}`;
}

// Main handler
async function handleInspireRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("INSPIRE request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = InspireRequestSchema.parse(body);

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
    const cachedData = await cache.get("inspire", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached INSPIRE links");
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
    const inspireData = await generateInspireLinks(validatedRequest, logger);

    // Cache the result (7 day TTL)
    await cache.set("inspire", cacheKey, inspireData, 7 * 24 * 60 * 60);

    const response: InspireResponse = {
      success: true,
      data: inspireData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("INSPIRE request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("INSPIRE request failed", error);

    const response: InspireResponse = {
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
serve(handleInspireRequest);
