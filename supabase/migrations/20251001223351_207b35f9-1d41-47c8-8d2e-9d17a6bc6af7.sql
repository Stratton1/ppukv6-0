-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('owner', 'buyer', 'other');

-- Create enum for property types
CREATE TYPE property_type AS ENUM ('detached', 'semi_detached', 'terraced', 'flat', 'bungalow', 'cottage', 'other');

-- Create enum for property styles
CREATE TYPE property_style AS ENUM ('victorian', 'edwardian', 'georgian', 'modern', 'new_build', 'period', 'contemporary', 'other');

-- Create enum for tenure types
CREATE TYPE tenure_type AS ENUM ('freehold', 'leasehold', 'shared_ownership');

-- Create enum for document types
CREATE TYPE document_type AS ENUM ('epc', 'floorplan', 'title_deed', 'survey', 'planning', 'lease', 'guarantee', 'building_control', 'gas_safety', 'electrical_safety', 'other');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'buyer',
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppuk_reference TEXT UNIQUE NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  title_number TEXT,
  property_type property_type NOT NULL,
  property_style property_style,
  bedrooms INTEGER,
  bathrooms INTEGER,
  total_floor_area_sqm DECIMAL,
  year_built INTEGER,
  tenure tenure_type NOT NULL DEFAULT 'freehold',
  lease_years_remaining INTEGER,
  ground_rent_annual DECIMAL,
  service_charge_annual DECIMAL,
  epc_rating TEXT,
  epc_score INTEGER,
  epc_expiry_date DATE,
  flood_risk_level TEXT,
  council_tax_band TEXT,
  front_photo_url TEXT,
  claimed_by UUID REFERENCES profiles(id),
  completion_percentage INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Properties policies
CREATE POLICY "Anyone can view public properties"
  ON properties FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Owners can view their claimed properties"
  ON properties FOR SELECT
  USING (claimed_by = auth.uid());

CREATE POLICY "Authenticated users can insert properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their claimed properties"
  ON properties FOR UPDATE
  USING (claimed_by = auth.uid());

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  ai_summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Property owners can view documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = documents.property_id
      AND properties.claimed_by = auth.uid()
    )
  );

CREATE POLICY "Property owners can insert documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = documents.property_id
      AND properties.claimed_by = auth.uid()
    )
  );

CREATE POLICY "Property owners can update documents"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = documents.property_id
      AND properties.claimed_by = auth.uid()
    )
  );

-- Create saved properties table (for buyers)
CREATE TABLE saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Enable RLS on saved_properties
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Saved properties policies
CREATE POLICY "Users can view their saved properties"
  ON saved_properties FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their saved properties"
  ON saved_properties FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their saved properties"
  ON saved_properties FOR DELETE
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Generate PPUK reference function
CREATE OR REPLACE FUNCTION generate_ppuk_reference()
RETURNS TEXT AS $$
DECLARE
  new_ref TEXT;
BEGIN
  new_ref := 'PPUK-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  WHILE EXISTS (SELECT 1 FROM properties WHERE ppuk_reference = new_ref) LOOP
    new_ref := 'PPUK-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END LOOP;
  RETURN new_ref;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-generate PPUK reference
CREATE OR REPLACE FUNCTION set_ppuk_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ppuk_reference IS NULL THEN
    NEW.ppuk_reference := generate_ppuk_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ppuk_ref_trigger
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_ppuk_reference();