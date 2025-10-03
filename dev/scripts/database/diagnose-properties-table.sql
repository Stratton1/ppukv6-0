-- Comprehensive Properties Table Diagnosis
-- Run this in Supabase SQL Editor to understand the exact schema requirements

-- 1. Check all columns and their constraints
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'properties'
ORDER BY ordinal_position;

-- 2. Check for NOT NULL constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'properties'
    AND tc.constraint_type = 'NOT NULL'
ORDER BY kcu.ordinal_position;

-- 3. Check for CHECK constraints
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'properties'
    AND tc.constraint_type = 'CHECK';

-- 4. Check enum values for property_type
SELECT 
    enumlabel as valid_property_types
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'property_type'
ORDER BY e.enumsortorder;

-- 5. Test a minimal insert to see what fails
-- Uncomment the next line to test:
-- INSERT INTO properties (owner_id, title, address_line_1, city, postcode, country, property_type) VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'Test St', 'Test City', 'TE1 1ST', 'UK', 'detached_house');
