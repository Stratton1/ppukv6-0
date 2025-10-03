-- Create a helper function to fetch enum values
-- Run this in Supabase SQL Editor if the enum_values RPC doesn't exist

CREATE OR REPLACE FUNCTION enum_values(enum_name text)
RETURNS text[] AS $$
DECLARE
    result text[];
BEGIN
    SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
    INTO result
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = enum_name;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
