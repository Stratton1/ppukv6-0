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

    // Get existing dev properties
    const { data: properties, error: propsError } = await supabaseAdmin
      .from("properties")
      .select("id, ppuk_reference, claimed_by")
      .like("ppuk_reference", "PPUK-DEV%")
      .limit(10);

    if (propsError) throw propsError;

    let photosAdded = 0;
    let docsAdded = 0;

    // Sample photo URLs (placeholder images from unsplash)
    const samplePhotos = [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800",
      "https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=800",
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800",
      "https://images.unsplash.com/photo-1560184897-34a5e34e5d7b?w=800",
    ];

    const roomTypes = ["Living Room", "Kitchen", "Bedroom", "Bathroom", "Garden"];

    for (const property of properties || []) {
      // Check if photos already exist
      const { data: existingPhotos } = await supabaseAdmin
        .from("property_photos")
        .select("id")
        .eq("property_id", property.id)
        .limit(1);

      if (!existingPhotos || existingPhotos.length === 0) {
        // Add 3-5 photos per property
        const numPhotos = Math.floor(Math.random() * 3) + 3;
        const photosToAdd = [];

        for (let i = 0; i < numPhotos && i < samplePhotos.length; i++) {
          photosToAdd.push({
            property_id: property.id,
            file_url: samplePhotos[i],
            file_name: `demo-photo-${i + 1}.jpg`,
            caption: `${roomTypes[i % roomTypes.length]} view`,
            room_type: roomTypes[i % roomTypes.length],
            uploaded_by: property.claimed_by || "00000000-0000-0000-0000-000000000000",
            is_featured: i === 0,
          });
        }

        const { error: photoError } = await supabaseAdmin
          .from("property_photos")
          .insert(photosToAdd);

        if (!photoError) {
          photosAdded += photosToAdd.length;
        }
      }

      // Check if documents already exist
      const { data: existingDocs } = await supabaseAdmin
        .from("documents")
        .select("id")
        .eq("property_id", property.id)
        .limit(1);

      if (!existingDocs || existingDocs.length === 0) {
        // Add 2 documents per property
        const docsToAdd = [
          {
            property_id: property.id,
            document_type: "epc",
            file_name: "EPC-Certificate.pdf",
            file_url: `https://example.com/docs/${property.id}/epc.pdf`,
            file_size_bytes: 524288,
            mime_type: "application/pdf",
            description: "Energy Performance Certificate - Rating B (85)",
            uploaded_by: property.claimed_by || "00000000-0000-0000-0000-000000000000",
            ai_summary: "Property has good energy efficiency with modern insulation and heating system.",
          },
          {
            property_id: property.id,
            document_type: "floorplan",
            file_name: "Floor-Plan.pdf",
            file_url: `https://example.com/docs/${property.id}/floorplan.pdf`,
            file_size_bytes: 327680,
            mime_type: "application/pdf",
            description: "Detailed floor plan showing all rooms and dimensions",
            uploaded_by: property.claimed_by || "00000000-0000-0000-0000-000000000000",
          },
        ];

        const { error: docsError } = await supabaseAdmin
          .from("documents")
          .insert(docsToAdd);

        if (!docsError) {
          docsAdded += docsToAdd.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        properties: properties?.length || 0,
        photosAdded,
        docsAdded,
        message: `Seeded ${photosAdded} photos and ${docsAdded} documents`,
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
