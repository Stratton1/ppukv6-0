import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
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

    const testUsers = [
      {
        email: "owner@ppuk.test",
        password: "password123",
        email_confirm: true,
        user_metadata: {
          full_name: "Test Owner",
          role: "owner",
        },
      },
      {
        email: "buyer@ppuk.test",
        password: "password123",
        email_confirm: true,
        user_metadata: {
          full_name: "Test Buyer",
          role: "buyer",
        },
      },
    ];

    const results = [];

    for (const testUser of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users.some(u => u.email === testUser.email);

      if (userExists) {
        results.push({
          email: testUser.email,
          status: "already_exists",
          message: "User already exists",
        });
        continue;
      }

      // Create user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: testUser.user_metadata,
      });

      if (error) {
        results.push({
          email: testUser.email,
          status: "error",
          message: error.message,
        });
      } else {
        results.push({
          email: testUser.email,
          status: "created",
          message: "User created successfully",
          userId: data.user?.id,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
