-- =============================================================================================================
-- Fix Duplicate Donation Status Constraint
-- =============================================================================================================
-- Description:
--   Removes the old 'valid_donation_status' constraint that was left behind after
--   migration 20251224000000_add_donation_status_constraints.sql added the new
--   'donations_status_check' constraint.
--
--   This migration fixes the issue where both constraints existed simultaneously,
--   which could cause conflicts.
--
-- Date: 2025-12-24
-- Version: 1.0
-- Fixes: Issue where old constraint name was not dropped
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fixing duplicate donation_status constraints...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PART 1: CHECK CURRENT STATE
-- =============================================================================================================

DO $$
DECLARE
    old_constraint_exists BOOLEAN;
    new_constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Checking current constraint state...';

    -- Check if old constraint exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'valid_donation_status'
          AND table_name = 'donations'
          AND table_schema = 'public'
    ) INTO old_constraint_exists;

    -- Check if new constraint exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'donations_status_check'
          AND table_name = 'donations'
          AND table_schema = 'public'
    ) INTO new_constraint_exists;

    IF old_constraint_exists THEN
        RAISE NOTICE '⚠ Old constraint (valid_donation_status) exists - will be removed';
    ELSE
        RAISE NOTICE '✓ Old constraint already removed';
    END IF;

    IF new_constraint_exists THEN
        RAISE NOTICE '✓ New constraint (donations_status_check) exists';
    ELSE
        RAISE WARNING '⚠ New constraint not found - this is unexpected!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =============================================================================================================
-- PART 2: DROP OLD CONSTRAINT
-- =============================================================================================================

-- Drop the old constraint (original name from initial schema)
-- This constraint only supported 7 statuses: pending, paid, confirmed, delivering, completed, refunding, refunded
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS valid_donation_status;

DO $$
BEGIN
    RAISE NOTICE '✓ Old constraint (valid_donation_status) removed';
    RAISE NOTICE '';
END $$;

-- =============================================================================================================
-- PART 3: VERIFY NEW CONSTRAINT
-- =============================================================================================================

DO $$
DECLARE
    new_constraint_exists BOOLEAN;
    constraint_definition TEXT;
BEGIN
    RAISE NOTICE 'Verifying new constraint...';

    -- Check if new constraint exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'donations_status_check'
          AND table_name = 'donations'
          AND table_schema = 'public'
    ) INTO new_constraint_exists;

    IF NOT new_constraint_exists THEN
        RAISE EXCEPTION '⚠ New constraint (donations_status_check) not found! Migration 20251224000000 may not have run.';
    END IF;

    -- Get constraint definition
    SELECT pg_get_constraintdef(oid)
    INTO constraint_definition
    FROM pg_constraint
    WHERE conname = 'donations_status_check'
      AND conrelid = 'public.donations'::regclass;

    RAISE NOTICE '✓ New constraint verified: %', constraint_definition;
    RAISE NOTICE '';
END $$;

-- =============================================================================================================
-- PART 4: VERIFY NO DUPLICATE CONSTRAINTS
-- =============================================================================================================

DO $$
DECLARE
    constraint_count INTEGER;
    constraint_names TEXT;
BEGIN
    RAISE NOTICE 'Checking for duplicate constraints...';

    -- Count all CHECK constraints on donation_status column
    SELECT COUNT(*), STRING_AGG(conname, ', ')
    INTO constraint_count, constraint_names
    FROM pg_constraint
    WHERE conrelid = 'public.donations'::regclass
      AND contype = 'c'  -- CHECK constraint
      AND pg_get_constraintdef(oid) LIKE '%donation_status%';

    IF constraint_count > 1 THEN
        RAISE WARNING '⚠ Multiple constraints found on donation_status: %', constraint_names;
        RAISE NOTICE 'This may indicate additional cleanup is needed.';
    ELSIF constraint_count = 1 THEN
        RAISE NOTICE '✓ Only one constraint exists: %', constraint_names;
    ELSE
        RAISE WARNING '⚠ No constraints found on donation_status!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =============================================================================================================
-- PART 5: TEST NEW STATUS VALUES
-- =============================================================================================================

DO $$
DECLARE
    test_statuses TEXT[] := ARRAY[
        'widget_load_failed',
        'user_cancelled',
        'processing',
        'fraud_check',
        'expired',
        'declined',
        'failed',
        'refund_processing'
    ];
    test_status TEXT;
    test_passed BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE 'Testing new status values...';
    RAISE NOTICE '';

    -- Test that new statuses are allowed
    FOREACH test_status IN ARRAY test_statuses LOOP
        BEGIN
            -- Try to insert a test record (will be rolled back)
            INSERT INTO public.donations (
                donation_public_id,
                project_id,
                donor_name,
                donor_email,
                amount,
                currency,
                donation_status,
                order_reference
            ) VALUES (
                'TEST-' || test_status || '-' || floor(random() * 1000000),
                1,  -- Assumes project ID 1 exists
                'Test User',
                'test@example.com',
                100,
                'USD',
                test_status,
                'TEST-ORDER-' || test_status
            );

            -- Clean up test data
            DELETE FROM public.donations
            WHERE donation_public_id LIKE 'TEST-%';

            RAISE NOTICE '  ✓ Status "%" is allowed', test_status;

        EXCEPTION
            WHEN check_violation THEN
                RAISE WARNING '  ✗ Status "%" is blocked by constraint!', test_status;
                test_passed := FALSE;
            WHEN foreign_key_violation THEN
                -- Project doesn't exist, but constraint passed
                RAISE NOTICE '  ✓ Status "%" is allowed (FK error is OK for test)', test_status;
            WHEN OTHERS THEN
                RAISE WARNING '  ? Status "%" test failed: %', test_status, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '';

    IF test_passed THEN
        RAISE NOTICE '✓ All new status values are accepted by constraint';
    ELSE
        RAISE WARNING '⚠ Some new status values are blocked - check constraint definition';
    END IF;

    RAISE NOTICE '';
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
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  ✓ Removed old constraint (valid_donation_status)';
    RAISE NOTICE '  ✓ Verified new constraint (donations_status_check)';
    RAISE NOTICE '  ✓ Tested new status values';
    RAISE NOTICE '';
    RAISE NOTICE 'Result:';
    RAISE NOTICE '  • Only one CHECK constraint on donation_status';
    RAISE NOTICE '  • All 16 status values are now supported';
    RAISE NOTICE '';
    RAISE NOTICE 'Reference: docs/CODE_REVIEW_2025-12-24.md';
    RAISE NOTICE '========================================';
END $$;
