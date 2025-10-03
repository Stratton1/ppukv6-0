-- RLS Policy Setup for Properties Table
-- Run this in Supabase SQL Editor to enable property creation

-- 1. Check current schema (run this first to see what columns exist)
SELECT 
    column_name, 
    is_nullable, 
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'properties'
ORDER BY ordinal_position;

-- 2. Check existing RLS policies
SELECT 
    polname, 
    cmd, 
    roles, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'properties';

-- 3. Enable RLS on properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 4. Create INSERT policy (allows authenticated users to insert their own properties)
DROP POLICY IF EXISTS "ppuk_insert_own_property" ON public.properties;
CREATE POLICY "ppuk_insert_own_property"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- 5. Create SELECT policy (allows users to see their own properties)
DROP POLICY IF EXISTS "ppuk_select_own_property" ON public.properties;
CREATE POLICY "ppuk_select_own_property"
ON public.properties
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- 6. Optional: Allow public read access to properties (for property listings)
-- Uncomment the next 3 lines if you want public properties to be visible to everyone
-- DROP POLICY IF EXISTS "ppuk_select_public_property" ON public.properties;
-- CREATE POLICY "ppuk_select_public_property"
-- ON public.properties FOR SELECT TO anon USING (is_public = true);

-- 7. Verify policies were created
SELECT 
    polname, 
    cmd, 
    roles, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'properties';
