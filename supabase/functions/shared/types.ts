/**
 * Shared TypeScript types for PPUK API Edge Functions
 * Defines interfaces for EPC, HMLR, and Flood Risk API responses
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
}

// Common property identifiers
export interface PropertyIdentifier {
  postcode: string;
  address?: string;
  uprn?: string; // Unique Property Reference Number
}

// EPC API Types
export interface EPCData {
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
  mainHeatingControls: string;
  secondaryHeatingDescription?: string;
  hotWaterDescription: string;
  lightingDescription: string;
  windowsDescription: string;
  wallsDescription: string;
  roofDescription: string;
  floorDescription: string;
  mainHeatingEnergyEff: string;
  mainHeatingEnvEff: string;
  hotWaterEnergyEff: string;
  hotWaterEnvEff: string;
  lightingEnergyEff: string;
  lightingEnvEff: string;
  windowsEnergyEff: string;
  windowsEnvEff: string;
  wallsEnergyEff: string;
  wallsEnvEff: string;
  roofEnergyEff: string;
  roofEnvEff: string;
  floorEnergyEff: string;
  floorEnvEff: string;
  mainFuel: string;
  windTurbineCount: number;
  heatLossCorridor: string;
  unheatedCorridorLength: number;
  floorHeight: number;
  photoSupply: number;
  solarWaterHeatingFlag: boolean;
  mechanicalVentilation: string;
  address1: string;
  address2?: string;
  address3?: string;
  localAuthority: string;
  constituency: string;
  county: string;
  lodgementDate: string;
  transactionType: string;
  environmentImpactPotential: number;
  co2EmissionsCurrent: number;
  co2EmissionsPotential: number;
  lightingCostCurrent: number;
  lightingCostPotential: number;
  heatingCostCurrent: number;
  heatingCostPotential: number;
  hotWaterCostCurrent: number;
  hotWaterCostPotential: number;
  totalCostCurrent: number;
  totalCostPotential: number;
  lzcEnergySources: number;
  renewableSources: number;
  renewableSourcesDescription?: string;
  energyTariff: string;
  mcsInstallationId?: string;
  inspectionDate: string;
  localAuthorityLabel: string;
  constituencyLabel: string;
  tenure: string;
  fixedLightingOutletsCount: number;
  lowEnergyFixedLightingOutletsCount: number;
  uprn: string;
  uprnSource: string;
  sheffieldSolarPanel: boolean;
  sheffieldSolarWaterHeating: boolean;
  sheffieldWindTurbine: boolean;
  builtForm: string;
  extensionsCount: number;
  percentRoofArea: number;
  glazedArea: number;
  glazedType: string;
  numberHabitableRooms: number;
  numberHeatedRooms: number;
  lowEnergyLighting: number;
  numberOpenFireplaces: number;
  puma: string;
  inspectionDate: string;
  localAuthorityLabel: string;
  constituencyLabel: string;
  tenure: string;
  fixedLightingOutletsCount: number;
  lowEnergyFixedLightingOutletsCount: number;
  uprn: string;
  uprnSource: string;
  sheffieldSolarPanel: boolean;
  sheffieldSolarWaterHeating: boolean;
  sheffieldWindTurbine: boolean;
  builtForm: string;
  extensionsCount: number;
  percentRoofArea: number;
  glazedArea: number;
  glazedType: string;
  numberHabitableRooms: number;
  numberHeatedRooms: number;
  lowEnergyLighting: number;
  numberOpenFireplaces: number;
  puma: string;
}

// HMLR (HM Land Registry) API Types
export interface HMLRData {
  titleNumber: string;
  address: string;
  postcode: string;
  tenure: 'Freehold' | 'Leasehold' | 'Commonhold';
  pricePaid?: number;
  pricePaidDate?: string;
  propertyType: string;
  newBuild: boolean;
  estateType: string;
  saon?: string; // Secondary Addressable Object Name
  paon?: string; // Primary Addressable Object Name
  street?: string;
  locality?: string;
  town?: string;
  district?: string;
  county?: string;
  ppdCategoryType: string;
  recordStatus: string;
  transactions?: HMLRTransaction[];
  charges?: HMLRCharge[];
  restrictions?: HMLRRestriction[];
}

export interface HMLRTransaction {
  price: number;
  date: string;
  category: string;
  newBuild: boolean;
  estateType: string;
  saon?: string;
  paon?: string;
  street?: string;
  locality?: string;
  town?: string;
  district?: string;
  county?: string;
  ppdCategoryType: string;
  recordStatus: string;
}

export interface HMLRCharge {
  chargeNumber: string;
  chargeType: string;
  chargeDescription: string;
  chargeDate: string;
  chargeAmount?: number;
  chargeHolder: string;
}

export interface HMLRRestriction {
  restrictionType: string;
  restrictionDescription: string;
  restrictionDate: string;
  restrictionHolder?: string;
}

// Flood Risk API Types
export interface FloodRiskData {
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
  riskScore: number; // 0-10 scale
  lastUpdated: string;
  dataSource: string;
  warnings?: FloodWarning[];
  historicalFloods?: HistoricalFlood[];
}

export interface FloodRiskLevel {
  level: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  score: number; // 0-10 scale
  description: string;
  probability: string; // e.g., "1 in 100 years"
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

// Planning API Types (bonus)
export interface PlanningData {
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
  type: 'Conservation Area' | 'Listed Building' | 'Tree Preservation Order' | 'Article 4 Direction' | 'Green Belt' | 'AONB' | 'SSSI' | 'Flood Zone';
  name: string;
  description: string;
  status: 'Active' | 'Proposed' | 'Expired';
  date: string;
  authority: string;
  reference?: string;
}

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Cache types
export interface CacheInfo {
  cached: boolean;
  cacheKey: string;
  expiresAt: string;
  ttl: number;
}

// Request context
export interface RequestContext {
  requestId: string;
  userId?: string;
  propertyId?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}
