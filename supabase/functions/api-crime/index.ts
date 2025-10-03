/**
 * Crime Statistics API Edge Function
 * Fetches crime data from Police UK API
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createSupabaseAdminClient,
  handleError,
  createResponse,
  logInfo,
  logError,
} from "../shared/utils.ts";
import { CrimeRequestSchema } from "../shared/validation.ts";
import { CrimeData } from "../shared/types.ts";

serve(async req => {
  if (req.method === "OPTIONS") {
    return createResponse("ok");
  }

  try {
    const { postcode, address } = CrimeRequestSchema.parse(await req.json());
    logInfo(`Fetching crime data for postcode: ${postcode}`);

    // For now, return mock data
    // TODO: Replace with actual Police UK API integration
    const mockCrimeData: CrimeData = {
      address: address || "Sample Address",
      postcode: postcode,
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
      safetyRating: ["Very Safe", "Safe", "Moderate", "Concerning", "High Risk"][
        Math.floor(Math.random() * 5)
      ],
      comparison: {
        nationalAverage: 12.5,
        localAuthorityAverage: 15.2,
        percentile: Math.floor(Math.random() * 100),
      },
    };

    return createResponse(mockCrimeData);
  } catch (error) {
    return handleError(error);
  }
});
