-- Migration: Relationship Enum and Watchlist Support
-- Date: 2025-01-03
-- Description: Formalize relationship model and add watchlist functionality

-- 1. Create relationship enum
CREATE TYPE relationship AS ENUM ('owner', 'occupier', 'interested');

-- 2. Add relationship column to property_parties if it doesn't exist
-- First check if we need to add the column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_parties' 
        AND column_name = 'relationship'
    ) THEN
        -- Add the relationship column
        ALTER TABLE property_parties 
        ADD COLUMN relationship relationship NOT NULL DEFAULT 'owner';
        
        -- Backfill existing data based on role
        UPDATE property_parties 
        SET relationship = CASE 
            WHEN role = 'owner' THEN 'owner'::relationship
            WHEN role IN ('purchaser', 'tenant') THEN 'occupier'::relationship
            ELSE 'interested'::relationship
        END;
        
        -- Make it NOT NULL after backfill
        ALTER TABLE property_parties 
        ALTER COLUMN relationship SET NOT NULL;
    END IF;
END $$;

-- 3. Add unique constraint to prevent duplicate relationships
-- Drop existing constraint if it exists
ALTER TABLE property_parties 
DROP CONSTRAINT IF EXISTS property_parties_user_property_relationship_unique;

-- Add new unique constraint
ALTER TABLE property_parties 
ADD CONSTRAINT property_parties_user_property_relationship_unique 
UNIQUE (user_id, property_id, relationship);

-- 4. Create tenancies table stub (for future use)
CREATE TABLE IF NOT EXISTS tenancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    landlord_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status tenancy_status NOT NULL DEFAULT 'active',
    rent_amount DECIMAL(10,2),
    rent_frequency rent_frequency DEFAULT 'monthly',
    deposit_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure tenant can't be their own landlord
    CONSTRAINT tenancies_no_self_landlord CHECK (landlord_user_id != tenant_user_id),
    
    -- Ensure end date is after start date
    CONSTRAINT tenancies_valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create supporting enums for tenancies
DO $$
BEGIN
    -- Create tenancy_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenancy_status') THEN
        CREATE TYPE tenancy_status AS ENUM ('active', 'ended', 'terminated', 'pending');
    END IF;
    
    -- Create rent_frequency enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rent_frequency') THEN
        CREATE TYPE rent_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'annually');
    END IF;
END $$;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_parties_relationship 
ON property_parties(relationship);

CREATE INDEX IF NOT EXISTS idx_property_parties_user_relationship 
ON property_parties(user_id, relationship);

CREATE INDEX IF NOT EXISTS idx_tenancies_property_id 
ON tenancies(property_id);

CREATE INDEX IF NOT EXISTS idx_tenancies_landlord 
ON tenancies(landlord_user_id);

CREATE INDEX IF NOT EXISTS idx_tenancies_tenant 
ON tenancies(tenant_user_id);

-- 6. Add updated_at trigger for tenancies
CREATE OR REPLACE FUNCTION update_tenancies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenancies_updated_at
    BEFORE UPDATE ON tenancies
    FOR EACH ROW
    EXECUTE FUNCTION update_tenancies_updated_at();

-- 7. Add comments for documentation
COMMENT ON TYPE relationship IS 'Defines the relationship between a user and a property: owner (full access), occupier (tenant/purchaser with shared access), interested (watchlist/saved properties)';
COMMENT ON COLUMN property_parties.relationship IS 'The relationship type between user and property';
COMMENT ON TABLE tenancies IS 'Future table for managing landlord-tenant relationships (not yet wired with RLS)';
COMMENT ON COLUMN tenancies.status IS 'Current status of the tenancy agreement';
COMMENT ON COLUMN tenancies.rent_frequency IS 'How often rent is paid';
