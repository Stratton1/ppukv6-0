/**
 * API Types for Property Passport UK
 * Shared TypeScript interfaces for external API integrations
 */

// Base property identifier
export interface PropertyIdentifier {
  propertyId: string;
  postcode: string;
  address?: string;
  uprn?: string;
}

// EPC (Energy Performance Certificate) types
export interface EPCData {
  rating: string;
  score: number;
  address: string;
  postcode: string;
  uprn?: string;
  lastUpdated: string;
  certificateUrl?: string;
  recommendations?: EPCRecommendation[];
  environmentalImpact?: {
    co2Emissions: number;
    energyConsumption: number;
    renewableEnergy: number;
  };
}

export interface EPCRecommendation {
  id: string;
  title: string;
  description: string;
  cost: number;
  savings: number;
  paybackPeriod: number;
  priority: "High" | "Medium" | "Low";
}

// HMLR (HM Land Registry) types
export interface HMLRData {
  titleNumber: string;
  address: string;
  postcode: string;
  uprn?: string;
  owner: string;
  lastSold: string;
  price: number;
  tenure: "Freehold" | "Leasehold" | "Commonhold";
  propertyType: string;
  buildDate?: string;
  planningRestrictions?: string[];
  easements?: string[];
  charges?: HMLRCharge[];
}

export interface HMLRCharge {
  type: string;
  amount?: number;
  description: string;
  date: string;
}

// Flood Risk types
export interface FloodRiskData {
  riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  address: string;
  postcode: string;
  uprn?: string;
  lastUpdated: string;
  detailsUrl?: string;
  riskFactors: FloodRiskFactor[];
  historicalFloods?: HistoricalFlood[];
  mitigationMeasures?: string[];
}

export interface FloodRiskFactor {
  type: "River" | "Surface Water" | "Groundwater" | "Reservoir" | "Coastal";
  riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  description: string;
  probability: number; // 0-100
}

export interface HistoricalFlood {
  date: string;
  severity: "Minor" | "Moderate" | "Severe";
  description: string;
  affectedAreas: string[];
}

// API Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId: string;
  cache?: {
    cached: boolean;
    cacheKey: string;
    expiresAt: string;
    ttl: number;
  };
}

// Request types for each API
export type EPCRequest = PropertyIdentifier;

export interface HMLRRequest extends PropertyIdentifier {
  titleNumber?: string;
}

export type FloodRiskRequest = PropertyIdentifier;

// Combined property data
export interface PropertyData {
  epc: EPCData | null;
  hmlr: HMLRData | null;
  floodRisk: FloodRiskData | null;
  lastUpdated: string;
}

// API Status types
export type ApiStatus = "idle" | "loading" | "success" | "error";

export interface ApiState<T> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
  lastUpdated: string | null;
}

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of cached items
  enabled: boolean;
}

// Rate limiting
export interface RateLimit {
  requests: number;
  window: number; // Window in seconds
  remaining: number;
  reset: number; // Unix timestamp
}

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  cache: CacheConfig;
  rateLimit: RateLimit;
}

// Validation schemas (for reference)
export interface ValidationSchema {
  epc: {
    required: ["postcode", "address"];
    optional: ["uprn"];
  };
  hmlr: {
    required: ["postcode", "address"];
    optional: ["uprn", "titleNumber"];
  };
  flood: {
    required: ["postcode", "address"];
    optional: ["uprn"];
  };
}

// Mock data types for development
export interface MockData {
  epc: EPCData;
  hmlr: HMLRData;
  floodRisk: FloodRiskData;
}

// API Health check
export interface ApiHealth {
  status: "healthy" | "degraded" | "down";
  services: {
    epc: "up" | "down";
    hmlr: "up" | "down";
    flood: "up" | "down";
  };
  lastChecked: string;
  responseTime: number;
}
