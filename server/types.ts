/**
 * PPUK v6 Server Types
 * Shared TypeScript types for server-side operations
 * Created: 2025-01-03
 * Purpose: Centralized type definitions for backend services
 */

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

export interface Property {
  id: string;
  ppuk_reference: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  title_number?: string;
  property_type: PropertyType;
  property_style?: PropertyStyle;
  bedrooms?: number;
  bathrooms?: number;
  total_floor_area_sqm?: number;
  year_built?: number;
  tenure: TenureType;
  lease_years_remaining?: number;
  ground_rent_annual?: number;
  service_charge_annual?: number;
  epc_rating?: string;
  epc_score?: number;
  epc_expiry_date?: string;
  flood_risk_level?: string;
  council_tax_band?: string;
  front_photo_url?: string;
  claimed_by?: string;
  completion_percentage: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyParty {
  id: string;
  property_id: string;
  user_id: string;
  role: PropertyPartyRole;
  permissions: Record<string, any>;
  is_primary: boolean;
  assigned_at: string;
  assigned_by?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  property_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
  description?: string;
  uploaded_by: string;
  status: DocumentStatus;
  storage_path?: string;
  checksum?: string;
  tags: string[];
  is_public: boolean;
  shared_with: string[];
  download_count: number;
  last_accessed_at?: string;
  ai_summary?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  property_id: string;
  created_by: string;
  title: string;
  body: string;
  visibility: NoteVisibility;
  tags: string[];
  is_pinned: boolean;
  parent_note_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  property_id: string;
  created_by: string;
  assigned_to?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  company_name?: string;
  job_title?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  country: string;
  preferences: Record<string, any>;
  is_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ENUMS
// ============================================================================

export type PropertyType = 
  | 'detached' 
  | 'semi_detached' 
  | 'terraced' 
  | 'flat' 
  | 'bungalow' 
  | 'cottage' 
  | 'other';

export type PropertyStyle = 
  | 'victorian' 
  | 'edwardian' 
  | 'georgian' 
  | 'modern' 
  | 'new_build' 
  | 'period' 
  | 'contemporary' 
  | 'other';

export type TenureType = 
  | 'freehold' 
  | 'leasehold' 
  | 'shared_ownership';

export type DocumentType = 
  | 'epc' 
  | 'floorplan' 
  | 'title_deed' 
  | 'survey' 
  | 'planning' 
  | 'lease' 
  | 'guarantee' 
  | 'building_control' 
  | 'gas_safety' 
  | 'electrical_safety' 
  | 'other';

export type DocumentStatus = 
  | 'uploading' 
  | 'processing' 
  | 'ready' 
  | 'error' 
  | 'archived';

export type PropertyPartyRole = 
  | 'owner' 
  | 'purchaser' 
  | 'tenant' 
  | 'agent' 
  | 'surveyor' 
  | 'conveyancer' 
  | 'solicitor' 
  | 'mortgage_broker' 
  | 'insurance_advisor';

export type UserRole = 
  | 'owner' 
  | 'buyer' 
  | 'other';

export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type NoteVisibility = 
  | 'private' 
  | 'shared' 
  | 'public';

export type ApiProvider = 
  | 'epc' 
  | 'flood' 
  | 'planning' 
  | 'postcodes' 
  | 'osplaces' 
  | 'inspire' 
  | 'companies' 
  | 'hmlr' 
  | 'crime' 
  | 'education';

export type AuditAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'upload' 
  | 'download' 
  | 'share' 
  | 'claim' 
  | 'unclaim';

// ============================================================================
// EXTERNAL API TYPES
// ============================================================================

export interface EPCReport {
  certificateNumber: string;
  address: string;
  postcode: string;
  propertyType: string;
  builtForm: string;
  totalFloorArea: number;
  currentRating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  currentEfficiency: number;
  environmentalImpactRating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  environmentalImpactEfficiency: number;
  mainFuelType: string;
  mainHeatingDescription: string;
  hotWaterDescription: string;
  lightingDescription: string;
  windowsDescription: string;
  wallsDescription: string;
  roofDescription: string;
  floorDescription: string;
  co2EmissionsCurrent: number;
  co2EmissionsPotential: number;
  totalCostCurrent: number;
  totalCostPotential: number;
  inspectionDate: string;
  localAuthority: string;
  constituency: string;
  county: string;
  tenure: string;
  uprn: string;
  created_at: string;
  expires_at: string;
}

export interface FloodRiskReport {
  address: string;
  postcode: string;
  uprn?: string;
  floodRisk: {
    surfaceWater: FloodRiskLevel;
    riversAndSea: FloodRiskLevel;
    groundwater: FloodRiskLevel;
    reservoirs: FloodRiskLevel;
  };
  riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  riskScore: number;
  lastUpdated: string;
  dataSource: string;
  warnings?: FloodWarning[];
  historicalFloods?: HistoricalFlood[];
}

export interface FloodRiskLevel {
  level: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  score: number;
  description: string;
  probability: string;
  impact: string;
  mitigation?: string[];
}

export interface FloodWarning {
  id: string;
  type: 'Flood Alert' | 'Flood Warning' | 'Severe Flood Warning';
  severity: 'Low' | 'Medium' | 'High' | 'Severe';
  message: string;
  issuedDate: string;
  validUntil?: string;
  affectedAreas: string[];
  advice: string;
}

export interface HistoricalFlood {
  date: string;
  type: 'Surface Water' | 'River' | 'Coastal' | 'Groundwater';
  severity: 'Minor' | 'Moderate' | 'Major';
  description: string;
  affectedAreas: string[];
  damageEstimate?: number;
}

export interface PlanningReport {
  address: string;
  postcode: string;
  applications: PlanningApplication[];
  constraints: PlanningConstraint[];
  lastUpdated: string;
}

export interface PlanningApplication {
  reference: string;
  address: string;
  description: string;
  status: 'Approved' | 'Refused' | 'Pending' | 'Withdrawn';
  applicationDate: string;
  decisionDate?: string;
  applicant: string;
  agent?: string;
  ward: string;
  parish?: string;
  applicationType: string;
  developmentType: string;
  proposal: string;
  location: string;
  gridReference?: string;
  easting?: number;
  northing?: number;
  documents?: PlanningDocument[];
}

export interface PlanningDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  date: string;
  size?: number;
}

export interface PlanningConstraint {
  type: 
    | 'Conservation Area'
    | 'Listed Building'
    | 'Tree Preservation Order'
    | 'Article 4 Direction'
    | 'Green Belt'
    | 'AONB'
    | 'SSSI'
    | 'Flood Zone';
  name: string;
  description: string;
  status: 'Active' | 'Proposed' | 'Expired';
  date: string;
  authority: string;
  reference?: string;
}

export interface PostcodeData {
  postcode: string;
  quality: number;
  eastings: number;
  northings: number;
  country: string;
  nhs_ha: string;
  longitude: number;
  latitude: number;
  parliamentary_constituency: string;
  european_electoral_region: string;
  primary_care_trust: string;
  region: string;
  lsoa: string;
  msoa: string;
  incode: string;
  outcode: string;
  admin_district: string;
  parish: string;
  admin_county?: string;
  admin_ward: string;
  ced?: string;
  ccg: string;
  nuts: string;
  codes: {
    admin_district: string;
    admin_county?: string;
    admin_ward: string;
    parish: string;
    parliamentary_constituency: string;
    ccg: string;
    ccg_id: string;
    ced?: string;
    nuts: {
      code: string;
      name: string;
    };
  };
}

export interface OSPlacesAddress {
  uprn: string;
  address: string;
  postcode: string;
  easting: number;
  northing: number;
  latitude: number;
  longitude: number;
  classification: string;
  local_type: string;
  administrative_area: string;
  district_borough: string;
  county_unitary: string;
  region: string;
  country: string;
  created_date: string;
  last_updated_date: string;
}

export interface CompaniesHouseData {
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  date_of_cessation?: string;
  registered_office_address: {
    address_line_1: string;
    address_line_2?: string;
    locality?: string;
    postal_code: string;
    country: string;
  };
  sic_codes: string[];
  officers: CompanyOfficer[];
  filing_history: CompanyFiling[];
}

export interface CompanyOfficer {
  name: string;
  officer_role: string;
  appointed_on: string;
  resigned_on?: string;
  nationality?: string;
  occupation?: string;
  date_of_birth?: {
    month: number;
    year: number;
  };
  country_of_residence?: string;
}

export interface CompanyFiling {
  filing_id: string;
  filing_type: string;
  filing_date: string;
  description: string;
  category: string;
  subcategory?: string;
  pages?: number;
  barcode?: string;
  transaction_id?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
  cached?: boolean;
  cacheExpiresAt?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface CacheInfo {
  cached: boolean;
  cacheKey: string;
  expiresAt: string;
  ttl: number;
}

// ============================================================================
// PROPERTY SNAPSHOT TYPES
// ============================================================================

export interface PropertySnapshot {
  property: Property;
  epc?: EPCReport;
  floodRisk?: FloodRiskReport;
  planning?: PlanningReport;
  postcode?: PostcodeData;
  address?: OSPlacesAddress;
  companies?: CompaniesHouseData[];
  stats: {
    documentCount: number;
    noteCount: number;
    taskCount: number;
    partyCount: number;
    lastDocumentUpload?: string;
    lastNoteCreated?: string;
    lastTaskCreated?: string;
    lastActivity?: string;
  };
  parties: PropertyParty[];
  recentDocuments: Document[];
  recentNotes: Note[];
  recentTasks: Task[];
  pinnedNotes: Note[];
  pendingTasks: Task[];
  overdueTasks: Task[];
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface AddressSearchResult {
  uprn: string;
  address: string;
  postcode: string;
  easting: number;
  northing: number;
  latitude: number;
  longitude: number;
  classification: string;
  local_type: string;
  administrative_area: string;
  district_borough: string;
  county_unitary: string;
  region: string;
  country: string;
}

export interface AddressSearchResponse {
  results: AddressSearchResult[];
  total: number;
  query: string;
  suggestions?: string[];
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T = any> {
  id: string;
  provider: ApiProvider;
  cache_key: string;
  payload: T;
  fetched_at: string;
  ttl_seconds: number;
  etag?: string;
  request_hash: string;
  response_size_bytes?: number;
  is_stale: boolean;
  created_at: string;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  created_at: string;
}

// ============================================================================
// REQUEST CONTEXT TYPES
// ============================================================================

export interface RequestContext {
  requestId: string;
  userId?: string;
  propertyId?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthContext {
  userId: string;
  userRole: UserRole;
  permissions: string[];
  isAdmin: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams {
  query: string;
  filters?: FilterParams;
  pagination?: PaginationParams;
  sort?: SortParams;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export interface DocumentUploadWebhook extends WebhookPayload {
  event: 'document.uploaded';
  data: {
    document_id: string;
    property_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    checksum: string;
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

// New domain models for Phase 2.2 integrations
export interface PlanningSummary {
  address: string;
  postcode: string;
  applications: PlanningApplication[];
  constraints: PlanningConstraint[];
  lastUpdated: string;
  dataSource: string;
}

export interface PolygonOutline {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][];
  properties: {
    uprn?: string;
    title?: string;
    area?: number;
    perimeter?: number;
  };
}

export interface PricePaidEntry {
  transactionId: string;
  price: number;
  date: string;
  postcode: string;
  propertyType: string;
  tenure: string;
  paon: string; // Primary Addressable Object Name
  saon?: string; // Secondary Addressable Object Name
  street: string;
  locality?: string;
  town: string;
  district: string;
  county: string;
  category: string;
  recordStatus: string;
}

export interface CompanyProfile {
  companyNumber: string;
  companyName: string;
  status: string;
  type: string;
  dateOfCreation: string;
  dateOfCessation?: string;
  registeredOfficeAddress: {
    addressLine1: string;
    addressLine2?: string;
    locality?: string;
    postalCode: string;
    country: string;
  };
  sicCodes: string[];
  officers: CompanyOfficer[];
  filingHistory: CompanyFiling[];
}

export interface CouncilTaxBand {
  band: string;
  value: number;
  authority: string;
  lastUpdated: string;
  dataSource: string;
}

export interface CrimeStats {
  area: string;
  period: string;
  totalCrimes: number;
  crimesByCategory: {
    category: string;
    count: number;
    percentage: number;
  }[];
  crimeRate: number;
  comparison: {
    nationalAverage: number;
    localAuthorityAverage: number;
    percentile: number;
  };
}

export interface ExternalLinksPayload {
  kind: "links";
  title: string;
  description: string;
  items: {
    label: string;
    url: string;
    notes?: string;
    parameters?: Record<string, string>;
  }[];
  lastUpdated: string;
}

export interface WeatherData {
  location: string;
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    conditions: string;
    icon: string;
  };
  forecast: {
    date: string;
    high: number;
    low: number;
    conditions: string;
    precipitation: number;
  }[];
  lastUpdated: string;
}

export interface DefraMagicLayer {
  name: string;
  title: string;
  description: string;
  wmsUrl: string;
  wfsUrl?: string;
  layers: string[];
  styles: string[];
  format: string;
  srs: string;
  bbox: number[];
}

export interface NationalGridData {
  area: string;
  data: {
    type: string;
    name: string;
    description: string;
    url: string;
    format: string;
    lastUpdated: string;
  }[];
  lastUpdated: string;
}

export interface FensaData {
  installer: string;
  registration: string;
  status: string;
  expiryDate: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  coverage: string[];
  lastUpdated: string;
}

export interface GasSafeData {
  engineer: string;
  registration: string;
  status: string;
  expiryDate: string;
  qualifications: string[];
  contactInfo: {
    phone?: string;
    email?: string;
  };
  lastUpdated: string;
}

export interface EICRData {
  electrician: string;
  registration: string;
  status: string;
  expiryDate: string;
  qualifications: string[];
  contactInfo: {
    phone?: string;
    email?: string;
  };
  lastUpdated: string;
}

export interface HSEData {
  contractor: string;
  registration: string;
  status: string;
  expiryDate: string;
  services: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  lastUpdated: string;
}

export interface ServerConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  providers: {
    epc: {
      baseUrl: string;
      apiKey?: string;
      rateLimit: number;
      ttl: number;
    };
    flood: {
      baseUrl: string;
      apiKey?: string;
      rateLimit: number;
      ttl: number;
    };
    planning: {
      baseUrl: string;
      apiKey?: string;
      rateLimit: number;
      ttl: number;
    };
    postcodes: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    osplaces: {
      baseUrl: string;
      apiKey?: string;
      rateLimit: number;
      ttl: number;
    };
    inspire: {
      baseUrl: string;
      apiKey?: string;
      rateLimit: number;
      ttl: number;
    };
    companies: {
      baseUrl: string;
      apiKey?: string;
      rateLimit: number;
      ttl: number;
    };
    pricepaid: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    voa: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    police: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    weather: {
      baseUrl: string;
      apiKey?: string;
      rateLimit: number;
      ttl: number;
    };
    defra_magic: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    ngrid: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    fensa: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    gassafe: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    eicr: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
    hse: {
      baseUrl: string;
      rateLimit: number;
      ttl: number;
    };
  };
  cache: {
    defaultTtl: number;
    maxSize: number;
    cleanupInterval: number;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
  };
}
