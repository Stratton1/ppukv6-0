-- PPUK v6 Development Seed Data
-- Sample data for development and testing
-- Created: 2025-01-03
-- Purpose: Development seed data with sample properties, parties, documents, and tasks

-- ============================================================================
-- CLEANUP EXISTING DATA (if any)
-- ============================================================================

-- Clean up existing test data (in reverse dependency order)
DELETE FROM audit_log WHERE entity_type IN ('task', 'note', 'document', 'property_party', 'property');
DELETE FROM tasks WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
DELETE FROM notes WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
DELETE FROM documents WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
DELETE FROM property_parties WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
DELETE FROM saved_properties WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
DELETE FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%';
DELETE FROM users WHERE email LIKE '%@test.ppuk.dev';

-- ============================================================================
-- SAMPLE USERS
-- ============================================================================

-- Insert sample users (these would normally be created via auth signup)
INSERT INTO users (id, email, full_name, phone, role, company_name, job_title, address_line_1, city, postcode, is_verified) VALUES
-- Property Owner
('11111111-1111-1111-1111-111111111111', 'john.smith@test.ppuk.dev', 'John Smith', '+44 7700 900001', 'owner', 'Smith Properties Ltd', 'Property Developer', '123 Main Street', 'London', 'SW1A 1AA', true),
-- Property Buyer
('22222222-2222-2222-2222-222222222222', 'sarah.jones@test.ppuk.dev', 'Sarah Jones', '+44 7700 900002', 'buyer', 'Jones & Associates', 'Investment Manager', '456 Oak Avenue', 'Manchester', 'M1 1AA', true),
-- Estate Agent
('33333333-3333-3333-3333-333333333333', 'mike.wilson@test.ppuk.dev', 'Mike Wilson', '+44 7700 900003', 'other', 'Wilson Estate Agents', 'Senior Agent', '789 Pine Street', 'Birmingham', 'B1 1AA', true),
-- Surveyor
('44444444-4444-4444-4444-444444444444', 'lisa.brown@test.ppuk.dev', 'Lisa Brown', '+44 7700 900004', 'other', 'Brown Surveying Ltd', 'Chartered Surveyor', '321 Elm Road', 'Leeds', 'LS1 1AA', true),
-- Conveyancer
('55555555-5555-5555-5555-555555555555', 'david.taylor@test.ppuk.dev', 'David Taylor', '+44 7700 900005', 'other', 'Taylor Legal', 'Conveyancing Solicitor', '654 Maple Lane', 'Liverpool', 'L1 1AA', true),
-- Admin User
('66666666-6666-6666-6666-666666666666', 'admin@test.ppuk.dev', 'Admin User', '+44 7700 900006', 'other', 'PPUK Admin', 'System Administrator', '987 Admin Street', 'London', 'SW1A 1BB', true);

-- Update admin user role
UPDATE users SET role = 'admin' WHERE id = '66666666-6666-6666-6666-666666666666';

-- ============================================================================
-- SAMPLE PROPERTIES
-- ============================================================================

-- Insert sample properties
INSERT INTO properties (
  id, ppuk_reference, address_line_1, address_line_2, city, postcode, 
  property_type, property_style, bedrooms, bathrooms, total_floor_area_sqm, 
  year_built, tenure, epc_rating, epc_score, epc_expiry_date, 
  flood_risk_level, council_tax_band, claimed_by, completion_percentage, is_public
) VALUES
-- Property 1: Victorian Terrace (Owned by John Smith)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PPUK-TEST-001', '15 Victoria Street', 'Ground Floor Flat', 'London', 'SW1A 1AA',
 'terraced', 'victorian', 2, 1, 65.5, 1895, 'leasehold', 'D', 65, '2025-12-31',
 'Low', 'C', '11111111-1111-1111-1111-111111111111', 85, true),

-- Property 2: Modern Apartment (Owned by John Smith)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PPUK-TEST-002', '42 Modern Towers', 'Apartment 15B', 'Manchester', 'M1 1AA',
 'flat', 'modern', 3, 2, 95.0, 2020, 'leasehold', 'B', 85, '2030-06-30',
 'Very Low', 'D', '11111111-1111-1111-1111-111111111111', 60, true),

-- Property 3: Detached House (Owned by John Smith, being purchased by Sarah Jones)
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'PPUK-TEST-003', '8 Oak Tree Lane', '', 'Birmingham', 'B1 1AA',
 'detached', 'contemporary', 4, 3, 180.0, 2015, 'freehold', 'C', 72, '2026-03-15',
 'Medium', 'F', '11111111-1111-1111-1111-111111111111', 40, true);

