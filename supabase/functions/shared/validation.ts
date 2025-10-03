/**
 * Zod validation schemas for PPUK API Edge Functions
 * Provides runtime validation for all API inputs and outputs
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Base schemas
export const PropertyIdentifierSchema = z.object({
  postcode: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i, "Invalid UK postcode format"),
  address: z.string().optional(),
  uprn: z.string().optional(),
});

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
    requestId: z.string().uuid(),
  });

// EPC validation schemas
export const EPCDataSchema = z.object({
  certificateNumber: z.string(),
  address: z.string(),
  postcode: z.string(),
  propertyType: z.string(),
  builtForm: z.string(),
  totalFloorArea: z.number().positive(),
  currentRating: z.enum(["A", "B", "C", "D", "E", "F", "G"]),
  currentEfficiency: z.number().min(0).max(100),
  environmentalImpactRating: z.enum(["A", "B", "C", "D", "E", "F", "G"]),
  environmentalImpactEfficiency: z.number().min(0).max(100),
  mainFuelType: z.string(),
  mainHeatingDescription: z.string(),
  mainHeatingControls: z.string(),
  secondaryHeatingDescription: z.string().optional(),
  hotWaterDescription: z.string(),
  lightingDescription: z.string(),
  windowsDescription: z.string(),
  wallsDescription: z.string(),
  roofDescription: z.string(),
  floorDescription: z.string(),
  mainHeatingEnergyEff: z.string(),
  mainHeatingEnvEff: z.string(),
  hotWaterEnergyEff: z.string(),
  hotWaterEnvEff: z.string(),
  lightingEnergyEff: z.string(),
  lightingEnvEff: z.string(),
  windowsEnergyEff: z.string(),
  windowsEnvEff: z.string(),
  wallsEnergyEff: z.string(),
  wallsEnvEff: z.string(),
  roofEnergyEff: z.string(),
  roofEnvEff: z.string(),
  floorEnergyEff: z.string(),
  floorEnvEff: z.string(),
  mainFuel: z.string(),
  windTurbineCount: z.number().min(0),
  heatLossCorridor: z.string(),
  unheatedCorridorLength: z.number().min(0),
  floorHeight: z.number().positive(),
  photoSupply: z.number().min(0),
  solarWaterHeatingFlag: z.boolean(),
  mechanicalVentilation: z.string(),
  address1: z.string(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  localAuthority: z.string(),
  constituency: z.string(),
  county: z.string(),
  lodgementDate: z.string().datetime(),
  transactionType: z.string(),
  environmentImpactPotential: z.number(),
  co2EmissionsCurrent: z.number().min(0),
  co2EmissionsPotential: z.number().min(0),
  lightingCostCurrent: z.number().min(0),
  lightingCostPotential: z.number().min(0),
  heatingCostCurrent: z.number().min(0),
  heatingCostPotential: z.number().min(0),
  hotWaterCostCurrent: z.number().min(0),
  hotWaterCostPotential: z.number().min(0),
  totalCostCurrent: z.number().min(0),
  totalCostPotential: z.number().min(0),
  lzcEnergySources: z.number().min(0),
  renewableSources: z.number().min(0),
  renewableSourcesDescription: z.string().optional(),
  energyTariff: z.string(),
  mcsInstallationId: z.string().optional(),
  inspectionDate: z.string().datetime(),
  localAuthorityLabel: z.string(),
  constituencyLabel: z.string(),
  tenure: z.string(),
  fixedLightingOutletsCount: z.number().min(0),
  lowEnergyFixedLightingOutletsCount: z.number().min(0),
  uprn: z.string(),
  uprnSource: z.string(),
  sheffieldSolarPanel: z.boolean(),
  sheffieldSolarWaterHeating: z.boolean(),
  sheffieldWindTurbine: z.boolean(),
  builtForm: z.string(),
  extensionsCount: z.number().min(0),
  percentRoofArea: z.number().min(0).max(100),
  glazedArea: z.number().min(0),
  glazedType: z.string(),
  numberHabitableRooms: z.number().min(0),
  numberHeatedRooms: z.number().min(0),
  lowEnergyLighting: z.number().min(0),
  numberOpenFireplaces: z.number().min(0),
  puma: z.string(),
});

// HMLR validation schemas
export const HMLRTransactionSchema = z.object({
  price: z.number().positive(),
  date: z.string().datetime(),
  category: z.string(),
  newBuild: z.boolean(),
  estateType: z.string(),
  saon: z.string().optional(),
  paon: z.string().optional(),
  street: z.string().optional(),
  locality: z.string().optional(),
  town: z.string().optional(),
  district: z.string().optional(),
  county: z.string().optional(),
  ppdCategoryType: z.string(),
  recordStatus: z.string(),
});

export const HMLRChargeSchema = z.object({
  chargeNumber: z.string(),
  chargeType: z.string(),
  chargeDescription: z.string(),
  chargeDate: z.string().datetime(),
  chargeAmount: z.number().positive().optional(),
  chargeHolder: z.string(),
});

export const HMLRRestrictionSchema = z.object({
  restrictionType: z.string(),
  restrictionDescription: z.string(),
  restrictionDate: z.string().datetime(),
  restrictionHolder: z.string().optional(),
});

export const HMLRDataSchema = z.object({
  titleNumber: z.string(),
  address: z.string(),
  postcode: z.string(),
  tenure: z.enum(["Freehold", "Leasehold", "Commonhold"]),
  pricePaid: z.number().positive().optional(),
  pricePaidDate: z.string().datetime().optional(),
  propertyType: z.string(),
  newBuild: z.boolean(),
  estateType: z.string(),
  saon: z.string().optional(),
  paon: z.string().optional(),
  street: z.string().optional(),
  locality: z.string().optional(),
  town: z.string().optional(),
  district: z.string().optional(),
  county: z.string().optional(),
  ppdCategoryType: z.string(),
  recordStatus: z.string(),
  transactions: z.array(HMLRTransactionSchema).optional(),
  charges: z.array(HMLRChargeSchema).optional(),
  restrictions: z.array(HMLRRestrictionSchema).optional(),
});

// Flood Risk validation schemas
export const FloodRiskLevelSchema = z.object({
  level: z.enum(["Very Low", "Low", "Medium", "High", "Very High"]),
  score: z.number().min(0).max(10),
  description: z.string(),
  probability: z.string(),
  impact: z.string(),
  mitigation: z.array(z.string()).optional(),
});

export const FloodWarningSchema = z.object({
  id: z.string(),
  type: z.enum(["Flood Alert", "Flood Warning", "Severe Flood Warning"]),
  severity: z.enum(["Low", "Medium", "High", "Severe"]),
  message: z.string(),
  issuedDate: z.string().datetime(),
  validUntil: z.string().datetime().optional(),
  affectedAreas: z.array(z.string()),
  advice: z.string(),
});

export const HistoricalFloodSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(["Surface Water", "River", "Coastal", "Groundwater"]),
  severity: z.enum(["Minor", "Moderate", "Major"]),
  description: z.string(),
  affectedAreas: z.array(z.string()),
  damageEstimate: z.number().positive().optional(),
});

export const FloodRiskDataSchema = z.object({
  address: z.string(),
  postcode: z.string(),
  uprn: z.string().optional(),
  floodRisk: z.object({
    surfaceWater: FloodRiskLevelSchema,
    riversAndSea: FloodRiskLevelSchema,
    groundwater: FloodRiskLevelSchema,
    reservoirs: FloodRiskLevelSchema,
  }),
  riskLevel: z.enum(["Very Low", "Low", "Medium", "High", "Very High"]),
  riskScore: z.number().min(0).max(10),
  lastUpdated: z.string().datetime(),
  dataSource: z.string(),
  warnings: z.array(FloodWarningSchema).optional(),
  historicalFloods: z.array(HistoricalFloodSchema).optional(),
});

// Planning validation schemas
export const PlanningDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string().url(),
  date: z.string().datetime(),
  size: z.number().positive().optional(),
});

export const PlanningApplicationSchema = z.object({
  reference: z.string(),
  address: z.string(),
  description: z.string(),
  status: z.enum(["Approved", "Refused", "Pending", "Withdrawn"]),
  applicationDate: z.string().datetime(),
  decisionDate: z.string().datetime().optional(),
  applicant: z.string(),
  agent: z.string().optional(),
  ward: z.string(),
  parish: z.string().optional(),
  applicationType: z.string(),
  developmentType: z.string(),
  proposal: z.string(),
  location: z.string(),
  gridReference: z.string().optional(),
  easting: z.number().optional(),
  northing: z.number().optional(),
  documents: z.array(PlanningDocumentSchema).optional(),
});

export const PlanningConstraintSchema = z.object({
  type: z.enum([
    "Conservation Area",
    "Listed Building",
    "Tree Preservation Order",
    "Article 4 Direction",
    "Green Belt",
    "AONB",
    "SSSI",
    "Flood Zone",
  ]),
  name: z.string(),
  description: z.string(),
  status: z.enum(["Active", "Proposed", "Expired"]),
  date: z.string().datetime(),
  authority: z.string(),
  reference: z.string().optional(),
});

export const PlanningDataSchema = z.object({
  address: z.string(),
  postcode: z.string(),
  applications: z.array(PlanningApplicationSchema),
  constraints: z.array(PlanningConstraintSchema),
  lastUpdated: z.string().datetime(),
});

// Request validation schemas
export const EPCRequestSchema = z.object({
  postcode: z.string().min(1).max(10),
  address: z.string().optional(),
  uprn: z.string().optional(),
});

export const HMLRRequestSchema = z.object({
  postcode: z.string().min(1).max(10),
  address: z.string().optional(),
  titleNumber: z.string().optional(),
});

export const FloodRiskRequestSchema = z.object({
  postcode: z.string().min(1).max(10),
  address: z.string().optional(),
  uprn: z.string().optional(),
});

export const PlanningRequestSchema = z.object({
  postcode: z.string().min(1).max(10),
  address: z.string().optional(),
  uprn: z.string().optional(),
});

// Error validation schema
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().uuid(),
});

// Rate limiting schema
export const RateLimitInfoSchema = z.object({
  limit: z.number().positive(),
  remaining: z.number().min(0),
  reset: z.number().positive(),
  retryAfter: z.number().positive().optional(),
});

// Cache schema
export const CacheInfoSchema = z.object({
  cached: z.boolean(),
  cacheKey: z.string(),
  expiresAt: z.string().datetime(),
  ttl: z.number().positive(),
});

// Request context schema
export const RequestContextSchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

// Response schemas with validation
export const EPCResponseSchema = ApiResponseSchema(EPCDataSchema);
export const HMLRResponseSchema = ApiResponseSchema(HMLRDataSchema);
export const FloodRiskResponseSchema = ApiResponseSchema(FloodRiskDataSchema);
export const PlanningResponseSchema = ApiResponseSchema(PlanningDataSchema);

// Utility functions for validation
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      );
    }
    throw error;
  }
}

export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Response validation error: ${error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      );
    }
    throw error;
  }
}

// New API request schemas
export const CrimeRequestSchema = PropertyIdentifierSchema;
export const EducationRequestSchema = PropertyIdentifierSchema;
export const EnvironmentalRequestSchema = PropertyIdentifierSchema;
export const HeritageRequestSchema = PropertyIdentifierSchema;
export const DemographicsRequestSchema = PropertyIdentifierSchema;
export const TopographicRequestSchema = PropertyIdentifierSchema;

// New API data schemas (simplified for now)
export const CrimeDataSchema = z.object({
  address: z.string(),
  postcode: z.string(),
  lastUpdated: z.string(),
  crimeStats: z.object({
    totalCrimes: z.number(),
    crimesByCategory: z.array(
      z.object({
        category: z.string(),
        count: z.number(),
        percentage: z.number(),
        trend: z.enum(["up", "down", "stable"]),
      })
    ),
    crimesByMonth: z.array(
      z.object({
        month: z.string(),
        count: z.number(),
        categories: z.record(z.number()),
      })
    ),
    crimeRate: z.number(),
  }),
  safetyRating: z.enum(["Very Safe", "Safe", "Moderate", "Concerning", "High Risk"]),
  comparison: z.object({
    nationalAverage: z.number(),
    localAuthorityAverage: z.number(),
    percentile: z.number(),
  }),
});

export const EducationDataSchema = z.object({
  address: z.string(),
  postcode: z.string(),
  lastUpdated: z.string(),
  schools: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["Primary", "Secondary", "Special", "Independent"]),
      phase: z.enum(["Primary", "Secondary", "All-through"]),
      ofstedRating: z.enum([
        "Outstanding",
        "Good",
        "Requires improvement",
        "Inadequate",
        "Not yet inspected",
      ]),
      distance: z.number(),
      address: z.string(),
      postcode: z.string(),
      capacity: z.number(),
      pupils: z.number(),
      lastInspection: z.string(),
      nextInspection: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
    })
  ),
  educationSummary: z.object({
    totalSchools: z.number(),
    outstandingSchools: z.number(),
    goodSchools: z.number(),
    requiresImprovement: z.number(),
    inadequateSchools: z.number(),
    averageRating: z.number(),
  }),
  catchmentAreas: z.object({
    primary: z.array(z.string()),
    secondary: z.array(z.string()),
  }),
});

// Type exports for use in other files
export type EPCData = z.infer<typeof EPCDataSchema>;
export type HMLRData = z.infer<typeof HMLRDataSchema>;
export type FloodRiskData = z.infer<typeof FloodRiskDataSchema>;
export type PlanningData = z.infer<typeof PlanningDataSchema>;
export type CrimeData = z.infer<typeof CrimeDataSchema>;
export type EducationData = z.infer<typeof EducationDataSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type RateLimitInfo = z.infer<typeof RateLimitInfoSchema>;
export type CacheInfo = z.infer<typeof CacheInfoSchema>;
export type RequestContext = z.infer<typeof RequestContextSchema>;
