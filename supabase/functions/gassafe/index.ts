import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { ExternalLinksPayload } from "../../server/types.ts";

// Request schema
const GasSafeRequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  uprn: z.string().optional(),
  address: z.string().optional(),
});

type GasSafeRequest = z.infer<typeof GasSafeRequestSchema>;

// Response types
interface GasSafeResponse {
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

// Generate Gas Safe links and guidance
async function generateGasSafeLinks(request: GasSafeRequest, logger: Logger): Promise<ExternalLinksPayload> {
  try {
    const linksPayload: ExternalLinksPayload = {
      kind: "links",
      title: "Gas Safe Register - Gas Engineers",
      description: "Access to Gas Safe registered engineers and gas safety certificates. Gas Safe Register is the official list of gas engineers who are legally allowed to work on gas appliances and installations.",
      items: [
        {
          label: "Find a Gas Safe Engineer",
          url: "https://www.gassaferegister.co.uk/find-an-engineer/",
          notes: "Search for Gas Safe registered engineers by postcode or engineer ID",
          parameters: {
            postcode: request.postcode || "",
            radius: "25",
            engineer_type: "all",
          },
        },
        {
          label: "Check Engineer Registration",
          url: "https://www.gassaferegister.co.uk/check-an-engineer/",
          notes: "Verify if an engineer is Gas Safe registered and check their qualifications",
          parameters: {
            engineer_id: "",
            postcode: request.postcode || "",
            qualification: "all",
          },
        },
        {
          label: "Gas Safety Certificate Check",
          url: "https://www.gassaferegister.co.uk/help-and-advice/check-a-gas-safety-certificate/",
          notes: "Verify gas safety certificates and compliance documents",
          parameters: {
            certificate_number: "",
            postcode: request.postcode || "",
            installation_date: "",
          },
        },
        {
          label: "Gas Safe Registration",
          url: "https://www.gassaferegister.co.uk/register/",
          notes: "Register as a Gas Safe engineer to legally work on gas installations",
          parameters: {
            engineer_type: "individual",
            region: "england_wales",
          },
        },
        {
          label: "Gas Safety Standards",
          url: "https://www.gassaferegister.co.uk/help-and-advice/gas-safety-standards/",
          notes: "Technical standards and safety requirements for gas installations",
          parameters: {
            standard_type: "gas_safety",
            appliance_type: "all",
          },
        },
        {
          label: "Gas Safe Contact",
          url: "https://www.gassaferegister.co.uk/contact-us/",
          notes: "Contact Gas Safe Register for technical support and registration queries",
          parameters: {
            enquiry_type: "technical",
            region: "england_wales",
          },
        },
        {
          label: "Gas Safety Regulations",
          url: "https://www.hse.gov.uk/gas/",
          notes: "Official HSE guidance on gas safety regulations and compliance",
          parameters: {
            regulation_type: "gas_safety",
            industry: "domestic",
          },
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    logger.info("Gas Safe links generated successfully", {
      itemsCount: linksPayload.items.length,
      address: request.address,
      postcode: request.postcode,
    });

    return linksPayload;

  } catch (error) {
    logger.error("Failed to generate Gas Safe links", error);
    throw new Error(`Gas Safe links generation failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: GasSafeRequest): string {
  const identifier = request.uprn || request.postcode || request.address || request.property_id;
  return `gassafe:${identifier}`;
}

// Main handler
async function handleGasSafeRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Gas Safe request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = GasSafeRequestSchema.parse(body);

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
    const cachedData = await cache.get("gassafe", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached Gas Safe links");
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
    const gasSafeData = await generateGasSafeLinks(validatedRequest, logger);

    // Cache the result (30 day TTL)
    await cache.set("gassafe", cacheKey, gasSafeData, 30 * 24 * 60 * 60);

    const response: GasSafeResponse = {
      success: true,
      data: gasSafeData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("Gas Safe request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("Gas Safe request failed", error);

    const response: GasSafeResponse = {
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
serve(handleGasSafeRequest);
