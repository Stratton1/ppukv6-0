-- Fix function search paths with CASCADE
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_ppuk_reference() CASCADE;
DROP FUNCTION IF EXISTS set_ppuk_reference() CASCADE;

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION set_ppuk_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ppuk_reference IS NULL THEN
    NEW.ppuk_reference := generate_ppuk_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate triggers
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER generate_ppuk_ref_trigger
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_ppuk_reference();