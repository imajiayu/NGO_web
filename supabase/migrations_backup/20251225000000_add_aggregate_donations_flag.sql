-- =============================================================================================================
-- Add aggregate_donations flag to projects table
-- =============================================================================================================
-- Description: Adds a boolean flag to control whether donations should be aggregated into a single record
--              or split into multiple records (one per unit)
-- Version: 1.0
-- Date: 2025-12-25
--
-- Use cases:
-- - aggregate_donations = true: Tip projects, flexible donation amounts (1 record regardless of amount)
-- - aggregate_donations = false: Unit-based projects like supplies (N records for N units)
--
-- This decouples "aggregation behavior" from "is_long_term" flag for better flexibility
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Adding aggregate_donations flag to projects table...';
    RAISE NOTICE '========================================';
END $$;

-- Add aggregate_donations column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS aggregate_donations BOOLEAN DEFAULT false NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.aggregate_donations IS
'Controls donation record creation behavior:
- true: Create single aggregated donation record regardless of quantity (e.g., tip/support projects)
- false: Create one donation record per unit (e.g., supply projects like sleeping bags)';

-- Create index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_projects_aggregate_donations
ON public.projects(aggregate_donations);

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
END $$;
