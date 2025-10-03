-- Check the actual schema of the properties table
-- Run this in Supabase SQL Editor to see what columns exist

SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'properties'
ORDER BY ordinal_position;
