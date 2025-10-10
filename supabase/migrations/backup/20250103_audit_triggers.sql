-- Audit triggers for comprehensive logging
-- Phase 2.2: Automatic audit logging for all key table changes

-- Function to sanitize PII fields for audit logging
CREATE OR REPLACE FUNCTION sanitize_pii_for_audit(data JSONB)
RETURNS JSONB AS $$
DECLARE
    sanitized JSONB;
    key TEXT;
    value TEXT;
BEGIN
    sanitized := data;
    
    -- List of PII fields to sanitize
    FOR key IN SELECT unnest(ARRAY[
        'email', 'phone', 'full_name', 'address_line_1', 'address_line_2',
        'postcode', 'city', 'title_number', 'uprn', 'ppuk_reference'
    ])
    LOOP
        IF sanitized ? key THEN
            value := sanitized ->> key;
            IF value IS NOT NULL AND length(value) > 0 THEN
                -- Replace with masked version (first 2 chars + ***)
                sanitized := jsonb_set(sanitized, ARRAY[key], 
                    to_jsonb(substring(value, 1, 2) || '***'));
            END IF;
        END IF;
    END LOOP;
    
    RETURN sanitized;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log_entry()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB;
    new_values JSONB;
    actor_id UUID;
    entity_type TEXT;
    entity_id TEXT;
    action_type TEXT;
BEGIN
    -- Determine the action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        old_values := NULL;
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        old_values := to_jsonb(OLD);
        new_values := NULL;
    END IF;
    
    -- Get the current user ID
    actor_id := auth.uid();
    
    -- Determine entity type and ID
    entity_type := TG_TABLE_NAME;
    
    -- Get entity ID based on table
    IF TG_TABLE_NAME = 'properties' THEN
        entity_id := NEW.id::TEXT;
    ELSIF TG_TABLE_NAME = 'documents' THEN
        entity_id := NEW.id::TEXT;
    ELSIF TG_TABLE_NAME = 'notes' THEN
        entity_id := NEW.id::TEXT;
    ELSIF TG_TABLE_NAME = 'tasks' THEN
        entity_id := NEW.id::TEXT;
    ELSIF TG_TABLE_NAME = 'property_parties' THEN
        entity_id := NEW.id::TEXT;
    ELSIF TG_TABLE_NAME = 'users' THEN
        entity_id := NEW.id::TEXT;
    ELSE
        entity_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
    END IF;
    
    -- Sanitize PII from old and new values
    IF old_values IS NOT NULL THEN
        old_values := sanitize_pii_for_audit(old_values);
    END IF;
    
    IF new_values IS NOT NULL THEN
        new_values := sanitize_pii_for_audit(new_values);
    END IF;
    
    -- Insert audit log entry
    INSERT INTO audit_log (
        actor_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        metadata,
        created_at
    ) VALUES (
        actor_id,
        action_type,
        entity_type,
        entity_id,
        old_values,
        new_values,
        jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        ),
        NOW()
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all key tables

-- Properties table audit trigger
DROP TRIGGER IF EXISTS audit_properties_trigger ON properties;
CREATE TRIGGER audit_properties_trigger
    AFTER INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Documents table audit trigger
DROP TRIGGER IF EXISTS audit_documents_trigger ON documents;
CREATE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Notes table audit trigger
DROP TRIGGER IF EXISTS audit_notes_trigger ON notes;
CREATE TRIGGER audit_notes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Tasks table audit trigger
DROP TRIGGER IF EXISTS audit_tasks_trigger ON tasks;
CREATE TRIGGER audit_tasks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Property parties table audit trigger
DROP TRIGGER IF EXISTS audit_property_parties_trigger ON property_parties;
CREATE TRIGGER audit_property_parties_trigger
    AFTER INSERT OR UPDATE OR DELETE ON property_parties
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Users table audit trigger
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Property photos table audit trigger
DROP TRIGGER IF EXISTS audit_property_photos_trigger ON property_photos;
CREATE TRIGGER audit_property_photos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON property_photos
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Document jobs table audit trigger
DROP TRIGGER IF EXISTS audit_document_jobs_trigger ON document_jobs;
CREATE TRIGGER audit_document_jobs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_jobs
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log_entry();

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    retention_days INTEGER := 2555; -- 7 years default
BEGIN
    -- Get retention period from environment or use default
    -- This would typically be configured via a settings table
    
    DELETE FROM audit_log 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO audit_log (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
    ) VALUES (
        NULL, -- System operation
        'cleanup',
        'audit_log',
        'retention_cleanup',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'retention_days', retention_days,
            'cleanup_timestamp', NOW()
        ),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get audit trail for an entity
CREATE OR REPLACE FUNCTION get_entity_audit_trail(
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    actor_id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.actor_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_values,
        al.new_values,
        al.metadata,
        al.created_at
    FROM audit_log al
    WHERE al.entity_type = p_entity_type
    AND al.entity_id = p_entity_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    action TEXT,
    count BIGINT,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.action,
        COUNT(*) as count,
        MAX(al.created_at) as last_activity
    FROM audit_log al
    WHERE al.actor_id = p_user_id
    AND al.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY al.action
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_created ON audit_log(entity_type, entity_id, created_at DESC);

-- Comments for documentation
COMMENT ON FUNCTION sanitize_pii_for_audit(JSONB) IS 'Sanitizes PII fields in audit data by masking sensitive information';
COMMENT ON FUNCTION create_audit_log_entry() IS 'Creates audit log entries for table changes with PII sanitization';
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Removes audit logs older than retention period (default 7 years)';
COMMENT ON FUNCTION get_entity_audit_trail(TEXT, TEXT, INTEGER) IS 'Retrieves audit trail for a specific entity';
COMMENT ON FUNCTION get_user_activity_summary(UUID, INTEGER) IS 'Gets activity summary for a user over specified days';
