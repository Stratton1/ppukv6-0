-- Quick Database Verification Script
-- Run this AFTER running the main database setup to verify everything is working

-- 1. Check if all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('profiles', 'properties', 'documents', 'media', 'saved_properties') 
        THEN '✅ Required table exists'
        ELSE '⚠️ Optional table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'properties', 'documents', 'media', 'saved_properties')
ORDER BY table_name;

-- 2. Check if enums exist
SELECT 
    typname as enum_name,
    CASE 
        WHEN typname IN ('user_role', 'property_type', 'tenure_type', 'document_type') 
        THEN '✅ Required enum exists'
        ELSE '⚠️ Optional enum'
    END as status
FROM pg_type 
WHERE typtype = 'e' 
    AND typname IN ('user_role', 'property_type', 'tenure_type', 'document_type', 'property_style')
ORDER BY typname;

-- 3. Check storage buckets
SELECT 
    id as bucket_name,
    CASE 
        WHEN public THEN '✅ Public bucket'
        ELSE '✅ Private bucket'
    END as status
FROM storage.buckets 
WHERE id IN ('property-photos', 'property-documents')
ORDER BY id;

-- 4. Test a simple property insert (this will show if everything works)
-- Uncomment the next line to test:
-- INSERT INTO properties (address_line_1, city, postcode, property_type, tenure, claimed_by) VALUES ('Test Property', 'Test City', 'TE1 1ST', 'terraced', 'freehold', '00000000-0000-0000-0000-000000000000');

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'properties', 'documents', 'media', 'saved_properties')
ORDER BY tablename, policyname;
