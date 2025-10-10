#!/bin/bash

# Test script for watchlist endpoints
# This script demonstrates the curl commands for testing the new endpoints

echo "🧪 Testing PPUK v6 Watchlist Endpoints"
echo "======================================"

# Configuration
BASE_URL="https://your-project.supabase.co"
AUTH_TOKEN="your-jwt-token-here"
PROPERTY_ID="your-property-uuid-here"

echo ""
echo "1. Testing My Properties (Owner)"
echo "GET $BASE_URL/functions/v1/my_properties?relationship=owner"
echo ""
curl -X GET "$BASE_URL/functions/v1/my_properties?relationship=owner" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "2. Testing My Properties (Interested/Watchlist)"
echo "GET $BASE_URL/functions/v1/my_properties?relationship=interested"
echo ""
curl -X GET "$BASE_URL/functions/v1/my_properties?relationship=interested" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "3. Testing Watchlist Add"
echo "POST $BASE_URL/functions/v1/watchlist_add"
echo ""
curl -X POST "$BASE_URL/functions/v1/watchlist_add" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"property_id\": \"$PROPERTY_ID\"}" \
  | jq '.'

echo ""
echo "4. Testing Watchlist Remove"
echo "POST $BASE_URL/functions/v1/watchlist_remove"
echo ""
curl -X POST "$BASE_URL/functions/v1/watchlist_remove" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"property_id\": \"$PROPERTY_ID\"}" \
  | jq '.'

echo ""
echo "5. Testing Property Snapshot (Owner View)"
echo "POST $BASE_URL/functions/v1/property_snapshot"
echo ""
curl -X POST "$BASE_URL/functions/v1/property_snapshot" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"property_id\": \"$PROPERTY_ID\"}" \
  | jq '.'

echo ""
echo "✅ Test script completed!"
echo ""
echo "📝 Notes:"
echo "- Replace BASE_URL with your Supabase project URL"
echo "- Replace AUTH_TOKEN with a valid JWT token"
echo "- Replace PROPERTY_ID with a valid property UUID"
echo "- Install jq for JSON formatting: brew install jq"
echo ""
echo "🔍 Expected Results:"
echo "- My Properties: Returns filtered properties based on relationship"
echo "- Watchlist Add: Returns success message or appropriate error"
echo "- Watchlist Remove: Returns success message or 'not in watchlist'"
echo "- Property Snapshot: Returns different data based on user's relationship"
