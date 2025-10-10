# PPUK v6 Database Schema

## Overview

The PPUK v6 database schema is designed to support a comprehensive property management platform with secure access control, audit logging, and external API integration.

## Entity Relationship Diagram

```
Users (1) ←→ (N) Property_Parties (N) ←→ (1) Properties
  ↓                    ↓                    ↓
  └─── Documents ←────┴────────────────────┘
  ↓                    ↓                    ↓
  └─── Notes ←─────────┴────────────────────┘
  ↓                    ↓                    ↓
  └─── Tasks ←─────────┴────────────────────┘
  ↓
  └─── Audit_Log
  ↓
  └─── API_Cache
```

## Core Tables

### Users
Extended user profiles with additional fields beyond auth.users.

```sql
CREATE TABLE users (
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
```

### Properties
Core property information with comprehensive details.

```sql
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
  claimed_by UUID REFERENCES users(id),
  completion_percentage INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Property Parties
Many-to-many relationship between users and properties with specific roles.

```sql
CREATE TABLE property_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role property_party_role NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, user_id, role)
);
```

### Documents
Property documents with metadata and access controls.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  status document_status DEFAULT 'ready',
  storage_path TEXT,
  checksum TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  ai_summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Notes
Property-specific notes and comments with visibility controls.

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility note_visibility NOT NULL DEFAULT 'private',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  parent_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tasks
Property-related tasks and assignments with status tracking.

```sql
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
```

### API Cache
Cache for external API responses to reduce rate limiting and improve performance.

```sql
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider api_provider NOT NULL,
  cache_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  etag TEXT,
  request_hash TEXT,
  response_size_bytes INTEGER,
  is_stale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, cache_key)
);
```

### Audit Log
Comprehensive audit trail for all data changes.

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Enums

### User Roles
```sql
CREATE TYPE user_role AS ENUM ('owner', 'buyer', 'other');
```

### Property Types
```sql
CREATE TYPE property_type AS ENUM (
  'detached', 'semi_detached', 'terraced', 'flat', 
  'bungalow', 'cottage', 'other'
);
```

### Property Styles
```sql
CREATE TYPE property_style AS ENUM (
  'victorian', 'edwardian', 'georgian', 'modern', 
  'new_build', 'period', 'contemporary', 'other'
);
```

### Tenure Types
```sql
CREATE TYPE tenure_type AS ENUM (
  'freehold', 'leasehold', 'shared_ownership'
);
```

### Document Types
```sql
CREATE TYPE document_type AS ENUM (
  'epc', 'floorplan', 'title_deed', 'survey', 'planning', 
  'lease', 'guarantee', 'building_control', 'gas_safety', 
  'electrical_safety', 'other'
);
```

### Document Status
```sql
CREATE TYPE document_status AS ENUM (
  'uploading', 'processing', 'ready', 'error', 'archived'
);
```

### Property Party Roles
```sql
CREATE TYPE property_party_role AS ENUM (
  'owner', 'purchaser', 'tenant', 'agent', 'surveyor', 
  'conveyancer', 'solicitor', 'mortgage_broker', 'insurance_advisor'
);
```

### Task Status
```sql
CREATE TYPE task_status AS ENUM (
  'pending', 'in_progress', 'completed', 'cancelled', 'on_hold'
);
```

### Task Priority
```sql
CREATE TYPE task_priority AS ENUM (
  'low', 'medium', 'high', 'urgent'
);
```

### Note Visibility
```sql
CREATE TYPE note_visibility AS ENUM (
  'private', 'shared', 'public'
);
```

### API Providers
```sql
CREATE TYPE api_provider AS ENUM (
  'epc', 'flood', 'planning', 'postcodes', 'osplaces', 
  'inspire', 'companies', 'hmlr', 'crime', 'education'
);
```

### Audit Actions
```sql
CREATE TYPE audit_action AS ENUM (
  'create', 'read', 'update', 'delete', 'upload', 
  'download', 'share', 'claim', 'unclaim'
);
```

## Indexes

### Performance Indexes
```sql
-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Property parties indexes
CREATE INDEX idx_property_parties_property_id ON property_parties(property_id);
CREATE INDEX idx_property_parties_user_id ON property_parties(user_id);
CREATE INDEX idx_property_parties_role ON property_parties(role);
CREATE INDEX idx_property_parties_primary ON property_parties(property_id, is_primary) WHERE is_primary = TRUE;

-- Documents indexes
CREATE INDEX idx_documents_property_id ON documents(property_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Notes indexes
CREATE INDEX idx_notes_property_id ON notes(property_id);
CREATE INDEX idx_notes_created_by ON notes(created_by);
CREATE INDEX idx_notes_visibility ON notes(visibility);
CREATE INDEX idx_notes_pinned ON notes(property_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_notes_parent ON notes(parent_note_id);

-- Tasks indexes
CREATE INDEX idx_tasks_property_id ON tasks(property_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);

-- API cache indexes
CREATE INDEX idx_api_cache_provider_key ON api_cache(provider, cache_key);
CREATE INDEX idx_api_cache_fetched_at ON api_cache(fetched_at);
CREATE INDEX idx_api_cache_stale ON api_cache(is_stale);
CREATE INDEX idx_api_cache_ttl ON api_cache(fetched_at, ttl_seconds);

-- Audit log indexes
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

## Views

### Property Overview
```sql
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
```

### User Dashboard
```sql
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
```

## Functions

### Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Audit Log Function
```sql
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
```

### Cache Cleanup Function
```sql
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
```

## Triggers

### Update Triggers
```sql
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
```

### Audit Triggers
```sql
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
```

## Data Types

### JSONB Fields
- `permissions`: Custom permissions for property parties
- `preferences`: User preferences and settings
- `metadata`: Additional metadata for documents and tasks
- `payload`: Cached API response data
- `old_values`/`new_values`: Audit trail data

### Array Fields
- `tags`: Document and task tags
- `shared_with`: Document sharing permissions

### Timestamp Fields
- `created_at`: Record creation timestamp
- `updated_at`: Record modification timestamp
- `assigned_at`: Property party assignment timestamp
- `expires_at`: Property party expiration timestamp
- `due_date`: Task due date
- `completed_at`: Task completion timestamp
- `last_accessed_at`: Document last access timestamp
- `last_login_at`: User last login timestamp

## Constraints

### Unique Constraints
- `users.email`: Unique email addresses
- `properties.ppuk_reference`: Unique PPUK references
- `property_parties(property_id, user_id, role)`: Unique party assignments
- `api_cache(provider, cache_key)`: Unique cache entries

### Check Constraints
- `completion_percentage`: 0-100 range
- `bedrooms`, `bathrooms`: Positive integers
- `total_floor_area_sqm`: Positive decimal
- `year_built`: Reasonable year range
- `lease_years_remaining`: Positive integer
- `ground_rent_annual`, `service_charge_annual`: Positive decimal

### Foreign Key Constraints
- All foreign keys have proper CASCADE or RESTRICT rules
- Referential integrity maintained across all relationships
- Proper cleanup on record deletion

## Performance Considerations

### Query Optimization
- Proper indexing on frequently queried columns
- Composite indexes for multi-column queries
- Partial indexes for filtered queries
- Covering indexes for common SELECT patterns

### Data Partitioning
- Consider partitioning large tables by date
- Separate hot and cold data
- Archive old audit logs
- Clean up expired cache entries

### Connection Management
- Connection pooling for high concurrency
- Proper connection timeouts
- Query optimization and monitoring
- Resource usage tracking
