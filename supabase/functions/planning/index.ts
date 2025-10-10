import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { PlanningSummary, PlanningApplication, PlanningConstraint } from "../../server/types.ts";

// Request schema
const PlanningRequestSchema = z.object({
  property_id: z.string().uuid(),
  postcode: z.string().optional(),
  uprn: z.string().optional(),
  address: z.string().optional(),
});

type PlanningRequest = z.infer<typeof PlanningRequestSchema>;

// Response types
interface PlanningResponse {
  success: boolean;
  data?: PlanningSummary;
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

// Fetch planning data from planning.data.gov.uk
async function fetchPlanningData(request: PlanningRequest, logger: Logger): Promise<PlanningSummary> {
  try {
    // For now, we'll implement a mock response
    // In production, this would integrate with planning.data.gov.uk API
    // or local planning authority APIs where available
    
    const mockApplications: PlanningApplication[] = [
      {
        reference: "PLAN/2024/001",
        address: request.address || "123 Example Street",
        description: "Single storey rear extension",
        status: "Approved",
        applicationDate: "2024-01-15",
        decisionDate: "2024-03-20",
        applicant: "John Smith",
        agent: "ABC Planning Ltd",
        ward: "Central Ward",
        parish: "Example Parish",
        applicationType: "Householder",
        developmentType: "Residential",
        proposal: "Construction of single storey rear extension",
        location: "123 Example Street, Example Town",
        gridReference: "TQ123456",
        easting: 512345,
        northing: 123456,
        documents: [
          {
            id: "doc1",
            name: "Application Form",
            type: "PDF",
            url: "https://example.com/planning/doc1.pdf",
            date: "2024-01-15",
            size: 1024000,
          },
          {
            id: "doc2", 
            name: "Site Plan",
            type: "PDF",
            url: "https://example.com/planning/doc2.pdf",
            date: "2024-01-15",
            size: 2048000,
          },
        ],
      },
    ];

    const mockConstraints: PlanningConstraint[] = [
      {
        type: "Conservation Area",
        name: "Example Conservation Area",
        description: "Property is located within a designated conservation area",
        status: "Active",
        date: "2020-01-01",
        authority: "Example Council",
        reference: "CA/2020/001",
      },
      {
        type: "Tree Preservation Order",
        name: "TPO 2023/001",
        description: "Large oak tree in rear garden protected by TPO",
        status: "Active",
        date: "2023-06-15",
        authority: "Example Council",
        reference: "TPO/2023/001",
      },
    ];

    const planningSummary: PlanningSummary = {
      address: request.address || "123 Example Street",
      postcode: request.postcode || "EX1 1AB",
      applications: mockApplications,
      constraints: mockConstraints,
      lastUpdated: new Date().toISOString(),
      dataSource: "planning.data.gov.uk",
    };

    logger.info("Planning data fetched successfully", {
      applicationsCount: mockApplications.length,
      constraintsCount: mockConstraints.length,
    });

    return planningSummary;

  } catch (error) {
    logger.error("Failed to fetch planning data", error);
    throw new Error(`Planning data fetch failed: ${error.message}`);
  }
}

// Generate cache key
function generateCacheKey(request: PlanningRequest): string {
  const identifier = request.uprn || request.postcode || request.address || request.property_id;
  return `planning:${identifier}`;
}

// Main handler
async function handlePlanningRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Planning request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = PlanningRequestSchema.parse(body);

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
    const cachedData = await cache.get("planning", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached planning data");
      return new Response(JSON.stringify({
        success: true,
        data: cachedData,
        requestId,
        cached: true,
        cacheExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch fresh data
    const planningData = await fetchPlanningData(validatedRequest, logger);

    // Cache the result (24 hour TTL)
    await cache.set("planning", cacheKey, planningData, 24 * 60 * 60);

    const response: PlanningResponse = {
      success: true,
      data: planningData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("Planning request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("Planning request failed", error);

    const response: PlanningResponse = {
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
serve(handlePlanningRequest);
