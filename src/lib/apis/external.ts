/**
 * External API Integration Stubs
 * Provides typed interfaces and mock data for additional free APIs
 */

import type { PropertyIdentifier } from "../../types/api";

// ============================================================================
// POLICE UK API - Crime Statistics
// ============================================================================

export interface CrimeData {
  address: string;
  postcode: string;
  lastUpdated: string;
  crimeStats: {
    totalCrimes: number;
    crimesByCategory: CrimeCategory[];
    crimesByMonth: CrimeByMonth[];
    crimeRate: number; // crimes per 1000 people
  };
  safetyRating: "Very Safe" | "Safe" | "Moderate" | "Concerning" | "High Risk";
  comparison: {
    nationalAverage: number;
    localAuthorityAverage: number;
    percentile: number; // 0-100, lower is safer
  };
}

export interface CrimeCategory {
  category: string;
  count: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

export interface CrimeByMonth {
  month: string;
  count: number;
  categories: { [category: string]: number };
}

// ============================================================================
// GOOGLE MAPS / STREET VIEW API - Visual Data
// ============================================================================

export interface StreetViewData {
  address: string;
  postcode: string;
  lastUpdated: string;
  streetView: {
    available: boolean;
    imageUrl?: string; // Embedded Street View image
    heading: number;
    pitch: number;
    fov: number;
  };
  nearbyPlaces: {
    schools: PlaceOfInterest[];
    hospitals: PlaceOfInterest[];
    transport: PlaceOfInterest[];
    amenities: PlaceOfInterest[];
  };
  walkability: {
    score: number; // 0-100
    description: string;
    factors: string[];
  };
}

export interface PlaceOfInterest {
  name: string;
  type: string;
  distance: number; // meters
  rating?: number;
  address: string;
  category: "education" | "healthcare" | "transport" | "amenity" | "entertainment";
}

// ============================================================================
// OFSTED / EDUCATION API - School Ratings
// ============================================================================

export interface EducationData {
  address: string;
  postcode: string;
  lastUpdated: string;
  schools: School[];
  educationSummary: {
    totalSchools: number;
    outstandingSchools: number;
    goodSchools: number;
    requiresImprovement: number;
    inadequateSchools: number;
    averageRating: number;
  };
  catchmentAreas: {
    primary: string[];
    secondary: string[];
  };
}

export interface School {
  name: string;
  type: "Primary" | "Secondary" | "Special" | "Independent";
  phase: "Primary" | "Secondary" | "All-through";
  ofstedRating:
    | "Outstanding"
    | "Good"
    | "Requires improvement"
    | "Inadequate"
    | "Not yet inspected";
  distance: number; // meters
  address: string;
  postcode: string;
  capacity: number;
  pupils: number;
  lastInspection: string;
  nextInspection?: string;
  website?: string;
  phone?: string;
}

// ============================================================================
// ENVIRONMENT AGENCY API - Air Quality & Environmental Data
// ============================================================================

export interface EnvironmentalData {
  address: string;
  postcode: string;
  lastUpdated: string;
  airQuality: {
    overallIndex: number; // 1-10, 1 being excellent
    pollutants: AirPollutant[];
    healthAdvice: string;
    sensitiveGroups: string[];
  };
  noiseLevels: {
    road: number; // dB
    rail: number;
    air: number;
    overall: "Low" | "Moderate" | "High" | "Very High";
  };
  greenSpaces: {
    parks: GreenSpace[];
    natureReserves: GreenSpace[];
    totalArea: number; // hectares within 1km
    accessibility: "Excellent" | "Good" | "Moderate" | "Poor";
  };
  environmentalRisks: {
    floodRisk: "Low" | "Medium" | "High";
    pollutionIncidents: number; // last 12 months
    contaminatedLand: boolean;
    radonRisk: "Low" | "Medium" | "High";
  };
}

export interface AirPollutant {
  name: string;
  level: number;
  unit: string;
  healthImpact: "Low" | "Moderate" | "High" | "Very High";
  source: string;
}

export interface GreenSpace {
  name: string;
  type: "Park" | "Nature Reserve" | "Woodland" | "Garden" | "Playing Field";
  distance: number; // meters
  size: number; // hectares
  facilities: string[];
  accessibility: "Public" | "Restricted" | "Private";
}

// ============================================================================
// HISTORIC ENGLAND API - Listed Buildings & Heritage
// ============================================================================

export interface HeritageData {
  address: string;
  postcode: string;
  lastUpdated: string;
  listedBuildings: ListedBuilding[];
  conservationAreas: ConservationArea[];
  scheduledMonuments: ScheduledMonument[];
  heritageSummary: {
    totalListed: number;
    gradeI: number;
    gradeIIStar: number;
    gradeII: number;
    inConservationArea: boolean;
    heritageValue: "Exceptional" | "High" | "Moderate" | "Low" | "None";
  };
}

export interface ListedBuilding {
  name: string;
  grade: "I" | "II*" | "II";
  listEntry: string;
  description: string;
  dateListed: string;
  distance: number; // meters
  address: string;
  significance: string;
}

export interface ConservationArea {
  name: string;
  designation: string;
  dateDesignated: string;
  description: string;
  managementPlan?: string;
  distance: number; // meters
}

export interface ScheduledMonument {
  name: string;
  description: string;
  period: string;
  dateScheduled: string;
  distance: number; // meters
  significance: string;
}

// ============================================================================
// ONS API - Demographics & Census Data
// ============================================================================

export interface DemographicsData {
  address: string;
  postcode: string;
  lastUpdated: string;
  population: {
    total: number;
    density: number; // people per hectare
    ageDistribution: AgeGroup[];
    householdComposition: HouseholdType[];
  };
  socioeconomics: {
    averageIncome: number;
    employmentRate: number;
    educationLevels: EducationLevel[];
    deprivationIndex: number; // 1-10, 1 being least deprived
  };
  housing: {
    totalDwellings: number;
    dwellingTypes: DwellingType[];
    occupancy: {
      ownerOccupied: number;
      privateRented: number;
      socialRented: number;
      vacant: number;
    };
  };
  diversity: {
    ethnicGroups: EthnicGroup[];
    languages: Language[];
    religions: Religion[];
  };
}

export interface AgeGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface HouseholdType {
  type: string;
  count: number;
  percentage: number;
}

export interface EducationLevel {
  level: string;
  count: number;
  percentage: number;
}

export interface DwellingType {
  type: string;
  count: number;
  percentage: number;
}

export interface EthnicGroup {
  group: string;
  count: number;
  percentage: number;
}

export interface Language {
  language: string;
  speakers: number;
  percentage: number;
}

export interface Religion {
  religion: string;
  adherents: number;
  percentage: number;
}

// ============================================================================
// ORDNANCE SURVEY API - Property Boundaries & Topography
// ============================================================================

export interface TopographicData {
  address: string;
  postcode: string;
  lastUpdated: string;
  propertyBoundary: {
    area: number; // square meters
    perimeter: number; // meters
    coordinates: GeoCoordinate[];
    accuracy: "High" | "Medium" | "Low";
  };
  topography: {
    elevation: number; // meters above sea level
    slope: number; // degrees
    aspect: number; // degrees (0-360)
    terrain: string;
  };
  landUse: {
    primary: string;
    secondary?: string;
    planningDesignation: string;
    agriculturalGrade?: string;
  };
  utilities: {
    gas: boolean;
    electricity: boolean;
    water: boolean;
    sewerage: boolean;
    broadband: BroadbandInfo;
  };
  access: {
    roadAccess: "Excellent" | "Good" | "Moderate" | "Poor";
    publicTransport: PublicTransportInfo;
    parking: ParkingInfo;
  };
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface BroadbandInfo {
  available: boolean;
  maxSpeed: number; // Mbps
  providers: string[];
  coverage: "Full" | "Partial" | "Limited";
}

export interface PublicTransportInfo {
  busStops: TransportStop[];
  trainStations: TransportStop[];
  frequency: "High" | "Medium" | "Low" | "None";
  accessibility: "Excellent" | "Good" | "Moderate" | "Poor";
}

export interface TransportStop {
  name: string;
  type: "Bus" | "Train" | "Tram" | "Metro";
  distance: number; // meters
  services: string[];
  frequency: string;
}

export interface ParkingInfo {
  onStreet: "Permit" | "Pay & Display" | "Free" | "Restricted";
  offStreet: boolean;
  garages: number;
  driveways: number;
}

// ============================================================================
// API CLIENT INTERFACES
// ============================================================================

export interface ExternalApiClient {
  getCrimeData(property: PropertyIdentifier): Promise<CrimeData>;
  getStreetViewData(property: PropertyIdentifier): Promise<StreetViewData>;
  getEducationData(property: PropertyIdentifier): Promise<EducationData>;
  getEnvironmentalData(property: PropertyIdentifier): Promise<EnvironmentalData>;
  getHeritageData(property: PropertyIdentifier): Promise<HeritageData>;
  getDemographicsData(property: PropertyIdentifier): Promise<DemographicsData>;
  getTopographicData(property: PropertyIdentifier): Promise<TopographicData>;
}

// ============================================================================
// MOCK DATA GENERATORS (for development)
// ============================================================================

export function generateMockCrimeData(property: PropertyIdentifier): CrimeData {
  return {
    address: property.address || "Sample Address",
    postcode: property.postcode,
    lastUpdated: new Date().toISOString(),
    crimeStats: {
      totalCrimes: Math.floor(Math.random() * 50) + 10,
      crimesByCategory: [
        { category: "Anti-social behaviour", count: 15, percentage: 45, trend: "down" },
        { category: "Violence and sexual offences", count: 8, percentage: 24, trend: "stable" },
        { category: "Criminal damage and arson", count: 5, percentage: 15, trend: "up" },
        { category: "Other theft", count: 3, percentage: 9, trend: "stable" },
        { category: "Vehicle crime", count: 2, percentage: 7, trend: "down" },
      ],
      crimesByMonth: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i).toLocaleDateString("en-GB", { month: "short" }),
        count: Math.floor(Math.random() * 10) + 1,
        categories: {
          "Anti-social behaviour": Math.floor(Math.random() * 5) + 1,
          "Violence and sexual offences": Math.floor(Math.random() * 3) + 1,
          "Criminal damage and arson": Math.floor(Math.random() * 2) + 1,
        },
      })),
      crimeRate: Math.floor(Math.random() * 20) + 5,
    },
    safetyRating: (["Very Safe", "Safe", "Moderate", "Concerning", "High Risk"] as const)[
      Math.floor(Math.random() * 5)
    ],
    comparison: {
      nationalAverage: 12.5,
      localAuthorityAverage: 15.2,
      percentile: Math.floor(Math.random() * 100),
    },
  };
}

