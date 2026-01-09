-- =============================================================================================================
-- Database Cleanup and Enhancement
-- =============================================================================================================
-- Description:
--   1. Drop unused database functions (code cleanup)
--   2. Add updated_at column to donations table
--   3. Add trigger to auto-update donations.updated_at
--
-- Date: 2025-12-23
-- Version: 1.0
--
-- Changes:
--   - DROP: get_project_progress() - Replaced by project_stats view
--   - DROP: get_recent_donations() - Replaced by public_project_donations view + getProjectDonations()
--   - DROP: is_project_goal_reached() - Simple boolean check, computed in frontend
--   - ADD: donations.updated_at column with automatic update trigger
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting database cleanup and enhancement...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PART 1: DROP UNUSED FUNCTIONS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping unused database functions...';
END $$;

-- ---------------------------------------------
-- Drop get_project_progress
-- Reason: Functionality covered by project_stats view
-- ---------------------------------------------
DROP FUNCTION IF EXISTS public.get_project_progress(BIGINT) CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✓ Dropped: get_project_progress(BIGINT)';
END $$;

-- ---------------------------------------------
-- Drop get_recent_donations
-- Reason: Functionality covered by getProjectDonations() + public_project_donations view
-- Note: View version is more secure (email obfuscation)
-- ---------------------------------------------
DROP FUNCTION IF EXISTS public.get_recent_donations(BIGINT, INTEGER) CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✓ Dropped: get_recent_donations(BIGINT, INTEGER)';
END $$;

-- ---------------------------------------------
-- Drop is_project_goal_reached
-- Reason: Simple boolean check, more efficient to compute in frontend
-- Computation: current_units >= target_units
-- ---------------------------------------------
DROP FUNCTION IF EXISTS public.is_project_goal_reached(BIGINT) CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✓ Dropped: is_project_goal_reached(BIGINT)';
END $$;

-- =============================================================================================================
-- PART 2: ADD updated_at COLUMN TO donations TABLE
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Adding updated_at column to donations table...';
END $$;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set initial value for existing records (same as created_at)
UPDATE public.donations
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Make it NOT NULL after setting initial values
ALTER TABLE public.donations
ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✓ Added: donations.updated_at column';
END $$;

-- =============================================================================================================
-- PART 3: ADD TRIGGER FOR AUTO-UPDATE
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating auto-update trigger for donations.updated_at...';
END $$;

-- Create trigger to auto-update updated_at on donations table
-- Note: The function update_updated_at_column() already exists (used by projects table)
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE '✓ Created: update_donations_updated_at trigger';
END $$;

-- =============================================================================================================
-- PART 4: ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Adding documentation comments...';
END $$;

-- Add comment to the new column
COMMENT ON COLUMN public.donations.updated_at IS 'Record last update timestamp (auto-updated by trigger)';

-- Update trigger comment
COMMENT ON TRIGGER update_donations_updated_at ON public.donations IS 'Automatically updates updated_at timestamp when donation record is modified';

DO $$
BEGIN
    RAISE NOTICE '✓ Documentation updated';
END $$;

-- =============================================================================================================
-- PART 5: VERIFICATION
-- =============================================================================================================

DO $$
DECLARE
    func_count INTEGER;
    column_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifying changes...';
    RAISE NOTICE '========================================';

    -- Verify functions are dropped
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_project_progress', 'get_recent_donations', 'is_project_goal_reached');

    IF func_count = 0 THEN
        RAISE NOTICE '✓ All 3 unused functions successfully dropped';
    ELSE
        RAISE WARNING '⚠ Expected 0 functions, found %', func_count;
    END IF;

    -- Verify column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'donations'
          AND column_name = 'updated_at'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE NOTICE '✓ Column donations.updated_at successfully added';
    ELSE
        RAISE WARNING '⚠ Column donations.updated_at not found';
    END IF;

    -- Verify trigger exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'donations'
          AND t.tgname = 'update_donations_updated_at'
    ) INTO trigger_exists;

    IF trigger_exists THEN
        RAISE NOTICE '✓ Trigger update_donations_updated_at successfully created';
    ELSE
        RAISE WARNING '⚠ Trigger update_donations_updated_at not found';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- COMPLETION SUMMARY
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary of changes:';
    RAISE NOTICE '';
    RAISE NOTICE '🗑️  DELETED (3 unused functions):';
    RAISE NOTICE '   - get_project_progress(BIGINT)';
    RAISE NOTICE '   - get_recent_donations(BIGINT, INTEGER)';
    RAISE NOTICE '   - is_project_goal_reached(BIGINT)';
    RAISE NOTICE '';
    RAISE NOTICE '✨ ADDED:';
    RAISE NOTICE '   - donations.updated_at column (TIMESTAMPTZ NOT NULL)';
    RAISE NOTICE '   - update_donations_updated_at trigger (auto-update on UPDATE)';
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining database functions (in use):';
    RAISE NOTICE '   ✓ generate_donation_public_id(BIGINT)';
    RAISE NOTICE '   ✓ get_donations_by_email_verified(TEXT, TEXT)';
    RAISE NOTICE '   ✓ request_donation_refund(TEXT, TEXT)';
    RAISE NOTICE '   ✓ update_updated_at_column() [trigger function]';
    RAISE NOTICE '   ✓ update_project_units() [trigger function]';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '   - Code cleanup: 3 unused functions removed';
    RAISE NOTICE '   - Better tracking: donations now have updated_at timestamp';
    RAISE NOTICE '   - Automatic updates: trigger ensures timestamp is always current';
    RAISE NOTICE '========================================';
END $$;
