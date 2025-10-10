import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { ExternalLinksPayload } from "../../server/types.ts";

// Request schema
const VOARequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  uprn: z.string().optional(),
  address: z.string().optional(),
});

type VOARequest = z.infer<typeof VOARequestSchema>;

// Response types
interface VOAResponse {
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

// Generate VOA links and guidance
async function generateVOALinks(request: VOARequest, logger: Logger): Promise<ExternalLinksPayload> {
  try {
    const linksPayload: ExternalLinksPayload = {
      kind: "links",
      title: "Valuation Office Agency (VOA) - Council Tax",
      description: "Access to council tax band information and property valuations through official government services. These services provide details about council tax bands, property values, and appeals processes.",
      items: [
        {
          label: "Check Council Tax Band",
          url: "https://www.gov.uk/council-tax-bands",
          notes: "Official government service to check council tax band for any property",
          parameters: {
            postcode: request.postcode || "",
            address: request.address || "",
          },
        },
        {
          label: "VOA Property Search",
          url: "https://www.tax.service.gov.uk/check-council-tax-band",
          notes: "Direct access to VOA's property search tool for detailed valuation information",
          parameters: {
            postcode: request.postcode || "",
            uprn: request.uprn || "",
          },
        },
        {
          label: "Council Tax Appeals",
          url: "https://www.gov.uk/challenge-council-tax-band",
          notes: "Information about challenging your council tax band if you believe it's incorrect",
          parameters: {
            reason: "valuation",
            property_type: "residential",
          },
        },
        {
          label: "VOA Contact Information",
          url: "https://www.gov.uk/contact-voa",
          notes: "Contact the Valuation Office Agency directly for specific property queries",
          parameters: {
            service: "council_tax",
            region: "england",
          },
        },
        {
          label: "Council Tax Bands Guide",
          url: "https://www.gov.uk/council-tax-bands",
          notes: "Comprehensive guide to understanding council tax bands and how they're calculated",
          parameters: {
            guide_type: "bands",
            property_type: "residential",
          },
        },
        {
          label: "Local Authority Contact",
          url: "https://www.gov.uk/find-local-council",
          notes: "Find your local council for specific council tax queries and payments",
          parameters: {
            postcode: request.postcode || "",
            service: "council_tax",
          },
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    logger.info("VOA links generated successfully", {
      itemsCount: linksPayload.items.length,
      address: request.address,
      postcode: request.postcode,
    });

    return linksPayload;

  } catch (error) {
    logger.error("Failed to generate VOA links", error);
    throw new Error(`VOA links generation failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: VOARequest): string {
  const identifier = request.uprn || request.postcode || request.address || request.property_id;
  return `voa:${identifier}`;
}

// Main handler
async function handleVOARequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("VOA request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = VOARequestSchema.parse(body);

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
    const cachedData = await cache.get("voa", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached VOA links");
      return new Response(JSON.stringify({
        success: true,
        data: cachedData,
        requestId,
        cached: true,
        cacheExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate fresh links
    const voaData = await generateVOALinks(validatedRequest, logger);

    // Cache the result (30 day TTL)
    await cache.set("voa", cacheKey, voaData, 30 * 24 * 60 * 60);

    const response: VOAResponse = {
      success: true,
      data: voaData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("VOA request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("VOA request failed", error);

    const response: VOAResponse = {
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
serve(handleVOARequest);
