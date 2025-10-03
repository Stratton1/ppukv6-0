-- PPUK Development Seed Data
-- IMPORTANT: This script is for DEVELOPMENT ONLY
-- Run only in dev/test environments
-- Idempotent: Safe to run multiple times

-- ===========================================
-- SEED TEST USERS (via auth.users)
-- ===========================================
-- Note: These need to be created via Supabase Admin API or edge function
-- See: supabase/functions/create-test-users/index.ts

-- Manual creation instructions:
-- 1. ppuk_owner@example.com / Password123! (role: owner)
-- 2. ppuk_buyer@example.com / Password123! (role: buyer)

-- ===========================================
-- SEED PROPERTIES
-- ===========================================
INSERT INTO properties (
  id,
  ppuk_reference,
  address_line_1,
  address_line_2,
  city,
  postcode,
  title_number,
  property_type,
  property_style,
  bedrooms,
  bathrooms,
  total_floor_area_sqm,
  year_built,
  tenure,
  epc_rating,
  epc_score,
  flood_risk_level,
  council_tax_band,
  completion_percentage,
  is_public,
  claimed_by
) VALUES
-- Property 1: Claimed by test owner
(
  '11111111-1111-1111-1111-111111111111',
  'PPUK-DEV001',
  '123 Victoria Street',
  'Flat 4B',
  'London',
  'SW1A 1AA',
  'TT123456',
  'flat',
  'victorian',
  2,
  1,
  75.5,
  1890,
  'leasehold',
  'C',
  72,
  'Low',
  'D',
  65,
  true,
  NULL -- Will be set after user creation
),
-- Property 2: Unclaimed
(
  '22222222-2222-2222-2222-222222222222',
  'PPUK-DEV002',
  '456 Oxford Road',
  NULL,
  'Manchester',
  'M1 2AB',
  'GM987654',
  'terraced',
  'edwardian',
  3,
  2,
  95.0,
  1905,
  'freehold',
  'B',
  85,
  'Very Low',
  'C',
  80,
  true,
  NULL
),
-- Property 3: Modern apartment
(
  '33333333-3333-3333-3333-333333333333',
  'PPUK-DEV003',
  '789 Canary Wharf',
  'Unit 12',
  'London',
  'E14 5AB',
  'TT765432',
  'flat',
  'modern',
  1,
  1,
  55.0,
  2020,
  'leasehold',
  'A',
  95,
  'Low',
  'B',
  90,
  true,
  NULL
),
-- Property 4: Family home
(
  '44444444-4444-4444-4444-444444444444',
  'PPUK-DEV004',
  '234 Green Lane',
  NULL,
  'Birmingham',
  'B15 2TU',
  'WM456789',
  'detached',
  'new_build',
  4,
  3,
  140.0,
  2022,
  'freehold',
  'A',
  92,
  'Low',
  'E',
  75,
  true,
  NULL
),
-- Property 5: Period cottage
(
  '55555555-5555-5555-5555-555555555555',
  'PPUK-DEV005',
  '12 Mill Cottage',
  'The Green',
  'Stratford-upon-Avon',
  'CV37 6HB',
  'WR123456',
  'cottage',
  'period',
  2,
  1,
  68.0,
  1750,
  'freehold',
  'D',
  60,
  'Medium',
  'F',
  50,
  true,
  NULL
),
-- Property 6: Semi-detached
(
  '66666666-6666-6666-6666-666666666666',
  'PPUK-DEV006',
  '78 Park Avenue',
  NULL,
  'Leeds',
  'LS6 2UF',
  'WY789012',
  'semi_detached',
  'victorian',
  3,
  2,
  105.0,
  1895,
  'freehold',
  'C',
  70,
  'Low',
  'D',
  60,
  true,
  NULL
),
-- Property 7: Bungalow
(
  '77777777-7777-7777-7777-777777777777',
  'PPUK-DEV007',
  '45 Seafront Road',
  NULL,
  'Brighton',
  'BN2 1AA',
  'ES345678',
  'bungalow',
  'modern',
  2,
  2,
  82.0,
  1985,
  'freehold',
  'C',
  68,
  'High',
  'D',
  70,
  true,
  NULL
),
-- Property 8: Georgian townhouse
(
  '88888888-8888-8888-8888-888888888888',
  'PPUK-DEV008',
  '21 Royal Crescent',
  NULL,
  'Bath',
  'BA1 2LR',
  'AV901234',
  'terraced',
  'georgian',
  4,
  3,
  180.0,
  1775,
  'freehold',
  'D',
  62,
  'Low',
  'F',
  55,
  true,
  NULL
),
-- Property 9: Modern flat
(
  '99999999-9999-9999-9999-999999999999',
  'PPUK-DEV009',
  '100 Skyline Tower',
  'Apartment 45',
  'Liverpool',
  'L1 8JQ',
  'MS567890',
  'flat',
  'contemporary',
  2,
  2,
  88.0,
  2019,
  'leasehold',
  'B',
  88,
  'Low',
  'C',
  85,
  true,
  NULL
),
-- Property 10: Victorian semi
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'PPUK-DEV010',
  '67 Station Road',
  NULL,
  'Bristol',
  'BS1 6QU',
  'HT234567',
  'semi_detached',
  'victorian',
  3,
  1,
  98.0,
  1888,
  'freehold',
  'E',
  55,
  'Low',
  'E',
  45,
  true,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- MARK AS DEV TEST DATA
-- ===========================================
-- Add comment to identify test data
COMMENT ON TABLE properties IS 'Contains production and test data. Test records have PPUK-DEV prefix.';

-- ===========================================
-- CLEANUP SCRIPT (for resetting dev environment)
-- ===========================================
-- Uncomment to reset test data:
-- DELETE FROM documents WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-DEV%');
-- DELETE FROM property_photos WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-DEV%');
-- DELETE FROM properties WHERE ppuk_reference LIKE 'PPUK-DEV%';