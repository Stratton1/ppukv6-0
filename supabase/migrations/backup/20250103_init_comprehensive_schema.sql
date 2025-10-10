-- PPUK v6 Comprehensive Schema Migration
-- Extends existing schema with additional tables for property parties, notes, tasks, caching, and audit
-- Created: 2025-01-03
-- Purpose: Core data layer for PPUK v6 backend

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Property party roles (extends existing user_role)
CREATE TYPE property_party_role AS ENUM (
  'owner', 
  'purchaser', 
  'tenant', 
  'agent', 
  'surveyor', 
  'conveyancer',
  'solicitor',
  'mortgage_broker',
  'insurance_advisor'
);

-- Task status enum
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress', 
  'completed',
  'cancelled',
  'on_hold'
);

-- Task priority enum
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Note visibility enum
CREATE TYPE note_visibility AS ENUM (
  'private',
  'shared',
  'public'
);

-- Document status enum
CREATE TYPE document_status AS ENUM (
  'uploading',
  'processing',
  'ready',
  'error',
  'archived'
);

-- API cache provider enum
CREATE TYPE api_provider AS ENUM (
  'epc',
  'flood',
  'planning',
  'postcodes',
  'osplaces',
  'inspire',
  'companies',
  'hmlr',
  'crime',
  'education'
);

-- Audit action enum
CREATE TYPE audit_action AS ENUM (
  'create',
  'read',
  'update',
  'delete',
  'upload',
  'download',
  'share',
  'claim',
  'unclaim'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends auth.users with additional profile fields)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  avatar_url TEXT,
  company_name TEXT,
  job_title TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'UK',
  preferences JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Property parties (many-to-many relationship between users and properties)
CREATE TABLE property_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role property_party_role NOT NULL,
  permissions JSONB DEFAULT '{}', -- Custom permissions per role
  is_primary BOOLEAN DEFAULT FALSE, -- Primary contact for this role
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ, -- For temporary access
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, user_id, role)
);

-- Enhanced documents table (extends existing)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status document_status DEFAULT 'ready';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility note_visibility NOT NULL DEFAULT 'private',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  parent_note_id UUID REFERENCES notes(id) ON DELETE CASCADE, -- For threaded discussions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API cache table for external integrations
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider api_provider NOT NULL,
  cache_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  etag TEXT,
  request_hash TEXT, -- Hash of request parameters for deduplication
  response_size_bytes INTEGER,
  is_stale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, cache_key)
);

