-- Migration: Add Relationship Enum and Watchlist Functionality
-- Date: 2025-01-10
-- Purpose: Add relationship enum and watchlist functionality without schema conflicts

-- Create relationship enum
CREATE TYPE relationship AS ENUM ('owner', 'occupier', 'interested');

-- Add relationship column to property_parties if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'property_parties' 
        AND column_name = 'relationship'
    ) THEN
        ALTER TABLE property_parties
        ADD COLUMN relationship relationship DEFAULT 'interested' NOT NULL;
    END IF;
END $$;

-- Backfill existing data (if any) - assuming existing entries are 'owner' by default
UPDATE property_parties
SET relationship = 'owner'
WHERE relationship IS NULL;

-- Add unique constraint to prevent duplicate relationships for a user and property
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'property_parties_user_property_relationship_unique'
    ) THEN
        ALTER TABLE property_parties
        ADD CONSTRAINT property_parties_user_property_relationship_unique
        UNIQUE (user_id, property_id, relationship);
    END IF;
END $$;

-- Optional: Create tenancies table stub if it doesn't exist
CREATE TABLE IF NOT EXISTS tenancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    landlord_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tenant_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' NOT NULL, -- e.g., 'active', 'ended', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenancies_property_id ON tenancies(property_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_landlord_user_id ON tenancies(landlord_user_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_tenant_user_id ON tenancies(tenant_user_id);

-- RLS for tenancies (to be defined later if needed)
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
