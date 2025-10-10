import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

// Request validation schema
const MyPropertiesRequestSchema = z.object({
  relationship: z.enum(['owner', 'occupier', 'interested']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

type MyPropertiesRequest = z.infer<typeof MyPropertiesRequestSchema>;

// Response types
interface PropertyCard {
  id: string;
  ppuk_reference: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  total_floor_area_sqm?: number;
  epc_rating?: string;
  epc_score?: number;
  flood_risk_level?: string;
  tenure: string;
  front_photo_url?: string;
  relationship: 'owner' | 'occupier' | 'interested';
  completion_percentage: number;
  stats: {
    document_count: number;
    note_count: number;
    task_count: number;
    photo_count: number;
    planning_count?: number;
  };
  last_updated: string;
  created_at: string;
}

interface MyPropertiesResponse {
  success: boolean;
  data?: {
    properties: PropertyCard[];
    total: number;
    relationship?: string;
    pagination: {
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
  error?: string;
  requestId: string;
  cached?: boolean;
  cacheExpiresAt?: string;
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

async function fetchUserProperties(
  userId: string, 
  request: MyPropertiesRequest, 
  logger: Logger
): Promise<{ properties: PropertyCard[]; total: number }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Build the query
  let query = supabase
    .from('property_parties')
    .select(`
      relationship,
      properties!inner(
        id,
        ppuk_reference,
        address_line_1,
        address_line_2,
        city,
        postcode,
        property_type,
        bedrooms,
        bathrooms,
        total_floor_area_sqm,
        epc_rating,
        epc_score,
        flood_risk_level,
        tenure,
        front_photo_url,
        completion_percentage,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  // Filter by relationship if specified
  if (request.relationship) {
    query = query.eq('relationship', request.relationship);
  }

  // Get total count
  const { count, error: countError } = await query;
  if (countError) {
    logger.error("Failed to get property count", countError);
    throw new Error("Failed to fetch property count");
  }

  // Apply pagination
  query = query
    .range(request.offset, request.offset + request.limit - 1)
    .order('updated_at', { referencedTable: 'properties', ascending: false });

  const { data: parties, error } = await query;
  
  if (error) {
    logger.error("Failed to fetch user properties", error);
    throw new Error("Failed to fetch user properties");
  }

  if (!parties || parties.length === 0) {
    return { properties: [], total: count || 0 };
  }

  // Get stats for each property
  const propertyIds = parties.map(p => p.properties.id);
  
  // Get document counts
  const { data: docCounts } = await supabase
    .from('documents')
    .select('property_id')
    .in('property_id', propertyIds);

  // Get note counts
  const { data: noteCounts } = await supabase
    .from('notes')
    .select('property_id')
    .in('property_id', propertyIds);

  // Get task counts
  const { data: taskCounts } = await supabase
    .from('tasks')
    .select('property_id')
    .in('property_id', propertyIds);

  // Get photo counts
  const { data: photoCounts } = await supabase
    .from('property_photos')
    .select('property_id')
    .in('property_id', propertyIds);

  // Aggregate stats
  const statsMap = new Map<string, any>();
  
  [docCounts, noteCounts, taskCounts, photoCounts].forEach((counts, index) => {
    const statNames = ['document_count', 'note_count', 'task_count', 'photo_count'];
    counts?.forEach(item => {
      if (!statsMap.has(item.property_id)) {
        statsMap.set(item.property_id, {
          document_count: 0,
          note_count: 0,
          task_count: 0,
          photo_count: 0,
          planning_count: 0
        });
      }
      statsMap.get(item.property_id)[statNames[index]]++;
    });
  });

  // Transform to PropertyCard format
  const properties: PropertyCard[] = parties.map(party => {
    const property = party.properties;
    const stats = statsMap.get(property.id) || {
      document_count: 0,
      note_count: 0,
      task_count: 0,
      photo_count: 0,
      planning_count: 0
    };

    return {
      id: property.id,
      ppuk_reference: property.ppuk_reference || '',
      address_line_1: property.address_line_1,
      address_line_2: property.address_line_2,
      city: property.city,
      postcode: property.postcode,
      property_type: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      total_floor_area_sqm: property.total_floor_area_sqm,
      epc_rating: property.epc_rating,
      epc_score: property.epc_score,
      flood_risk_level: property.flood_risk_level,
      tenure: property.tenure,
      front_photo_url: property.front_photo_url,
      relationship: party.relationship,
      completion_percentage: property.completion_percentage || 0,
      stats,
      last_updated: property.updated_at,
      created_at: property.created_at
    };
  });

  return { properties, total: count || 0 };
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

async function handleMyPropertiesRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      relationship: url.searchParams.get('relationship') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0')
    };

    // Validate request
    const validatedRequest = MyPropertiesRequestSchema.parse(queryParams);
    logger.info("Processing my_properties request", validatedRequest);

    // Authenticate user
    const authHeader = request.headers.get("Authorization");
    const userId = await authenticateUser(authHeader);
    logger.info("User authenticated", { userId });

    // Fetch user properties
    const result = await fetchUserProperties(userId, validatedRequest, logger);
    
    const response: MyPropertiesResponse = {
      success: true,
      data: {
        properties: result.properties,
        total: result.total,
        relationship: validatedRequest.relationship,
        pagination: {
          limit: validatedRequest.limit,
          offset: validatedRequest.offset,
          has_more: (validatedRequest.offset + validatedRequest.limit) < result.total
        }
      },
      requestId
    };

    logger.info("Request completed successfully", { 
      propertyCount: result.properties.length,
      total: result.total 
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

serve(handleMyPropertiesRequest);
