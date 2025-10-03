-- Check Properties Table Schema
-- Run this in Supabase SQL Editor to see what columns actually exist

-- 1. Check if properties table exists and get its columns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the tenure_type enum exists
SELECT 
    enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'tenure_type'
);

-- 3. Check if property_type enum exists
SELECT 
    enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'property_type'
);

-- 4. Check if media table exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'media' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check storage buckets
SELECT 
    id, 
    name, 
    public, 
    created_at
FROM storage.buckets
WHERE id IN ('property-photos', 'property-documents');

-- 6. Test a simple property insert (this will show what columns are missing)
-- Uncomment the line below to test:
-- INSERT INTO properties (address_line_1, city, postcode, property_type, tenure, claimed_by) VALUES ('Test', 'Test', 'TE1 1ST', 'terraced', 'freehold', '00000000-0000-0000-0000-000000000000');