-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL, -- 'property', 'document', 'note', 'task', etc.
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Property parties indexes
CREATE INDEX IF NOT EXISTS idx_property_parties_property_id ON property_parties(property_id);
CREATE INDEX IF NOT EXISTS idx_property_parties_user_id ON property_parties(user_id);
CREATE INDEX IF NOT EXISTS idx_property_parties_role ON property_parties(role);
CREATE INDEX IF NOT EXISTS idx_property_parties_primary ON property_parties(property_id, is_primary) WHERE is_primary = TRUE;

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_property_id ON notes(property_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_visibility ON notes(visibility);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(property_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_note_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_property_id ON tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- API cache indexes
CREATE INDEX IF NOT EXISTS idx_api_cache_provider_key ON api_cache(provider, cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_fetched_at ON api_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_stale ON api_cache(is_stale);
CREATE INDEX IF NOT EXISTS idx_api_cache_ttl ON api_cache(fetched_at, ttl_seconds);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  action_type audit_action;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Insert audit log entry
  INSERT INTO audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    COALESCE(NEW.uploaded_by, NEW.created_by, NEW.assigned_by, auth.uid()),
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_cache 
  WHERE fetched_at + INTERVAL '1 second' * ttl_seconds < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update triggers for all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_parties_updated_at
  BEFORE UPDATE ON property_parties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers for critical tables
CREATE TRIGGER audit_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_notes_changes
  AFTER INSERT OR UPDATE OR DELETE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_tasks_changes
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_property_parties_changes
  AFTER INSERT OR UPDATE OR DELETE ON property_parties
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Property parties policies
CREATE POLICY "Users can view parties for their properties"
  ON property_parties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_parties pp
      WHERE pp.property_id = property_parties.property_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can manage parties"
  ON property_parties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_parties.property_id
      AND p.claimed_by = auth.uid()
    )
  );

-- Notes policies
CREATE POLICY "Users can view notes for their properties"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_parties pp
      WHERE pp.property_id = notes.property_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for their properties"
  ON notes FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM property_parties pp
      WHERE pp.property_id = notes.property_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Note creators can update their notes"
  ON notes FOR UPDATE
  USING (created_by = auth.uid());

-- Tasks policies
CREATE POLICY "Users can view tasks for their properties"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_parties pp
      WHERE pp.property_id = tasks.property_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for their properties"
  ON tasks FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM property_parties pp
      WHERE pp.property_id = tasks.property_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Task creators and assignees can update tasks"
  ON tasks FOR UPDATE
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- API cache policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can read cache"
  ON api_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Audit log policies (read-only for property participants)
CREATE POLICY "Users can view audit logs for their properties"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM property_parties pp
      JOIN properties p ON p.id = pp.property_id
      WHERE pp.user_id = auth.uid()
      AND (
        (audit_log.entity_type = 'property' AND audit_log.entity_id = p.id) OR
        (audit_log.entity_type = 'document' AND audit_log.entity_id IN (
          SELECT d.id FROM documents d WHERE d.property_id = p.id
        )) OR
        (audit_log.entity_type = 'note' AND audit_log.entity_id IN (
          SELECT n.id FROM notes n WHERE n.property_id = p.id
        )) OR
        (audit_log.entity_type = 'task' AND audit_log.entity_id IN (
          SELECT t.id FROM tasks t WHERE t.property_id = p.id
        ))
      )
    )
  );

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Property overview view
CREATE VIEW property_overview AS
SELECT 
  p.id,
  p.ppuk_reference,
  p.address_line_1,
  p.address_line_2,
  p.city,
  p.postcode,
  p.property_type,
  p.tenure,
  p.claimed_by,
  p.completion_percentage,
  p.is_public,
  p.created_at,
  p.updated_at,
  -- Counts
  (SELECT COUNT(*) FROM documents d WHERE d.property_id = p.id) as document_count,
  (SELECT COUNT(*) FROM notes n WHERE n.property_id = p.id) as note_count,
  (SELECT COUNT(*) FROM tasks t WHERE t.property_id = p.id) as task_count,
  (SELECT COUNT(*) FROM property_parties pp WHERE pp.property_id = p.id) as party_count,
  -- Latest activity
  (SELECT MAX(created_at) FROM documents d WHERE d.property_id = p.id) as last_document_upload,
  (SELECT MAX(created_at) FROM notes n WHERE n.property_id = p.id) as last_note_created,
  (SELECT MAX(created_at) FROM tasks t WHERE t.property_id = p.id) as last_task_created
FROM properties p;

-- User dashboard view
CREATE VIEW user_dashboard AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at,
  -- Property counts by role
  (SELECT COUNT(*) FROM property_parties pp WHERE pp.user_id = u.id AND pp.role = 'owner') as owned_properties,
  (SELECT COUNT(*) FROM property_parties pp WHERE pp.user_id = u.id AND pp.role = 'purchaser') as purchasing_properties,
  (SELECT COUNT(*) FROM property_parties pp WHERE pp.user_id = u.id AND pp.role = 'tenant') as rented_properties,
  -- Task counts
  (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'pending') as pending_tasks,
  (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'in_progress') as active_tasks,
  (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'completed') as completed_tasks
FROM users u;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Extended user profiles with additional fields beyond auth.users';
COMMENT ON TABLE property_parties IS 'Many-to-many relationship between users and properties with specific roles';
COMMENT ON TABLE notes IS 'Property-specific notes and comments with visibility controls';
COMMENT ON TABLE tasks IS 'Property-related tasks and assignments with status tracking';
COMMENT ON TABLE api_cache IS 'Cache for external API responses to reduce rate limiting and improve performance';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all data changes';

COMMENT ON COLUMN property_parties.permissions IS 'JSON object defining custom permissions for this role on this property';
COMMENT ON COLUMN property_parties.is_primary IS 'Whether this user is the primary contact for this role on this property';
COMMENT ON COLUMN property_parties.expires_at IS 'Optional expiration date for temporary access';
COMMENT ON COLUMN notes.visibility IS 'Controls who can see this note: private (creator only), shared (property participants), public (everyone)';
COMMENT ON COLUMN notes.parent_note_id IS 'For threaded discussions - references parent note';
COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated time to complete task';
COMMENT ON COLUMN tasks.actual_hours IS 'Actual time spent on task';
COMMENT ON COLUMN api_cache.request_hash IS 'Hash of request parameters for deduplication';
COMMENT ON COLUMN api_cache.is_stale IS 'Whether cached data is considered stale';
