# Database Setup Guide

## 🚨 CRITICAL: Database Migrations Not Applied

The "All property creation attempts failed" error indicates that the database schema hasn't been set up in your Supabase instance.

## 🔧 Quick Fix Steps

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**

### Step 2: Run Core Migration

Copy and paste this SQL into the Supabase SQL Editor and run it:

```sql
-- Core database setup for PPUK
-- Run this in Supabase SQL Editor

-- 1. Create enums first
CREATE TYPE user_role AS ENUM ('owner', 'buyer', 'other');
CREATE TYPE property_type AS ENUM ('detached', 'semi_detached', 'terraced', 'flat', 'bungalow', 'cottage', 'other');
CREATE TYPE property_style AS ENUM ('victorian', 'edwardian', 'georgian', 'modern', 'new_build', 'period', 'contemporary', 'other');
CREATE TYPE tenure_type AS ENUM ('freehold', 'leasehold', 'shared_ownership');
CREATE TYPE document_type AS ENUM ('epc', 'floorplan', 'title_deed', 'survey', 'planning', 'lease', 'guarantee', 'building_control', 'gas_safety', 'electrical_safety', 'other');

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create properties table
CREATE TABLE IF NOT EXISTS properties (
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

-- 4. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  description TEXT,
  ai_summary TEXT,
  metadata JSONB,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create media table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'photo' CHECK (type IN ('photo', 'document', 'video')),
  url TEXT NOT NULL,
  caption TEXT,
  room_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  mime_type TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- 7. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view public properties" ON properties FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Owners can view their claimed properties" ON properties FOR SELECT USING (claimed_by = auth.uid());
CREATE POLICY "Authenticated users can insert properties" ON properties FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can update their claimed properties" ON properties FOR UPDATE USING (claimed_by = auth.uid());

-- Documents policies
CREATE POLICY "Property owners can view their documents" ON documents FOR SELECT USING (
  property_id IN (SELECT id FROM properties WHERE claimed_by = auth.uid())
);
CREATE POLICY "Property owners can insert documents" ON documents FOR INSERT WITH CHECK (
  property_id IN (SELECT id FROM properties WHERE claimed_by = auth.uid()) AND uploaded_by = auth.uid()
);
CREATE POLICY "Property owners can update their documents" ON documents FOR UPDATE USING (
  property_id IN (SELECT id FROM properties WHERE claimed_by = auth.uid())
);

-- Media policies
CREATE POLICY "Anyone can view media of public properties" ON media FOR SELECT USING (
  property_id IN (SELECT id FROM properties WHERE is_public = TRUE)
);
CREATE POLICY "Property owners can view their media" ON media FOR SELECT USING (
  property_id IN (SELECT id FROM properties WHERE claimed_by = auth.uid())
);
CREATE POLICY "Property owners can insert media" ON media FOR INSERT WITH CHECK (
  property_id IN (SELECT id FROM properties WHERE claimed_by = auth.uid()) AND uploaded_by = auth.uid()
);
CREATE POLICY "Property owners can update their media" ON media FOR UPDATE USING (
  property_id IN (SELECT id FROM properties WHERE claimed_by = auth.uid())
);
CREATE POLICY "Property owners can delete their media" ON media FOR DELETE USING (
  property_id IN (SELECT id FROM properties WHERE claimed_by = auth.uid())
);

-- Saved properties policies
CREATE POLICY "Users can view their saved properties" ON saved_properties FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their saved properties" ON saved_properties FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their saved properties" ON saved_properties FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their saved properties" ON saved_properties FOR DELETE USING (user_id = auth.uid());

-- 9. Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'other'));
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_ppuk_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PPUK-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_ppuk_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ppuk_reference IS NULL THEN
    NEW.ppuk_reference := generate_ppuk_reference();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER generate_ppuk_ref_trigger BEFORE INSERT ON properties FOR EACH ROW EXECUTE FUNCTION set_ppuk_reference();

-- 11. Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('property-photos', 'property-photos', true),
  ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 12. Create storage policies
CREATE POLICY "Anyone can view property photos" ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');
CREATE POLICY "Property owners can upload photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'property-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Property owners can delete their photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'property-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Property owners can view their documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'property-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Property owners can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'property-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Property owners can delete their documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'property-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Verify Setup

After running the SQL, go back to your app and:

1. Visit `http://localhost:8080/test-login`
2. Click **"🗄️ Check Migrations"** - should show all tables exist
3. Click **"🔍 Debug Schema"** - should show all columns work
4. Click **"🚀 One-Click Dev Setup"** - should now work!

## 🚨 If Still Failing

If you're still getting errors, check:

1. **Environment Variables**: Make sure your `.env` file has correct Supabase URL and keys
2. **Supabase Project**: Ensure you're connected to the right project
3. **RLS Policies**: The policies above should allow authenticated users to create properties

## 📋 What This Creates

- ✅ All required tables (profiles, properties, documents, media, saved_properties)
- ✅ All required enums (user_role, property_type, tenure_type, document_type)
- ✅ Row Level Security policies for data protection
- ✅ Storage buckets for photos and documents
- ✅ Auto-generated PPUK references
- ✅ User profile creation on signup

## 🎯 Expected Result

After running this SQL, the test-login should work perfectly and create:

- Test users (owner@ppuk.test, buyer@ppuk.test)
- Sample property with PPUK reference
- Sample photo in media table
- Sample document in documents table
