-- Check what enum values are available for property_type
-- Run this in Supabase SQL Editor to see valid values

SELECT 
    enumlabel as valid_property_types
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'property_type'
ORDER BY e.enumsortorder;
