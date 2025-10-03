-- Property Passport UK - Database Verification Queries
-- Run these queries in Supabase SQL Editor to verify system status

-- ===========================================
-- 1. CHECK TABLES AND SCHEMA
-- ===========================================

-- List all tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check table row counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===========================================
-- 2. CHECK RLS POLICIES
-- ===========================================

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===========================================
-- 3. CHECK ENUMS AND TYPES
-- ===========================================

-- List all custom types
SELECT 
  t.typname as type_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY t.typname, e.enumsortorder;

-- ===========================================
-- 4. CHECK FUNCTIONS AND TRIGGERS
-- ===========================================

-- List custom functions
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- List triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ===========================================
-- 5. CHECK STORAGE BUCKETS
-- ===========================================

-- List storage buckets
SELECT 
  id,
  name,
  public,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY name;

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- ===========================================
-- 6. CHECK SAMPLE DATA
-- ===========================================

-- Count properties by type
SELECT 
  property_type,
  COUNT(*) as count,
  COUNT(CASE WHEN claimed_by IS NOT NULL THEN 1 END) as claimed,
  COUNT(CASE WHEN claimed_by IS NULL THEN 1 END) as unclaimed
FROM properties 
GROUP BY property_type
ORDER BY count DESC;

-- Count properties by completion percentage
SELECT 
  CASE 
    WHEN completion_percentage = 0 THEN '0%'
    WHEN completion_percentage <= 25 THEN '1-25%'
    WHEN completion_percentage <= 50 THEN '26-50%'
    WHEN completion_percentage <= 75 THEN '51-75%'
    WHEN completion_percentage <= 99 THEN '76-99%'
    ELSE '100%'
  END as completion_range,
  COUNT(*) as count
FROM properties 
GROUP BY 
  CASE 
    WHEN completion_percentage = 0 THEN '0%'
    WHEN completion_percentage <= 25 THEN '1-25%'
    WHEN completion_percentage <= 50 THEN '26-50%'
    WHEN completion_percentage <= 75 THEN '51-75%'
    WHEN completion_percentage <= 99 THEN '76-99%'
    ELSE '100%'
  END
ORDER BY completion_percentage;

-- Check for test data
SELECT 
  ppuk_reference,
  address_line_1,
  city,
  property_type,
  claimed_by IS NOT NULL as is_claimed,
  completion_percentage
FROM properties 
WHERE ppuk_reference LIKE 'PPUK-DEV%'
ORDER BY ppuk_reference;

-- ===========================================
-- 7. CHECK USER PROFILES
-- ===========================================

-- Count users by role
SELECT 
  role,
  COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY count DESC;

-- Check for test users
SELECT 
  p.id,
  p.role,
  p.full_name,
  p.created_at,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email LIKE '%@ppuk.test' OR au.email LIKE '%@example.com'
ORDER BY p.created_at;

-- ===========================================
-- 8. PERFORMANCE CHECKS
-- ===========================================

-- Check for missing indexes (basic check)
SELECT 
  t.tablename,
  c.column_name,
  c.data_type
FROM pg_tables t
JOIN information_schema.columns c ON t.tablename = c.table_name
WHERE t.schemaname = 'public'
  AND c.table_schema = 'public'
  AND c.column_name IN ('property_id', 'claimed_by', 'user_id')
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes i 
    WHERE i.tablename = t.tablename 
    AND i.indexdef LIKE '%' || c.column_name || '%'
  )
ORDER BY t.tablename, c.column_name;

-- ===========================================
-- 9. SECURITY VERIFICATION
-- ===========================================

-- Verify RLS is enabled on all user tables
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('profiles', 'properties', 'documents', 'property_photos', 'saved_properties')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Check for any tables without RLS
SELECT 
  tablename,
  'RLS NOT ENABLED' as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties', 'documents', 'property_photos', 'saved_properties')
  AND NOT rowsecurity
ORDER BY tablename;