-- ============================================================================
-- PROPERTY PARTIES
-- ============================================================================

-- Property 1 parties
INSERT INTO property_parties (property_id, user_id, role, is_primary, assigned_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', true, '11111111-1111-1111-1111-111111111111'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'agent', true, '11111111-1111-1111-1111-111111111111'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'surveyor', false, '11111111-1111-1111-1111-111111111111');

-- Property 2 parties
INSERT INTO property_parties (property_id, user_id, role, is_primary, assigned_by) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'owner', true, '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'agent', true, '11111111-1111-1111-1111-111111111111');

-- Property 3 parties (sale in progress)
INSERT INTO property_parties (property_id, user_id, role, is_primary, assigned_by) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'owner', true, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'purchaser', true, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'agent', true, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'surveyor', false, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'conveyancer', false, '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- SAMPLE DOCUMENTS
-- ============================================================================

-- Property 1 documents
INSERT INTO documents (property_id, document_type, file_name, file_url, file_size_bytes, mime_type, description, uploaded_by, status, tags) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'epc', 'epc-certificate-15-victoria-street.pdf', 'https://storage.example.com/documents/epc-certificate-15-victoria-street.pdf', 245760, 'application/pdf', 'Energy Performance Certificate', '11111111-1111-1111-1111-111111111111', 'ready', ARRAY['epc', 'energy', 'certificate']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'title_deed', 'title-deed-15-victoria-street.pdf', 'https://storage.example.com/documents/title-deed-15-victoria-street.pdf', 1024000, 'application/pdf', 'Title Deed and Lease Information', '11111111-1111-1111-1111-111111111111', 'ready', ARRAY['legal', 'title', 'deed']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'floorplan', 'floorplan-15-victoria-street.pdf', 'https://storage.example.com/documents/floorplan-15-victoria-street.pdf', 512000, 'application/pdf', 'Property Floor Plan', '11111111-1111-1111-1111-111111111111', 'ready', ARRAY['floorplan', 'layout', 'property']);

-- Property 2 documents
INSERT INTO documents (property_id, document_type, file_name, file_url, file_size_bytes, mime_type, description, uploaded_by, status, tags) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'epc', 'epc-certificate-42-modern-towers.pdf', 'https://storage.example.com/documents/epc-certificate-42-modern-towers.pdf', 198000, 'application/pdf', 'Energy Performance Certificate', '11111111-1111-1111-1111-111111111111', 'ready', ARRAY['epc', 'energy', 'certificate']),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'lease', 'lease-agreement-42-modern-towers.pdf', 'https://storage.example.com/documents/lease-agreement-42-modern-towers.pdf', 2048000, 'application/pdf', 'Lease Agreement and Terms', '11111111-1111-1111-1111-111111111111', 'ready', ARRAY['lease', 'legal', 'agreement']);

-- Property 3 documents
INSERT INTO documents (property_id, document_type, file_name, file_url, file_size_bytes, mime_type, description, uploaded_by, status, tags) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'epc', 'epc-certificate-8-oak-tree-lane.pdf', 'https://storage.example.com/documents/epc-certificate-8-oak-tree-lane.pdf', 312000, 'application/pdf', 'Energy Performance Certificate', '11111111-1111-1111-1111-111111111111', 'ready', ARRAY['epc', 'energy', 'certificate']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'survey', 'structural-survey-8-oak-tree-lane.pdf', 'https://storage.example.com/documents/structural-survey-8-oak-tree-lane.pdf', 5120000, 'application/pdf', 'Structural Survey Report', '44444444-4444-4444-4444-444444444444', 'ready', ARRAY['survey', 'structural', 'report']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'title_deed', 'title-deed-8-oak-tree-lane.pdf', 'https://storage.example.com/documents/title-deed-8-oak-tree-lane.pdf', 1536000, 'application/pdf', 'Title Deed and Property Information', '11111111-1111-1111-1111-111111111111', 'ready', ARRAY['legal', 'title', 'deed']);

-- ============================================================================
-- SAMPLE NOTES
-- ============================================================================

-- Property 1 notes
INSERT INTO notes (property_id, created_by, title, body, visibility, tags, is_pinned) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Property Maintenance Notes', 'Regular maintenance schedule for Victorian property. Boiler service due in March. Window repairs needed on ground floor.', 'private', ARRAY['maintenance', 'boiler', 'windows'], false),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Marketing Notes', 'Property shows well. Victorian features are a selling point. Consider staging with period furniture.', 'shared', ARRAY['marketing', 'staging', 'victorian'], true);

