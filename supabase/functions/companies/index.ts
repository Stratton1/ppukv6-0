import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import { CacheManager } from "../../server/cache.ts";
import { CompanyProfile, CompanyOfficer, CompanyFiling } from "../../server/types.ts";

// Request schema
const CompaniesRequestSchema = z.object({
  property_id: z.string().uuid(),
  company_number: z.string().optional(),
  company_name: z.string().optional(),
  postcode: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

type CompaniesRequest = z.infer<typeof CompaniesRequestSchema>;

// Response types
interface CompaniesResponse {
  success: boolean;
  data?: {
    companies: CompanyProfile[];
    total: number;
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

// Fetch company data from Companies House API
async function fetchCompaniesData(request: CompaniesRequest, logger: Logger): Promise<{
  companies: CompanyProfile[];
  total: number;
  lastUpdated: string;
}> {
  try {
    const apiKey = Deno.env.get("COMPANIES_HOUSE_API_KEY");
    
    if (!apiKey) {
      logger.warn("Companies House API key not configured, returning mock data");
      return await getMockCompaniesData(request, logger);
    }

    // For now, we'll implement a mock response
    // In production, this would integrate with Companies House API
    // Documentation: https://developer.company-information.service.gov.uk/
    
    return await getMockCompaniesData(request, logger);

  } catch (error) {
    logger.error("Failed to fetch companies data", error);
    throw new Error(`Companies data fetch failed: ${error.message}`);
  }
}

// Mock companies data (used when API key is not available)
async function getMockCompaniesData(request: CompaniesRequest, logger: Logger): Promise<{
  companies: CompanyProfile[];
  total: number;
  lastUpdated: string;
}> {
  const mockCompanies: CompanyProfile[] = [
    {
      companyNumber: "12345678",
      companyName: "Example Property Management Ltd",
      status: "Active",
      type: "Private Limited Company",
      dateOfCreation: "2020-01-15",
      registeredOfficeAddress: {
        addressLine1: "123 Business Street",
        addressLine2: "Suite 100",
        locality: "Business District",
        postalCode: request.postcode || "EX1 1AB",
        country: "England",
      },
      sicCodes: ["68310", "68201"],
      officers: [
        {
          name: "John Smith",
          officerRole: "Director",
          appointedOn: "2020-01-15",
          nationality: "British",
          occupation: "Property Manager",
          dateOfBirth: { month: 6, year: 1985 },
          countryOfResidence: "England",
        },
        {
          name: "Jane Doe",
          officerRole: "Company Secretary",
          appointedOn: "2020-01-15",
          nationality: "British",
          occupation: "Secretary",
          dateOfBirth: { month: 3, year: 1990 },
          countryOfResidence: "England",
        },
      ],
      filingHistory: [
        {
          filingId: "filing1",
          filingType: "Confirmation Statement",
          filingDate: "2023-01-15",
          description: "Confirmation statement made on 15/01/23 with no updates",
          category: "Annual Return",
          subcategory: "Confirmation Statement",
          pages: 1,
        },
        {
          filingId: "filing2",
          filingType: "Annual Return",
          filingDate: "2022-01-15",
          description: "Annual return made up to 15/01/22",
          category: "Annual Return",
          pages: 2,
        },
      ],
    },
    {
      companyNumber: "87654321",
      companyName: "Local Development Company Ltd",
      status: "Active",
      type: "Private Limited Company",
      dateOfCreation: "2018-06-20",
      registeredOfficeAddress: {
        addressLine1: "456 Development Road",
        locality: "Industrial Estate",
        postalCode: request.postcode || "EX1 1AB",
        country: "England",
      },
      sicCodes: ["41100", "41201"],
      officers: [
        {
          name: "Robert Johnson",
          officerRole: "Director",
          appointedOn: "2018-06-20",
          nationality: "British",
          occupation: "Developer",
          dateOfBirth: { month: 9, year: 1975 },
          countryOfResidence: "England",
        },
      ],
      filingHistory: [
        {
          filingId: "filing3",
          filingType: "Confirmation Statement",
          filingDate: "2023-06-20",
          description: "Confirmation statement made on 20/06/23 with updates",
          category: "Annual Return",
          subcategory: "Confirmation Statement",
          pages: 1,
        },
      ],
    },
  ];

  // Filter by limit
  const limitedCompanies = mockCompanies.slice(0, request.limit);

  logger.info("Companies data fetched successfully", {
    companiesCount: limitedCompanies.length,
    totalAvailable: mockCompanies.length,
  });

  return {
    companies: limitedCompanies,
    total: mockCompanies.length,
    lastUpdated: new Date().toISOString(),
  };
}

// Generate cache key
function generateCacheKey(request: CompaniesRequest): string {
  const identifier = request.company_number || request.company_name || request.postcode || request.property_id;
  return `companies:${identifier}:${request.limit}`;
}

// Main handler
async function handleCompaniesRequest(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger(requestId);

  try {
    logger.info("Companies request received");

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = CompaniesRequestSchema.parse(body);

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
    const cachedData = await cache.get("companies", cacheKey);
    
    if (cachedData) {
      logger.info("Returning cached companies data");
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
    const companiesData = await fetchCompaniesData(validatedRequest, logger);

    // Cache the result (7 day TTL)
    await cache.set("companies", cacheKey, companiesData, 7 * 24 * 60 * 60);

    const response: CompaniesResponse = {
      success: true,
      data: companiesData,
      requestId,
      cached: false,
      cacheExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    logger.info("Companies request completed successfully");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("Companies request failed", error);

    const response: CompaniesResponse = {
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
serve(handleCompaniesRequest);
