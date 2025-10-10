import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

// Request validation schema
const WatchlistAddRequestSchema = z.object({
  property_id: z.string().uuid("Property ID must be a valid UUID")
});

type WatchlistAddRequest = z.infer<typeof WatchlistAddRequestSchema>;

// Response types
interface WatchlistAddResponse {
  success: boolean;
  data?: {
    ok: boolean;
    relationship: 'interested';
    property_id: string;
    message: string;
  };
  error?: string;
  requestId: string;
}

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

async function authenticateUser(authHeader: string | null): Promise<string> {
  if (!authHeader) {
    throw new Error("Authorization header is required");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error("Invalid authentication token");
  }

  return user.id;
}

async function verifyPropertyExists(propertyId: string, logger: Logger): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .single();

  if (error) {
    logger.error("Failed to verify property exists", error);
    return false;
  }

  return !!data;
}

async function addToWatchlist(
  userId: string, 
  propertyId: string, 
  logger: Logger
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Check if property exists
  const propertyExists = await verifyPropertyExists(propertyId, logger);
  if (!propertyExists) {
    return { success: false, message: "Property not found" };
  }

  // Check if user already has a relationship with this property
  const { data: existingRelationship, error: checkError } = await supabase
    .from('property_parties')
    .select('relationship')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    logger.error("Failed to check existing relationship", checkError);
    throw new Error("Failed to check existing relationship");
  }

  if (existingRelationship) {
    if (existingRelationship.relationship === 'interested') {
      return { success: true, message: "Property already in watchlist" };
    } else {
      return { success: false, message: `Property already has relationship: ${existingRelationship.relationship}` };
    }
  }

  // Insert new interested relationship
  const { data, error } = await supabase
    .from('property_parties')
    .insert({
      user_id: userId,
      property_id: propertyId,
      relationship: 'interested',
      permissions: {},
      is_primary: false
    })
    .select('id')
    .single();

  if (error) {
    logger.error("Failed to add to watchlist", error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return { success: true, message: "Property already in watchlist" };
    }
    
    throw new Error("Failed to add property to watchlist");
  }

  logger.info("Successfully added property to watchlist", { 
    propertyId, 
    userId, 
    relationshipId: data.id 
  });

  return { success: true, message: "Property added to watchlist successfully" };
}

function createErrorResponse(error: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}

function createSuccessResponse<T>(data: T, requestId: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      requestId,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

async function handleWatchlistAddRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    // Parse request body
    const body = await request.json();
    logger.info("Processing watchlist_add request", body);

    // Validate request
    const validatedRequest = WatchlistAddRequestSchema.parse(body);

    // Authenticate user
    const authHeader = request.headers.get("Authorization");
    const userId = await authenticateUser(authHeader);
    logger.info("User authenticated", { userId });

    // Add to watchlist
    const result = await addToWatchlist(userId, validatedRequest.property_id, logger);
    
    if (!result.success) {
      return createErrorResponse(result.message, 400);
    }

    const response: WatchlistAddResponse = {
      success: true,
      data: {
        ok: true,
        relationship: 'interested',
        property_id: validatedRequest.property_id,
        message: result.message
      },
      requestId
    };

    logger.info("Request completed successfully", { 
      propertyId: validatedRequest.property_id,
      message: result.message 
    });

    return createSuccessResponse(response.data, requestId);

  } catch (error) {
    logger.error("Request failed", error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Validation error: ${error.errors.map(e => e.message).join(", ")}`, 400);
    }
    
    return createErrorResponse(error.message || "Internal server error", 500);
  }
}

serve(handleWatchlistAddRequest);
