-- RPC function to safely create a property with default enum values
-- This prevents client-side enum issues by setting safe defaults server-side

CREATE OR REPLACE FUNCTION dev_create_owner_property(
  p_title text,
  p_address_line_1 text,
  p_city text,
  p_postcode text,
  p_country text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property_id uuid;
  v_owner_id uuid;
BEGIN
  -- Get the current authenticated user
  v_owner_id := auth.uid();
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user';
  END IF;

  -- Insert property with safe enum defaults
  INSERT INTO properties (
    owner_id,
    title,
    address_line_1,
    city,
    postcode,
    country,
    property_type,  -- Set safe default
    tenure,         -- Set safe default
    claimed_by      -- Set to owner
  ) VALUES (
    v_owner_id,
    p_title,
    p_address_line_1,
    p_city,
    p_postcode,
    p_country,
    'detached'::property_type,  -- Safe default
    'freehold'::tenure_type,    -- Safe default
    v_owner_id                  -- Claimed by owner
  ) RETURNING id INTO v_property_id;

  RETURN v_property_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION dev_create_owner_property(text, text, text, text, text) TO authenticated;
