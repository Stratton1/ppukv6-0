import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Step 1: Create test users
    const testUsers = [
      {
        email: "ppuk_owner@example.com",
        password: "Password123!",
        user_metadata: {
          full_name: "Test Owner",
          role: "owner",
        },
      },
      {
        email: "ppuk_buyer@example.com",
        password: "Password123!",
        user_metadata: {
          full_name: "Test Buyer",
          role: "buyer",
        },
      },
    ];

    const userResults = [];
    let ownerId = null;
    let buyerId = null;

    for (const testUser of testUsers) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users.find((u) => u.email === testUser.email);

      if (userExists) {
        userResults.push({
          email: testUser.email,
          status: "already_exists",
          userId: userExists.id,
        });
        if (testUser.email === "ppuk_owner@example.com") ownerId = userExists.id;
        if (testUser.email === "ppuk_buyer@example.com") buyerId = userExists.id;
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: testUser.user_metadata,
        });

        if (error) {
          userResults.push({ email: testUser.email, status: "error", message: error.message });
        } else {
          userResults.push({ email: testUser.email, status: "created", userId: data.user?.id });
          if (testUser.email === "ppuk_owner@example.com") ownerId = data.user?.id;
          if (testUser.email === "ppuk_buyer@example.com") buyerId = data.user?.id;
        }
      }
    }

    // Step 2: Seed properties (only if they don't exist)
    const { data: existingProps } = await supabaseAdmin
      .from("properties")
      .select("ppuk_reference")
      .like("ppuk_reference", "PPUK-DEV%");

    let propertiesSeeded = 0;

    if (!existingProps || existingProps.length === 0) {
      const mockProperties = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          ppuk_reference: "PPUK-DEV001",
          address_line_1: "123 Victoria Street",
          address_line_2: "Flat 4B",
          city: "London",
          postcode: "SW1A 1AA",
          title_number: "TT123456",
          property_type: "flat",
          property_style: "victorian",
          bedrooms: 2,
          bathrooms: 1,
          total_floor_area_sqm: 75.5,
          year_built: 1890,
          tenure: "leasehold",
          epc_rating: "C",
          epc_score: 72,
          flood_risk_level: "Low",
          council_tax_band: "D",
          completion_percentage: 65,
          claimed_by: ownerId,
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          ppuk_reference: "PPUK-DEV002",
          address_line_1: "456 Oxford Road",
          city: "Manchester",
          postcode: "M1 2AB",
          title_number: "GM987654",
          property_type: "terraced",
          property_style: "edwardian",
          bedrooms: 3,
          bathrooms: 2,
          total_floor_area_sqm: 95.0,
          year_built: 1905,
          tenure: "freehold",
          epc_rating: "B",
          epc_score: 85,
          flood_risk_level: "Very Low",
          council_tax_band: "C",
          completion_percentage: 80,
          claimed_by: null,
        },
        // Add more properties as needed...
      ];

      const { data: insertedProps, error: propsError } = await supabaseAdmin
        .from("properties")
        .insert(mockProperties as any)
        .select();

      if (propsError) {
        console.error("Error seeding properties:", propsError);
      } else {
        propertiesSeeded = insertedProps?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        users: userResults,
        properties: propertiesSeeded,
        message: "Dev data seeded successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});