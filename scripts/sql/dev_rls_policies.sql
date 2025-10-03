-- PPUK Development RLS Policies
-- Purpose: Permissive policies for authenticated users during development
-- Run this in Supabase SQL Editor after creating the RPC function

-- Enable RLS on all user-data tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view public properties" ON properties;
DROP POLICY IF EXISTS "Owners can view their claimed properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON properties;
DROP POLICY IF EXISTS "Owners can update their claimed properties" ON properties;
DROP POLICY IF EXISTS "Property owners can view their documents" ON documents;
DROP POLICY IF EXISTS "Property owners can insert documents" ON documents;
DROP POLICY IF EXISTS "Property owners can update their documents" ON documents;
DROP POLICY IF EXISTS "Anyone can view media of public properties" ON media;
DROP POLICY IF EXISTS "Property owners can view their media" ON media;
DROP POLICY IF EXISTS "Property owners can insert media" ON media;
DROP POLICY IF EXISTS "Property owners can update their media" ON media;
DROP POLICY IF EXISTS "Property owners can delete their media" ON media;

-- Profiles policies - allow users to manage their own profile
CREATE POLICY "dev_profiles_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.uid()::text = user_id);

CREATE POLICY "dev_profiles_insert" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR auth.uid()::text = user_id);

CREATE POLICY "dev_profiles_update" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR auth.uid()::text = user_id);

CREATE POLICY "dev_profiles_delete" ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id OR auth.uid()::text = user_id);

-- Properties policies - allow users to manage properties they own
CREATE POLICY "dev_properties_select" ON properties
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = claimed_by);

CREATE POLICY "dev_properties_insert" ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dev_properties_update" ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = claimed_by);

CREATE POLICY "dev_properties_delete" ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = claimed_by);

-- Documents policies - allow property owners to manage documents
CREATE POLICY "dev_documents_select" ON documents
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    )
  );

CREATE POLICY "dev_documents_insert" ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    ) AND uploaded_by = auth.uid()
  );

CREATE POLICY "dev_documents_update" ON documents
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    )
  );

CREATE POLICY "dev_documents_delete" ON documents
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    )
  );

-- Media policies - allow property owners to manage media
CREATE POLICY "dev_media_select" ON media
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    )
  );

CREATE POLICY "dev_media_insert" ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    ) AND uploaded_by = auth.uid()
  );

CREATE POLICY "dev_media_update" ON media
  FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    )
  );

CREATE POLICY "dev_media_delete" ON media
  FOR DELETE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid() OR claimed_by = auth.uid()
    )
  );

-- Storage bucket policies for development
-- Allow authenticated users to upload to their own property folders
CREATE POLICY "dev_storage_photos_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'property-photos');

CREATE POLICY "dev_storage_photos_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "dev_storage_photos_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-photos');

CREATE POLICY "dev_storage_documents_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'property-documents');

CREATE POLICY "dev_storage_documents_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-documents');

CREATE POLICY "dev_storage_documents_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-documents');