export function generateMockStreetViewData(property: PropertyIdentifier): StreetViewData {
  return {
    address: property.address || "Sample Address",
    postcode: property.postcode,
    lastUpdated: new Date().toISOString(),
    streetView: {
      available: true,
      imageUrl: `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${encodeURIComponent(property.address || property.postcode)}&key=YOUR_API_KEY`,
      heading: Math.floor(Math.random() * 360),
      pitch: Math.floor(Math.random() * 40) - 20,
      fov: 90,
    },
    nearbyPlaces: {
      schools: [
        {
          name: "Local Primary School",
          type: "Primary School",
          distance: 250,
          rating: 4.2,
          address: "123 School Lane",
          category: "education",
        },
        {
          name: "Secondary Academy",
          type: "Secondary School",
          distance: 800,
          rating: 3.8,
          address: "456 Academy Road",
          category: "education",
        },
      ],
      hospitals: [
        {
          name: "General Hospital",
          type: "Hospital",
          distance: 1200,
          rating: 4.0,
          address: "789 Hospital Way",
          category: "healthcare",
        },
      ],
      transport: [
        {
          name: "Bus Stop",
          type: "Bus Stop",
          distance: 150,
          address: "Main Street",
          category: "transport",
        },
        {
          name: "Train Station",
          type: "Railway Station",
          distance: 2000,
          rating: 4.1,
          address: "Station Road",
          category: "transport",
        },
      ],
      amenities: [
        {
          name: "Local Supermarket",
          type: "Supermarket",
          distance: 300,
          rating: 4.3,
          address: "High Street",
          category: "amenity",
        },
        {
          name: "Community Centre",
          type: "Community Centre",
          distance: 500,
          address: "Community Lane",
          category: "amenity",
        },
      ],
    },
    walkability: {
      score: Math.floor(Math.random() * 40) + 60,
      description: "Good walkability with nearby amenities and transport links",
      factors: [
        "Nearby shops",
        "Public transport",
        "Parks and green spaces",
        "Schools within walking distance",
      ],
    },
  };
}

