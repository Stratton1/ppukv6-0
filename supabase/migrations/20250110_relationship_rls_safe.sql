-- Migration: Update RLS Policies for Relationship Model (Safe/Idempotent)
-- Date: 2025-01-10
-- Purpose: Update RLS policies to work with relationship enum

-- Update RLS for properties table
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Owners can view and manage their properties') THEN
    DROP POLICY "Owners can view and manage their properties" ON properties;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Occupiers can view properties they are associated with') THEN
    DROP POLICY "Occupiers can view properties they are associated with" ON properties;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'Interested users can view public properties') THEN
    DROP POLICY "Interested users can view public properties" ON properties;
  END IF;
END$$;

-- Create new relationship-based policies for properties
CREATE POLICY "Owners can view and manage their properties" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = properties.id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'owner'
        )
    );

CREATE POLICY "Occupiers can view properties they are associated with" ON properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = properties.id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'occupier'
        )
    );

CREATE POLICY "Interested users can view public properties" ON properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_parties pp
            WHERE pp.property_id = properties.id
            AND pp.user_id = auth.uid()
            AND pp.relationship = 'interested'
        )
    );

-- Update RLS for property_parties table
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_parties' AND policyname = 'Users can view property parties for properties they have access to') THEN
    DROP POLICY "Users can view property parties for properties they have access to" ON property_parties;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_parties' AND policyname = 'Users can manage their own relationships') THEN
    DROP POLICY "Users can manage their own relationships" ON property_parties;
  END IF;
END$$;

-- Create new relationship-based policies for property_parties
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
        OR
        -- Occupiers can see other occupiers and interested users for their properties
        (
            relationship IN ('occupier', 'interested')
            AND EXISTS (
                SELECT 1 FROM property_parties pp
                WHERE pp.property_id = property_parties.property_id
                AND pp.user_id = auth.uid()
                AND pp.relationship = 'occupier'
            )
        )
        OR
        -- Interested users can only see other interested users for their properties
        (
            relationship = 'interested'
            AND EXISTS (
                SELECT 1 FROM property_parties pp
                WHERE pp.property_id = property_parties.property_id
                AND pp.user_id = auth.uid()
                AND pp.relationship = 'interested'
            )
        )
    );

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

-- Update RLS for documents table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    -- Drop existing policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can view documents for properties they have access to') THEN
      DROP POLICY "Users can view documents for properties they have access to" ON documents;
    END IF;
    
    -- Create new relationship-based policy for documents
    CREATE POLICY "Users can view documents for properties they have access to" ON documents
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM property_parties pp
                WHERE pp.property_id = documents.property_id
                AND pp.user_id = auth.uid()
                AND pp.relationship = 'owner'
            )
            OR
            (
                documents.is_public = TRUE
                AND EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = documents.property_id
                    AND pp.user_id = auth.uid()
                    AND pp.relationship IN ('occupier', 'interested')
                )
            )
            OR
            (
                EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = documents.property_id
                    AND pp.user_id = auth.uid()
                    AND pp.relationship = 'occupier'
                )
            )
        );
  END IF;
END$$;

-- Update RLS for notes table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    -- Drop existing policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can view notes for properties they have access to') THEN
      DROP POLICY "Users can view notes for properties they have access to" ON notes;
    END IF;
    
    -- Create new relationship-based policy for notes
    CREATE POLICY "Users can view notes for properties they have access to" ON notes
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM property_parties pp
                WHERE pp.property_id = notes.property_id
                AND pp.user_id = auth.uid()
                AND pp.relationship = 'owner'
            )
            OR
            (
                notes.visibility = 'public'
                AND EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = notes.property_id
                    AND pp.user_id = auth.uid()
                    AND pp.relationship IN ('occupier', 'interested')
                )
            )
            OR
            (
                notes.visibility = 'shared'
                AND EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = notes.property_id
                    AND pp.user_id = auth.uid()
                    AND pp.relationship = 'occupier'
                )
            )
        );
  END IF;
END$$;

-- Update RLS for tasks table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    -- Drop existing policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view tasks for properties they have access to') THEN
      DROP POLICY "Users can view tasks for properties they have access to" ON tasks;
    END IF;
    
    -- Create new relationship-based policy for tasks
    CREATE POLICY "Users can view tasks for properties they have access to" ON tasks
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM property_parties pp
                WHERE pp.property_id = tasks.property_id
                AND pp.user_id = auth.uid()
                AND pp.relationship = 'owner'
            )
            OR
            (
                tasks.status = 'public'
                AND EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = tasks.property_id
                    AND pp.user_id = auth.uid()
                    AND pp.relationship IN ('occupier', 'interested')
                )
            )
            OR
            (
                EXISTS (
                    SELECT 1 FROM property_parties pp
                    WHERE pp.property_id = tasks.property_id
                    AND pp.user_id = auth.uid()
                    AND pp.relationship = 'occupier'
                )
            )
        );
  END IF;
END$$;