-- Property 2 notes
INSERT INTO notes (property_id, created_by, title, body, visibility, tags, is_pinned) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Lease Information', 'Lease expires in 95 years. Ground rent £250 per year. Service charge £1200 per year.', 'private', ARRAY['lease', 'ground-rent', 'service-charge'], true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Viewing Feedback', 'Modern apartment with excellent transport links. Balcony is a key feature. Parking space included.', 'shared', ARRAY['viewing', 'transport', 'parking'], false);

-- Property 3 notes (sale in progress)
INSERT INTO notes (property_id, created_by, title, body, visibility, tags, is_pinned) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Sale Progress', 'Offer accepted at £450,000. Survey completed with minor issues noted. Conveyancing in progress.', 'private', ARRAY['sale', 'offer', 'survey'], true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Purchase Notes', 'Property meets investment criteria. Good rental yield potential. Location is excellent for commuters.', 'private', ARRAY['investment', 'rental', 'location'], false),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'Survey Findings', 'Minor damp issues in basement. Roof in good condition. Electrical system needs updating. Overall condition good.', 'shared', ARRAY['survey', 'damp', 'electrical'], true);

-- ============================================================================
-- SAMPLE TASKS
-- ============================================================================

-- Property 1 tasks
INSERT INTO tasks (property_id, created_by, assigned_to, title, description, status, priority, due_date, tags) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Boiler Service', 'Annual boiler service and safety check', 'pending', 'medium', '2025-03-15 10:00:00+00', ARRAY['maintenance', 'boiler', 'safety']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Marketing Photos', 'Professional photography for property listing', 'completed', 'high', '2025-01-01 14:00:00+00', ARRAY['marketing', 'photography', 'listing']);

-- Property 2 tasks
INSERT INTO tasks (property_id, created_by, assigned_to, title, description, status, priority, due_date, tags) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Lease Renewal', 'Review lease terms and negotiate renewal', 'in_progress', 'high', '2025-06-30 17:00:00+00', ARRAY['lease', 'renewal', 'legal']),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Property Valuation', 'Get updated valuation for insurance purposes', 'pending', 'medium', '2025-02-28 12:00:00+00', ARRAY['valuation', 'insurance', 'property']);

-- Property 3 tasks (sale in progress)
INSERT INTO tasks (property_id, created_by, assigned_to, title, description, status, priority, due_date, tags) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Conveyancing', 'Complete property sale conveyancing', 'in_progress', 'urgent', '2025-02-15 16:00:00+00', ARRAY['conveyancing', 'sale', 'legal']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Final Survey', 'Final survey before completion', 'pending', 'high', '2025-02-10 09:00:00+00', ARRAY['survey', 'final', 'completion']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Property Preparation', 'Prepare property for handover', 'pending', 'medium', '2025-02-20 10:00:00+00', ARRAY['preparation', 'handover', 'sale']);

-- ============================================================================
-- SAMPLE SAVED PROPERTIES
-- ============================================================================

-- Sarah Jones has saved properties 1 and 3
INSERT INTO saved_properties (user_id, property_id, notes) VALUES
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Victorian property with character. Good location for rental investment.'),
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Currently purchasing this property. Excellent investment potential.');

-- ============================================================================
-- SAMPLE API CACHE ENTRIES
-- ============================================================================

-- EPC data cache
INSERT INTO api_cache (provider, cache_key, payload, fetched_at, ttl_seconds, request_hash) VALUES
('epc', 'epc:SW1A1AA:15VictoriaStreet', '{"certificateNumber":"123456789","address":"15 Victoria Street","postcode":"SW1A 1AA","currentRating":"D","currentEfficiency":65}', NOW() - INTERVAL '1 hour', 86400, 'hash123'),
('epc', 'epc:M11AA:42ModernTowers', '{"certificateNumber":"987654321","address":"42 Modern Towers","postcode":"M1 1AA","currentRating":"B","currentEfficiency":85}', NOW() - INTERVAL '2 hours', 86400, 'hash456');

-- Flood risk data cache
INSERT INTO api_cache (provider, cache_key, payload, fetched_at, ttl_seconds, request_hash) VALUES
('flood', 'flood:SW1A1AA', '{"address":"15 Victoria Street","postcode":"SW1A 1AA","floodRisk":{"surfaceWater":"Low","riversAndSea":"Very Low","groundwater":"Low","reservoirs":"Very Low"},"riskLevel":"Low","riskScore":2}', NOW() - INTERVAL '3 hours', 604800, 'hash789'),
('flood', 'flood:B11AA', '{"address":"8 Oak Tree Lane","postcode":"B1 1AA","floodRisk":{"surfaceWater":"Medium","riversAndSea":"Low","groundwater":"Medium","reservoirs":"Very Low"},"riskLevel":"Medium","riskScore":5}', NOW() - INTERVAL '4 hours', 604800, 'hash012');

