-- Migration: Add Relationship Enum and Watchlist Functionality (Safe/Idempotent)
-- Date: 2025-01-10
-- Purpose: Add relationship enum and watchlist functionality with full guards

-- 1) Relationship enum (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relationship') THEN
    CREATE TYPE relationship AS ENUM ('owner','occupier','interested');
  END IF;
END$$;

-- 2) Add column to property_parties (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='property_parties' AND column_name='relationship'
  ) THEN
    ALTER TABLE public.property_parties ADD COLUMN relationship relationship NULL;
  END IF;
END$$;

-- 3) Backfill heuristic (only if null and legacy columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property_parties' AND column_name='role') THEN
    UPDATE public.property_parties
    SET relationship = 
      CASE 
        WHEN role IN ('owner','landlord') THEN 'owner'::relationship
        WHEN role IN ('tenant','occupier','resident') THEN 'occupier'::relationship
        ELSE 'interested'::relationship
      END
    WHERE relationship IS NULL;
  ELSE
    UPDATE public.property_parties
    SET relationship = 'interested'::relationship
    WHERE relationship IS NULL;
  END IF;
END$$;

-- 4) Set NOT NULL (if all rows now have a value)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.property_parties WHERE relationship IS NULL) THEN
    -- leave nullable to avoid failure; FE/BE will handle nulls
  ELSE
    ALTER TABLE public.property_parties ALTER COLUMN relationship SET NOT NULL;
  END IF;
END$$;

-- 5) Unique constraint to prevent duplicates (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname='property_parties_user_property_relationship_key'
  ) THEN
    ALTER TABLE public.property_parties
    ADD CONSTRAINT property_parties_user_property_relationship_key
    UNIQUE (user_id, property_id, relationship);
  END IF;
END$$;

-- 6) Optional: tenancies stub (only create if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='tenancies') THEN
    CREATE TABLE public.tenancies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
      landlord_user_id uuid NOT NULL REFERENCES auth.users(id),
      tenant_user_id uuid REFERENCES auth.users(id),
      start_date date,
      end_date date,
      status text DEFAULT 'active',
      created_at timestamptz DEFAULT now()
    );
  END IF;
END$$;
