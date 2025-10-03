-- Migration: Add Storage Buckets with Proper Configuration
-- Date: 2025-01-02
-- Purpose: Create storage buckets for property photos and documents with proper RLS policies

-- Create property-photos bucket (public for gallery display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos',
  'property-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create property-documents bucket (private for secure documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-documents',
  'property-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for property-photos bucket
-- Allow anyone to view photos of public properties
CREATE POLICY "Anyone can view photos of public properties"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-photos'
    AND EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
      AND properties.is_public = true
    )
  );

-- Allow property owners to view their own photos
CREATE POLICY "Property owners can view their photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-photos'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow property owners to upload photos
CREATE POLICY "Property owners can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow property owners to update their photos
CREATE POLICY "Property owners can update their photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-photos'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow property owners to delete their photos
CREATE POLICY "Property owners can delete their photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- RLS Policies for property-documents bucket
-- Allow property owners to view their documents
CREATE POLICY "Property owners can view their documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-documents'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow property owners to upload documents
CREATE POLICY "Property owners can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-documents'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow property owners to update their documents
CREATE POLICY "Property owners can update their documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-documents'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow property owners to delete their documents (for audit trail, we might want to restrict this)
CREATE POLICY "Property owners can delete their documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-documents'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties
      WHERE properties.id::text = (storage.foldername(name))[1]
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_uploaded_by ON property_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Add comments for documentation
COMMENT ON TABLE property_photos IS 'Stores metadata for property photos uploaded to storage';
COMMENT ON TABLE documents IS 'Stores metadata for property documents uploaded to storage';
COMMENT ON COLUMN property_photos.file_url IS 'Public URL for photo in property-photos bucket';
COMMENT ON COLUMN documents.file_url IS 'Storage path for document in property-documents bucket (requires signed URL)';
