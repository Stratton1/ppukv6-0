-- Create media table for photos and other media types
-- This table will be used for photos instead of property_photos table

CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'audio', 'document')),
  url TEXT NOT NULL,
  caption TEXT,
  room_type TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_property_id ON media(property_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at);

-- Enable RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media table
-- Anyone can view media for public properties
CREATE POLICY "Anyone can view media for public properties"
  ON media FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE is_public = true
    )
  );

-- Property owners can view their media
CREATE POLICY "Property owners can view their media"
  ON media FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE claimed_by = auth.uid()
    )
  );

-- Property owners can insert media
CREATE POLICY "Property owners can insert media"
  ON media FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE claimed_by = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Property owners can update their media
CREATE POLICY "Property owners can update their media"
  ON media FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE claimed_by = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE claimed_by = auth.uid()
    )
  );

-- Property owners can delete their media
CREATE POLICY "Property owners can delete their media"
  ON media FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE claimed_by = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();