export function generateMockEducationData(property: PropertyIdentifier): EducationData {
  return {
    address: property.address || "Sample Address",
    postcode: property.postcode,
    lastUpdated: new Date().toISOString(),
    schools: [
      {
        name: "St. Mary's Primary School",
        type: "Primary",
        phase: "Primary",
        ofstedRating: "Good",
        distance: 250,
        address: "123 School Lane",
        postcode: property.postcode,
        capacity: 210,
        pupils: 195,
        lastInspection: "2023-03-15",
        nextInspection: "2027-03-15",
        website: "https://stmarysprimary.school",
        phone: "01234 567890",
      },
      {
        name: "Local Secondary Academy",
        type: "Secondary",
        phase: "Secondary",
        ofstedRating: "Outstanding",
        distance: 800,
        address: "456 Academy Road",
        postcode: property.postcode,
        capacity: 1200,
        pupils: 1150,
        lastInspection: "2022-11-20",
        website: "https://localacademy.school",
        phone: "01234 567891",
      },
    ],
    educationSummary: {
      totalSchools: 2,
      outstandingSchools: 1,
      goodSchools: 1,
      requiresImprovement: 0,
      inadequateSchools: 0,
      averageRating: 4.5,
    },
    catchmentAreas: {
      primary: ["St. Mary's Primary School"],
      secondary: ["Local Secondary Academy"],
    },
  };
}

