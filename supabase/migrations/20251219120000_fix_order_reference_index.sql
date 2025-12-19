-- Fix order_reference index: Remove UNIQUE constraint
-- Reason: One order can have multiple donation records (one per unit)
-- Each donation has a unique donation_public_id, but shares the same order_reference

-- Drop the UNIQUE index
DROP INDEX IF EXISTS idx_donations_order_reference;

-- Create a regular (non-unique) index for query performance
CREATE INDEX idx_donations_order_reference
    ON public.donations(order_reference)
    WHERE order_reference IS NOT NULL;

-- The composite index idx_donations_order_ref_status already exists for webhook queries
-- It remains unchanged and will be used for finding donations by order_reference + status
