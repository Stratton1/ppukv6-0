import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { ExternalLinksPayload } from "../../server/types.ts";

// Request schema
const FensaRequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  uprn: z.string().optional(),
  address: z.string().optional(),
});

type FensaRequest = z.infer<typeof FensaRequestSchema>;

// Response types
interface FensaResponse {
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

// Generate FENSA links and guidance
async function generateFensaLinks(request: FensaRequest, logger: Logger): Promise<ExternalLinksPayload> {
  try {
    const linksPayload: ExternalLinksPayload = {
      kind: "links",
      title: "FENSA - Fenestration Self-Assessment Scheme",
      description: "Access to FENSA registered installers and window/door installation certificates. FENSA is the official scheme for self-certification of replacement windows and doors in England and Wales.",
      items: [
        {
          label: "FENSA Installer Search",
          url: "https://www.fensa.org.uk/find-a-fensa-installer",
          notes: "Search for FENSA registered installers by postcode or company name",
          parameters: {
            postcode: request.postcode || "",
            radius: "25",
            installer_type: "all",
          },
        },
        {
          label: "FENSA Certificate Check",
          url: "https://www.fensa.org.uk/certificate-check",
          notes: "Verify FENSA certificates for window and door installations",
          parameters: {
            certificate_number: "",
            postcode: request.postcode || "",
            installation_date: "",
          },
        },
        {
          label: "FENSA Registration",
          url: "https://www.fensa.org.uk/register",
          notes: "Register as a FENSA installer for self-certification of installations",
          parameters: {
            installer_type: "company",
            region: "england_wales",
          },
        },
        {
          label: "FENSA Standards Guide",
          url: "https://www.fensa.org.uk/standards",
          notes: "Technical standards and requirements for window and door installations",
          parameters: {
            standard_type: "building_regulations",
            product_type: "windows_doors",
          },
        },
        {
          label: "FENSA Contact Information",
          url: "https://www.fensa.org.uk/contact",
          notes: "Contact FENSA for technical support and certification queries",
          parameters: {
            enquiry_type: "technical",
            region: "england_wales",
          },
        },
        {
          label: "Building Regulations Compliance",
          url: "https://www.gov.uk/building-regulations",
          notes: "Official government guidance on building regulations for windows and doors",
          parameters: {
            regulation_type: "part_l",
            product_type: "windows_doors",
          },
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    logger.info("FENSA links generated successfully", {
      itemsCount: linksPayload.items.length,
      address: request.address,
      postcode: request.postcode,
    });

    return linksPayload;

  } catch (error) {
    logger.error("Failed to generate FENSA links", error);
    throw new Error(`FENSA links generation failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: FensaRequest): string {
  const identifier = request.uprn || request.postcode || request.address || request.property_id;
  return `fensa:${identifier}`;
}

// Main handler
async function handleFensaRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("FENSA request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = FensaRequestSchema.parse(body);

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
    const cachedData = await cache.get("fensa", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached FENSA links");
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
    const fensaData = await generateFensaLinks(validatedRequest, logger);

    // Cache the result (30 day TTL)
    await cache.set("fensa", cacheKey, fensaData, 30 * 24 * 60 * 60);

    const response: FensaResponse = {
      success: true,
      data: fensaData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("FENSA request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("FENSA request failed", error);

    const response: FensaResponse = {
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
serve(handleFensaRequest);
