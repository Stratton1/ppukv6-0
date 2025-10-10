-- PPUK v6 RLS Policies Migration
-- Comprehensive Row Level Security policies for all tables
-- Created: 2025-01-03
-- Purpose: Secure access control for PPUK v6 backend

-- ============================================================================
-- DROP EXISTING POLICIES (if any)
-- ============================================================================

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view parties for their properties" ON property_parties;
DROP POLICY IF EXISTS "Property owners can manage parties" ON property_parties;
DROP POLICY IF EXISTS "Users can view notes for their properties" ON notes;
DROP POLICY IF EXISTS "Users can create notes for their properties" ON notes;
DROP POLICY IF EXISTS "Note creators can update their notes" ON notes;
DROP POLICY IF EXISTS "Users can view tasks for their properties" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks for their properties" ON tasks;
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can read cache" ON api_cache;
DROP POLICY IF EXISTS "Users can view audit logs for their properties" ON audit_log;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if user has access to property
CREATE OR REPLACE FUNCTION user_has_property_access(property_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM property_parties pp
    WHERE pp.property_id = user_has_property_access.property_id
    AND pp.user_id = user_has_property_access.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user is property owner
CREATE OR REPLACE FUNCTION user_is_property_owner(property_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = user_is_property_owner.property_id
    AND p.claimed_by = user_is_property_owner.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION user_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = user_is_admin.user_id
    AND u.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user can manage property parties
CREATE OR REPLACE FUNCTION user_can_manage_property_parties(property_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_is_property_owner(property_id, user_id) OR
         EXISTS (
           SELECT 1 FROM property_parties pp
           WHERE pp.property_id = user_can_manage_property_parties.property_id
           AND pp.user_id = user_can_manage_property_parties.user_id
           AND pp.role IN ('agent', 'conveyancer', 'solicitor')
           AND pp.is_primary = TRUE
         );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger)
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (user_is_admin(auth.uid()));

-- Admins can update all users
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (user_is_admin(auth.uid()));

-- ============================================================================
-- PROPERTY_PARTIES TABLE POLICIES
-- ============================================================================

-- Users can view parties for properties they have access to
CREATE POLICY "property_parties_select_access"
  ON property_parties FOR SELECT
  USING (
    user_has_property_access(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Property owners and primary agents can manage parties
CREATE POLICY "property_parties_insert_manage"
  ON property_parties FOR INSERT
  WITH CHECK (
    user_can_manage_property_parties(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Property owners and primary agents can update parties
CREATE POLICY "property_parties_update_manage"
  ON property_parties FOR UPDATE
  USING (
    user_can_manage_property_parties(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Property owners and primary agents can delete parties
CREATE POLICY "property_parties_delete_manage"
  ON property_parties FOR DELETE
  USING (
    user_can_manage_property_parties(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- ============================================================================
-- DOCUMENTS TABLE POLICIES (Enhanced)
-- ============================================================================

-- Drop existing document policies
DROP POLICY IF EXISTS "Property owners can view documents" ON documents;
DROP POLICY IF EXISTS "Property owners can insert documents" ON documents;
DROP POLICY IF EXISTS "Property owners can update documents" ON documents;

-- Users can view documents for properties they have access to
CREATE POLICY "documents_select_access"
  ON documents FOR SELECT
  USING (
    user_has_property_access(property_id, auth.uid()) OR
    (is_public = TRUE) OR
    user_is_admin(auth.uid())
  );

-- Users can insert documents for properties they have access to
CREATE POLICY "documents_insert_access"
  ON documents FOR INSERT
  WITH CHECK (
    user_has_property_access(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Document uploaders and property owners can update documents
CREATE POLICY "documents_update_access"
  ON documents FOR UPDATE
  USING (
    uploaded_by = auth.uid() OR
    user_is_property_owner(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Document uploaders and property owners can delete documents
CREATE POLICY "documents_delete_access"
  ON documents FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    user_is_property_owner(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- ============================================================================
-- NOTES TABLE POLICIES
-- ============================================================================

-- Users can view notes for properties they have access to
CREATE POLICY "notes_select_access"
  ON notes FOR SELECT
  USING (
    user_has_property_access(property_id, auth.uid()) OR
    (visibility = 'public') OR
    (visibility = 'shared' AND user_has_property_access(property_id, auth.uid())) OR
    (visibility = 'private' AND created_by = auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Users can create notes for properties they have access to
CREATE POLICY "notes_insert_access"
  ON notes FOR INSERT
  WITH CHECK (
    user_has_property_access(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Note creators can update their notes
CREATE POLICY "notes_update_creator"
  ON notes FOR UPDATE
  USING (
    created_by = auth.uid() OR
    user_is_admin(auth.uid())
  );

-- Note creators can delete their notes
CREATE POLICY "notes_delete_creator"
  ON notes FOR DELETE
  USING (
    created_by = auth.uid() OR
    user_is_admin(auth.uid())
  );

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- Users can view tasks for properties they have access to
CREATE POLICY "tasks_select_access"
  ON tasks FOR SELECT
  USING (
    user_has_property_access(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Users can create tasks for properties they have access to
CREATE POLICY "tasks_insert_access"
  ON tasks FOR INSERT
  WITH CHECK (
    user_has_property_access(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Task creators, assignees, and property owners can update tasks
CREATE POLICY "tasks_update_access"
  ON tasks FOR UPDATE
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    user_is_property_owner(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Task creators and property owners can delete tasks
CREATE POLICY "tasks_delete_access"
  ON tasks FOR DELETE
  USING (
    created_by = auth.uid() OR
    user_is_property_owner(property_id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- ============================================================================
-- API_CACHE TABLE POLICIES
-- ============================================================================

-- Authenticated users can read cache (for performance)
CREATE POLICY "api_cache_select_auth"
  ON api_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- System can insert cache entries (via service role)
CREATE POLICY "api_cache_insert_system"
  ON api_cache FOR INSERT
  WITH CHECK (true); -- Allow system to cache

-- System can update cache entries
CREATE POLICY "api_cache_update_system"
  ON api_cache FOR UPDATE
  USING (true); -- Allow system to update cache

-- System can delete cache entries
CREATE POLICY "api_cache_delete_system"
  ON api_cache FOR DELETE
  USING (true); -- Allow system to clean cache

-- ============================================================================
-- AUDIT_LOG TABLE POLICIES
-- ============================================================================

-- Users can view audit logs for properties they have access to
CREATE POLICY "audit_log_select_access"
  ON audit_log FOR SELECT
  USING (
    -- Property-related entities
    (entity_type = 'property' AND user_has_property_access(entity_id, auth.uid())) OR
    -- Document-related entities
    (entity_type = 'document' AND EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = audit_log.entity_id
      AND user_has_property_access(d.property_id, auth.uid())
    )) OR
    -- Note-related entities
    (entity_type = 'note' AND EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = audit_log.entity_id
      AND user_has_property_access(n.property_id, auth.uid())
    )) OR
    -- Task-related entities
    (entity_type = 'task' AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = audit_log.entity_id
      AND user_has_property_access(t.property_id, auth.uid())
    )) OR
    -- Property party-related entities
    (entity_type = 'property_party' AND EXISTS (
      SELECT 1 FROM property_parties pp
      WHERE pp.id = audit_log.entity_id
      AND user_has_property_access(pp.property_id, auth.uid())
    )) OR
    -- Admin access
    user_is_admin(auth.uid())
  );

-- System can insert audit logs
CREATE POLICY "audit_log_insert_system"
  ON audit_log FOR INSERT
  WITH CHECK (true); -- Allow system to log

-- ============================================================================
-- PROPERTIES TABLE POLICIES (Enhanced)
-- ============================================================================

-- Drop existing property policies
DROP POLICY IF EXISTS "Anyone can view public properties" ON properties;
DROP POLICY IF EXISTS "Owners can view their claimed properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON properties;
DROP POLICY IF EXISTS "Owners can update their claimed properties" ON properties;

-- Anyone can view public properties
CREATE POLICY "properties_select_public"
  ON properties FOR SELECT
  USING (is_public = TRUE);

-- Users can view properties they have access to
CREATE POLICY "properties_select_access"
  ON properties FOR SELECT
  USING (
    user_has_property_access(id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Authenticated users can create properties
CREATE POLICY "properties_insert_auth"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Property owners and parties can update properties
CREATE POLICY "properties_update_access"
  ON properties FOR UPDATE
  USING (
    user_has_property_access(id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- Property owners can delete properties
CREATE POLICY "properties_delete_owner"
  ON properties FOR DELETE
  USING (
    user_is_property_owner(id, auth.uid()) OR
    user_is_admin(auth.uid())
  );

-- ============================================================================
-- SAVED_PROPERTIES TABLE POLICIES (Enhanced)
-- ============================================================================

-- Drop existing saved properties policies
DROP POLICY IF EXISTS "Users can view their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can insert their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can delete their saved properties" ON saved_properties;

-- Users can view their own saved properties
CREATE POLICY "saved_properties_select_own"
  ON saved_properties FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own saved properties
CREATE POLICY "saved_properties_insert_own"
  ON saved_properties FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own saved properties
CREATE POLICY "saved_properties_update_own"
  ON saved_properties FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own saved properties
CREATE POLICY "saved_properties_delete_own"
  ON saved_properties FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- PROFILES TABLE POLICIES (Enhanced)
-- ============================================================================

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (user_is_admin(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (user_is_admin(auth.uid()));

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION user_has_property_access IS 'Check if user has any role on a property';
COMMENT ON FUNCTION user_is_property_owner IS 'Check if user is the primary owner of a property';
COMMENT ON FUNCTION user_is_admin IS 'Check if user has admin role';
COMMENT ON FUNCTION user_can_manage_property_parties IS 'Check if user can manage property parties (owners, primary agents, etc.)';

-- Policy documentation
COMMENT ON POLICY "users_select_own" ON users IS 'Users can view their own profile';
COMMENT ON POLICY "property_parties_select_access" ON property_parties IS 'Users can view parties for properties they have access to';
COMMENT ON POLICY "documents_select_access" ON documents IS 'Users can view documents for properties they have access to, plus public documents';
COMMENT ON POLICY "notes_select_access" ON notes IS 'Users can view notes based on visibility and property access';
COMMENT ON POLICY "tasks_select_access" ON tasks IS 'Users can view tasks for properties they have access to';
COMMENT ON POLICY "audit_log_select_access" ON audit_log IS 'Users can view audit logs for properties they have access to';
