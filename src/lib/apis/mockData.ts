// Mock API data - will be replaced with real API calls
export const mockEPCData = {
  rating: "C",
  score: 72,
  potentialRating: "B",
  potentialScore: 85,
  expiryDate: "2028-12-31",
  recommendations: [
    "Install loft insulation",
    "Upgrade heating controls",
    "Replace single glazed windows",
  ],
  currentEnergyEfficiency: 72,
  currentEnvironmentalImpact: 68,
};

export const mockFloodData = {
  surfaceWater: "Low",
  riverSea: "Very Low",
  groundwater: "Low",
  reservoirs: "Very Low",
  overallRisk: "Low",
  details: {
    surfaceWater: "This property has a low risk of flooding from surface water.",
    riverSea: "This property has a very low risk of flooding from rivers and sea.",
    recommendations: [
      "Consider flood resistant fittings if renovating",
      "Maintain drainage systems",
    ],
  },
};

export const mockHMLRData = {
  titleNumber: "AB123456",
  tenure: "Freehold",
  proprietor: "Mr John Smith",
  pricePaid: 325000,
  dateOfPurchase: "2021-05-15",
  previousSales: [
    { price: 285000, date: "2018-03-20" },
    { price: 240000, date: "2015-07-12" },
  ],
  charges: [],
  restrictions: [],
};

export const mockPlanningData = {
  recentApplications: [
    {
      reference: "21/01234/FUL",
      description: "Single storey rear extension",
      status: "Approved",
      dateDecided: "2021-08-15",
    },
    {
      reference: "19/05678/FUL",
      description: "Loft conversion with dormer",
      status: "Approved",
      dateDecided: "2019-11-20",
    },
  ],
  constraints: ["Not in conservation area", "Not a listed building", "Article 4 direction applies"],
};
