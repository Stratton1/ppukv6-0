#!/bin/bash

# Deploy Edge Functions for Property Passport UK
# This script deploys all API Edge Functions to Supabase

set -e

echo "🚀 Deploying Property Passport UK Edge Functions..."

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: supabase/config.toml not found. Please run this script from the project root."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI found and authenticated"

# Create import map if it doesn't exist
if [ ! -f "supabase/functions/import_map.json" ]; then
    echo "📝 Creating import map..."
    cat > supabase/functions/import_map.json << EOF
{
  "imports": {
    "https://deno.land/std@0.168.0/": "https://deno.land/std@0.168.0/",
    "https://esm.sh/@supabase/supabase-js@2.39.3": "https://esm.sh/@supabase/supabase-js@2.39.3",
    "https://deno.land/x/zod@v3.23.0/mod.ts": "https://deno.land/x/zod@v3.23.0/mod.ts"
  }
}
EOF
fi

# Deploy individual functions
echo "📦 Deploying EPC API function..."
supabase functions deploy api-epc --no-verify-jwt --import-map=./supabase/functions/import_map.json

echo "📦 Deploying HMLR API function..."
supabase functions deploy api-hmlr --no-verify-jwt --import-map=./supabase/functions/import_map.json

echo "📦 Deploying Flood Risk API function..."
supabase functions deploy api-flood --no-verify-jwt --import-map=./supabase/functions/import_map.json

echo "📦 Deploying Crime API function..."
supabase functions deploy api-crime --no-verify-jwt --import-map=./supabase/functions/import_map.json

echo "📦 Deploying Education API function..."
supabase functions deploy api-education --no-verify-jwt --import-map=./supabase/functions/import_map.json

echo "✅ All Edge Functions deployed successfully!"

# Display function URLs
echo ""
echo "🔗 Function URLs:"
echo "   EPC API: https://$(supabase status --output json | jq -r '.project_id').supabase.co/functions/v1/api-epc"
echo "   HMLR API: https://$(supabase status --output json | jq -r '.project_id').supabase.co/functions/v1/api-hmlr"
echo "   Flood API: https://$(supabase status --output json | jq -r '.project_id').supabase.co/functions/v1/api-flood"
echo "   Crime API: https://$(supabase status --output json | jq -r '.project_id').supabase.co/functions/v1/api-crime"
echo "   Education API: https://$(supabase status --output json | jq -r '.project_id').supabase.co/functions/v1/api-education"

echo ""
echo "🔐 Next steps:"
echo "   1. Set API keys as secrets:"
echo "      supabase secrets set EPC_API_KEY=your_epc_key"
echo "      supabase secrets set HMLR_API_KEY=your_hmlr_key"
echo "      supabase secrets set FLOOD_API_KEY=your_flood_key"
echo ""
echo "   2. Test the functions:"
echo "      curl -X POST https://your-project.supabase.co/functions/v1/api-epc \\"
echo "        -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"propertyId\":\"test\",\"postcode\":\"SW1A 1AA\",\"address\":\"Test Address\"}'"
echo ""
echo "🎉 Deployment complete!"
