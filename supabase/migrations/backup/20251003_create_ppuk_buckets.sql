-- Create PPUK Storage Buckets
-- This migration ensures the required storage buckets exist for the Property Passport UK platform

-- Create property-photos bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create property-documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies for storage buckets are typically managed through the Supabase dashboard
-- or through separate migrations. This migration only ensures the buckets exist.

-- Verify buckets were created
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id IN ('property-photos', 'property-documents')
ORDER BY created_at;
