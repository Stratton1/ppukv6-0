-- Migration: Update RLS Policies for Relationship Model
-- Date: 2025-01-03
-- Description: Update RLS policies to work with the new relationship enum

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view property parties for properties they have access to" ON property_parties;
DROP POLICY IF EXISTS "Property owners can manage parties" ON property_parties;

-- 1. Updated Property Parties Policies

-- Policy: Users can view property parties for properties they have access to
CREATE POLICY "Users can view property parties for properties they have access to" ON property_parties
    FOR SELECT USING (
        -- Users can see their own relationships
        user_id = auth.uid()
        OR
        -- Property owners can see all relationships for their properties
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = property_parties.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );

-- Policy: Users can manage their own relationships
CREATE POLICY "Users can manage their own relationships" ON property_parties
    FOR ALL USING (
        user_id = auth.uid()
        OR
        -- Property owners can manage all relationships for their properties
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = property_parties.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );

-- 2. Updated Properties Policies

-- Policy: Users can view properties based on their relationship
CREATE POLICY "Users can view properties based on relationship" ON properties
    FOR SELECT USING (
        -- Public properties are visible to all
        is_public = true
        OR
        -- Users can see properties they have any relationship with
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = properties.id
            AND pp.user_id = auth.uid()
        )
    );

-- Policy: Only owners can update properties
CREATE POLICY "Only owners can update properties" ON properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = properties.id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );

-- 3. Updated Documents Policies

-- Policy: Document access based on relationship
CREATE POLICY "Document access based on relationship" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = documents.property_id
            AND pp.user_id = auth.uid()
            AND (
                -- Owners have full access
                pp.relationship = 'owner'
                OR
                -- Occupiers can see shared documents
                (pp.relationship = 'occupier' AND documents.is_public = true)
                OR
                -- Interested users can see public documents only
                (pp.relationship = 'interested' AND documents.is_public = true)
            )
        )
    );

-- Policy: Document upload based on relationship
CREATE POLICY "Document upload based on relationship" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = documents.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship IN ('owner', 'occupier')
        )
        AND uploaded_by = auth.uid()
    );

-- Policy: Document update based on relationship
CREATE POLICY "Document update based on relationship" ON documents
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = documents.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );

-- 4. Updated Notes Policies

-- Policy: Notes access based on relationship
CREATE POLICY "Notes access based on relationship" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = notes.property_id
            AND pp.user_id = auth.uid()
            AND (
                -- Owners can see all notes
                pp.relationship = 'owner'
                OR
                -- Occupiers can see shared notes
                (pp.relationship = 'occupier' AND notes.visibility IN ('shared', 'public'))
                OR
                -- Interested users can see public notes only
                (pp.relationship = 'interested' AND notes.visibility = 'public')
            )
        )
    );

-- Policy: Notes creation based on relationship
CREATE POLICY "Notes creation based on relationship" ON notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = notes.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship IN ('owner', 'occupier')
        )
        AND created_by = auth.uid()
    );

-- Policy: Notes update based on relationship
CREATE POLICY "Notes update based on relationship" ON notes
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = notes.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );

-- 5. Updated Tasks Policies

-- Policy: Tasks access based on relationship
CREATE POLICY "Tasks access based on relationship" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = tasks.property_id
            AND pp.user_id = auth.uid()
            AND (
                -- Owners can see all tasks
                pp.relationship = 'owner'
                OR
                -- Occupiers can see shared tasks
                (pp.relationship = 'occupier' AND tasks.assigned_to = auth.uid())
                OR
                -- Interested users can see public tasks only
                (pp.relationship = 'interested' AND tasks.status = 'public')
            )
        )
    );

-- Policy: Tasks creation based on relationship
CREATE POLICY "Tasks creation based on relationship" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = tasks.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship IN ('owner', 'occupier')
        )
        AND created_by = auth.uid()
    );

-- Policy: Tasks update based on relationship
CREATE POLICY "Tasks update based on relationship" ON tasks
    FOR UPDATE USING (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = tasks.property_id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );

-- 6. Storage Bucket Policies (Updated for relationship model)

-- Property Images: Public viewing for all relationships
DROP POLICY IF EXISTS "Users can view property images they have access to" ON storage.objects;
CREATE POLICY "Users can view property images based on relationship" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-images'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );

-- Professional Reports: Restricted to owners and occupiers
DROP POLICY IF EXISTS "Users can view professional reports for properties they have access to" ON storage.objects;
CREATE POLICY "Professional reports access based on relationship" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'professional-reports'
        AND EXISTS (
            SELECT 1 FROM properties p
            JOIN property_parties pp ON pp.property_id = p.id
            WHERE pp.user_id = auth.uid()
            AND pp.relationship IN ('owner', 'occupier')
            AND storage.objects.name LIKE 'property/' || p.id::text || '/%'
        )
    );

-- 7. Add comments for documentation
COMMENT ON POLICY "Users can view property parties for properties they have access to" ON property_parties IS 'Users can see their own relationships and property owners can see all relationships for their properties';
COMMENT ON POLICY "Users can manage their own relationships" ON property_parties IS 'Users can manage their own relationships, property owners can manage all relationships for their properties';
COMMENT ON POLICY "Users can view properties based on relationship" ON properties IS 'Public properties visible to all, private properties visible only to users with relationships';
COMMENT ON POLICY "Document access based on relationship" ON documents IS 'Access to documents based on relationship: owners (all), occupiers (shared), interested (public only)';
COMMENT ON POLICY "Notes access based on relationship" ON notes IS 'Access to notes based on relationship and visibility settings';
COMMENT ON POLICY "Tasks access based on relationship" ON tasks IS 'Access to tasks based on relationship and assignment';
