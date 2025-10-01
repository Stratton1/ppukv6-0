-- Create storage buckets for documents and photos
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('property-documents', 'property-documents', false),
  ('property-photos', 'property-photos', true);

-- RLS policies for property-documents bucket
CREATE POLICY "Property owners can view their documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-documents' 
    AND auth.uid() IN (
      SELECT claimed_by FROM properties 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Property owners can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-documents'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Property owners can delete their documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-documents'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

-- RLS policies for property-photos bucket (public)
CREATE POLICY "Anyone can view property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

CREATE POLICY "Property owners can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Property owners can delete their photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND auth.uid() IN (
      SELECT claimed_by FROM properties 
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

-- Create property_photos table for metadata
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  caption TEXT,
  room_type TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on property_photos
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

-- Property photos policies
CREATE POLICY "Anyone can view photos of public properties"
  ON property_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.is_public = TRUE
    )
  );

CREATE POLICY "Property owners can insert photos"
  ON property_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.claimed_by = auth.uid()
    )
  );

CREATE POLICY "Property owners can delete photos"
  ON property_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
      AND properties.claimed_by = auth.uid()
    )
  );