-- ============================================================================
-- SAMPLE AUDIT LOG ENTRIES
-- ============================================================================

-- Property creation audit
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_values, metadata) VALUES
('11111111-1111-1111-1111-111111111111', 'create', 'property', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
 '{"ppuk_reference":"PPUK-TEST-001","address_line_1":"15 Victoria Street","city":"London","postcode":"SW1A 1AA"}',
 '{"source":"manual","ip_address":"192.168.1.100"}'),
('11111111-1111-1111-1111-111111111111', 'create', 'property', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '{"ppuk_reference":"PPUK-TEST-002","address_line_1":"42 Modern Towers","city":"Manchester","postcode":"M1 1AA"}',
 '{"source":"manual","ip_address":"192.168.1.100"}');

-- Document upload audit
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_values, metadata) VALUES
('11111111-1111-1111-1111-111111111111', 'upload', 'document', (SELECT id FROM documents WHERE file_name = 'epc-certificate-15-victoria-street.pdf'),
 '{"file_name":"epc-certificate-15-victoria-street.pdf","document_type":"epc","file_size_bytes":245760}',
 '{"upload_method":"web","file_type":"pdf"}');

-- Task creation audit
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_values, metadata) VALUES
('11111111-1111-1111-1111-111111111111', 'create', 'task', (SELECT id FROM tasks WHERE title = 'Boiler Service'),
 '{"title":"Boiler Service","status":"pending","priority":"medium","due_date":"2025-03-15 10:00:00+00"}',
 '{"created_via":"dashboard","reminder_set":true}');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify data was inserted correctly
DO $$
DECLARE
  user_count INTEGER;
  property_count INTEGER;
  party_count INTEGER;
  document_count INTEGER;
  note_count INTEGER;
  task_count INTEGER;
  cache_count INTEGER;
  audit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users WHERE email LIKE '%@test.ppuk.dev';
  SELECT COUNT(*) INTO property_count FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%';
  SELECT COUNT(*) INTO party_count FROM property_parties WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
  SELECT COUNT(*) INTO document_count FROM documents WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
  SELECT COUNT(*) INTO note_count FROM notes WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
  SELECT COUNT(*) INTO task_count FROM tasks WHERE property_id IN (SELECT id FROM properties WHERE ppuk_reference LIKE 'PPUK-TEST-%');
  SELECT COUNT(*) INTO cache_count FROM api_cache WHERE provider IN ('epc', 'flood');
  SELECT COUNT(*) INTO audit_count FROM audit_log WHERE entity_type IN ('property', 'document', 'task');
  
  RAISE NOTICE 'Seed data verification:';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Properties: %', property_count;
  RAISE NOTICE 'Property Parties: %', party_count;
  RAISE NOTICE 'Documents: %', document_count;
  RAISE NOTICE 'Notes: %', note_count;
  RAISE NOTICE 'Tasks: %', task_count;
  RAISE NOTICE 'API Cache Entries: %', cache_count;
  RAISE NOTICE 'Audit Log Entries: %', audit_count;
  
  IF user_count >= 6 AND property_count >= 3 AND party_count >= 8 AND document_count >= 7 AND note_count >= 6 AND task_count >= 5 THEN
    RAISE NOTICE '✅ All seed data inserted successfully!';
  ELSE
    RAISE NOTICE '❌ Some seed data may be missing. Please check the insertions.';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Sample users for development: owner, buyer, agent, surveyor, conveyancer, admin';
COMMENT ON TABLE properties IS 'Sample properties: Victorian terrace, modern apartment, detached house';
COMMENT ON TABLE property_parties IS 'Property relationships: owners, buyers, agents, surveyors, conveyancers';
COMMENT ON TABLE documents IS 'Sample documents: EPCs, title deeds, surveys, floor plans, leases';
COMMENT ON TABLE notes IS 'Property notes: maintenance, marketing, sale progress, survey findings';
COMMENT ON TABLE tasks IS 'Property tasks: maintenance, marketing, conveyancing, surveys';
COMMENT ON TABLE api_cache IS 'Cached API responses: EPC data, flood risk data';
COMMENT ON TABLE audit_log IS 'Audit trail: property creation, document uploads, task creation';
