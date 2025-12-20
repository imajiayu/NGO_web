-- =============================================
-- Migration: Add 'failed' status to donation_status constraint
-- Date: 2025-12-20
-- Description: Adds 'failed' status for declined/failed payments
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Adding failed status to donation_status constraint...';
END $$;

-- Drop the existing constraint
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS valid_donation_status;

-- Add the new constraint with 'failed' status
ALTER TABLE public.donations
ADD CONSTRAINT valid_donation_status CHECK (
    donation_status IN ('pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded', 'failed')
);

DO $$
BEGIN
    RAISE NOTICE '✓ Failed status added successfully';
END $$;