// ============================================================================
// API CLIENT IMPLEMENTATION
// ============================================================================

export class MockExternalApiClient implements ExternalApiClient {
  async getCrimeData(property: PropertyIdentifier): Promise<CrimeData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockCrimeData(property);
  }

  async getStreetViewData(property: PropertyIdentifier): Promise<StreetViewData> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockStreetViewData(property);
  }

  async getEducationData(property: PropertyIdentifier): Promise<EducationData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateMockEducationData(property);
  }

  async getEnvironmentalData(property: PropertyIdentifier): Promise<EnvironmentalData> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      address: property.address || "Sample Address",
      postcode: property.postcode,
      lastUpdated: new Date().toISOString(),
      airQuality: {
        overallIndex: Math.floor(Math.random() * 5) + 1,
        pollutants: [
          { name: "PM2.5", level: 12, unit: "μg/m³", healthImpact: "Low", source: "Traffic" },
          { name: "NO2", level: 25, unit: "μg/m³", healthImpact: "Moderate", source: "Vehicles" },
        ],
        healthAdvice: "Air quality is generally good for most people",
        sensitiveGroups: ["People with heart or lung conditions"],
      },
      noiseLevels: {
        road: 45,
        rail: 35,
        air: 25,
        overall: "Low",
      },
      greenSpaces: {
        parks: [
          {
            name: "Local Park",
            type: "Park",
            distance: 300,
            size: 2.5,
            facilities: ["Playground", "Football pitch"],
            accessibility: "Public",
          },
        ],
        natureReserves: [],
        totalArea: 2.5,
        accessibility: "Good",
      },
      environmentalRisks: {
        floodRisk: "Low",
        pollutionIncidents: 0,
        contaminatedLand: false,
        radonRisk: "Low",
      },
    };
  }

  async getHeritageData(property: PropertyIdentifier): Promise<HeritageData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      address: property.address || "Sample Address",
      postcode: property.postcode,
      lastUpdated: new Date().toISOString(),
      listedBuildings: [
        {
          name: "Historic Church",
          grade: "II*",
          listEntry: "1234567",
          description: "Victorian church with notable architectural features",
          dateListed: "1985-03-15",
          distance: 500,
          address: "Church Lane",
          significance: "Local landmark with historical importance",
        },
      ],
      conservationAreas: [],
      scheduledMonuments: [],
      heritageSummary: {
        totalListed: 1,
        gradeI: 0,
        gradeIIStar: 1,
        gradeII: 0,
        inConservationArea: false,
        heritageValue: "Moderate",
      },
    };
  }

  async getDemographicsData(property: PropertyIdentifier): Promise<DemographicsData> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      address: property.address || "Sample Address",
      postcode: property.postcode,
      lastUpdated: new Date().toISOString(),
      population: {
        total: 2500,
        density: 12.5,
        ageDistribution: [
          { range: "0-17", count: 400, percentage: 16 },
          { range: "18-34", count: 600, percentage: 24 },
          { range: "35-54", count: 700, percentage: 28 },
          { range: "55-64", count: 400, percentage: 16 },
          { range: "65+", count: 400, percentage: 16 },
        ],
        householdComposition: [
          { type: "Single person", count: 300, percentage: 30 },
          { type: "Couple", count: 400, percentage: 40 },
          { type: "Family with children", count: 200, percentage: 20 },
          { type: "Other", count: 100, percentage: 10 },
        ],
      },
      socioeconomics: {
        averageIncome: 35000,
        employmentRate: 85,
        educationLevels: [
          { level: "No qualifications", count: 200, percentage: 20 },
          { level: "GCSE or equivalent", count: 300, percentage: 30 },
          { level: "A-level or equivalent", count: 250, percentage: 25 },
          { level: "Degree or higher", count: 250, percentage: 25 },
        ],
        deprivationIndex: 5,
      },
      housing: {
        totalDwellings: 1000,
        dwellingTypes: [
          { type: "Detached", count: 200, percentage: 20 },
          { type: "Semi-detached", count: 300, percentage: 30 },
          { type: "Terraced", count: 250, percentage: 25 },
          { type: "Flat", count: 250, percentage: 25 },
        ],
        occupancy: {
          ownerOccupied: 600,
          privateRented: 300,
          socialRented: 80,
          vacant: 20,
        },
      },
      diversity: {
        ethnicGroups: [
          { group: "White British", count: 2000, percentage: 80 },
          { group: "White Other", count: 200, percentage: 8 },
          { group: "Asian", count: 150, percentage: 6 },
          { group: "Black", count: 100, percentage: 4 },
          { group: "Other", count: 50, percentage: 2 },
        ],
        languages: [
          { language: "English", speakers: 2400, percentage: 96 },
          { language: "Polish", speakers: 50, percentage: 2 },
          { language: "Other", speakers: 50, percentage: 2 },
        ],
        religions: [
          { religion: "Christian", adherents: 1500, percentage: 60 },
          { religion: "No religion", adherents: 800, percentage: 32 },
          { religion: "Other", adherents: 200, percentage: 8 },
        ],
      },
    };
  }

  async getTopographicData(property: PropertyIdentifier): Promise<TopographicData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      address: property.address || "Sample Address",
      postcode: property.postcode,
      lastUpdated: new Date().toISOString(),
      propertyBoundary: {
        area: 500,
        perimeter: 100,
        coordinates: [
          { latitude: 51.5074, longitude: -0.1278 },
          { latitude: 51.5075, longitude: -0.1278 },
          { latitude: 51.5075, longitude: -0.1277 },
          { latitude: 51.5074, longitude: -0.1277 },
        ],
        accuracy: "High",
      },
      topography: {
        elevation: 25,
        slope: 2,
        aspect: 180,
        terrain: "Flat",
      },
      landUse: {
        primary: "Residential",
        secondary: "Garden",
        planningDesignation: "Residential Zone",
      },
      utilities: {
        gas: true,
        electricity: true,
        water: true,
        sewerage: true,
        broadband: {
          available: true,
          maxSpeed: 100,
          providers: ["BT", "Virgin Media", "Sky"],
          coverage: "Full",
        },
      },
      access: {
        roadAccess: "Good",
        publicTransport: {
          busStops: [
            {
              name: "Main Street",
              type: "Bus",
              distance: 150,
              services: ["1", "2", "3"],
              frequency: "Every 10 minutes",
            },
          ],
          trainStations: [
            {
              name: "Central Station",
              type: "Train",
              distance: 2000,
              services: ["London", "Birmingham"],
              frequency: "Every 30 minutes",
            },
          ],
          frequency: "High",
          accessibility: "Good",
        },
        parking: {
          onStreet: "Permit",
          offStreet: true,
          garages: 1,
          driveways: 1,
        },
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const externalApiClient = new MockExternalApiClient();

// Convenience functions
export const getCrimeData = (property: PropertyIdentifier) =>
  externalApiClient.getCrimeData(property);
export const getStreetViewData = (property: PropertyIdentifier) =>
  externalApiClient.getStreetViewData(property);
export const getEducationData = (property: PropertyIdentifier) =>
  externalApiClient.getEducationData(property);
export const getEnvironmentalData = (property: PropertyIdentifier) =>
  externalApiClient.getEnvironmentalData(property);
export const getHeritageData = (property: PropertyIdentifier) =>
  externalApiClient.getHeritageData(property);
export const getDemographicsData = (property: PropertyIdentifier) =>
  externalApiClient.getDemographicsData(property);
export const getTopographicData = (property: PropertyIdentifier) =>
  externalApiClient.getTopographicData(property);
