-- PPUK Minimal Property Creation RPC
-- Purpose: Create a minimal property record avoiding enum/column issues
-- Usage: SELECT ppuk_create_property_min('user-uuid-here');

CREATE OR REPLACE FUNCTION ppuk_create_property_min(owner_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_property_id UUID;
BEGIN
  -- Insert minimal property with only safe, required columns
  INSERT INTO properties (
    id,
    owner_id,
    title,
    address_line_1,
    city,
    postcode,
    country,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    owner_id,
    'Dev Property',
    '1 Test Street',
    'London',
    'SW1A 1AA',
    'GB',
    NOW(),
    NOW()
  ) RETURNING id INTO new_property_id;
  
  RETURN new_property_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise with context
    RAISE EXCEPTION 'Failed to create property for owner %: %', owner_id, SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ppuk_create_property_min(UUID) TO authenticated;

-- Add a permissive RLS policy for dev property creation
-- This allows any authenticated user to create properties during development
CREATE POLICY IF NOT EXISTS "dev_create_property" ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure RLS is enabled on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
