/**
 * Education Data API Edge Function
 * Fetches school data from Ofsted and education APIs
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseAdminClient, handleError, createResponse, logInfo, logError } from '../shared/utils.ts';
import { EducationRequestSchema } from '../shared/validation.ts';
import { EducationData } from '../shared/types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createResponse('ok');
  }

  try {
    const { postcode, address } = EducationRequestSchema.parse(await req.json());
    logInfo(`Fetching education data for postcode: ${postcode}`);

    // For now, return mock data
    // TODO: Replace with actual Ofsted API integration
    const mockEducationData: EducationData = {
      address: address || 'Sample Address',
      postcode: postcode,
      lastUpdated: new Date().toISOString(),
      schools: [
        {
          name: 'St. Mary\'s Primary School',
          type: 'Primary',
          phase: 'Primary',
          ofstedRating: 'Good',
          distance: 250,
          address: '123 School Lane',
          postcode: postcode,
          capacity: 210,
          pupils: 195,
          lastInspection: '2023-03-15',
          nextInspection: '2027-03-15',
          website: 'https://stmarysprimary.school',
          phone: '01234 567890'
        },
        {
          name: 'Local Secondary Academy',
          type: 'Secondary',
          phase: 'Secondary',
          ofstedRating: 'Outstanding',
          distance: 800,
          address: '456 Academy Road',
          postcode: postcode,
          capacity: 1200,
          pupils: 1150,
          lastInspection: '2022-11-20',
          website: 'https://localacademy.school',
          phone: '01234 567891'
        }
      ],
      educationSummary: {
        totalSchools: 2,
        outstandingSchools: 1,
        goodSchools: 1,
        requiresImprovement: 0,
        inadequateSchools: 0,
        averageRating: 4.5
      },
      catchmentAreas: {
        primary: ['St. Mary\'s Primary School'],
        secondary: ['Local Secondary Academy']
      }
    };

    return createResponse(mockEducationData);
  } catch (error) {
    return handleError(error);
  }
});
