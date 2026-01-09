-- =============================================================================================================
-- Remove user_cancelled Status from Donation Status Constraint
-- =============================================================================================================
-- Description:
--   Removes 'user_cancelled' from valid donation statuses.
--
-- Rationale:
--   - WayForPay widget does not reliably trigger callbacks when user closes payment window
--   - Cannot accurately detect when user cancels payment on client side
--   - WayForPay sends 'Expired' webhook after timeout, which is the authoritative cancellation signal
--   - Keeping pending status until WayForPay expires it is more reliable
--
-- Status Changes:
--   REMOVED:
--     - user_cancelled (unreliable client-side detection)
--
--   KEPT:
--     - widget_load_failed (script load failure is detectable)
--     - expired (WayForPay sends webhook when payment times out)
--
-- Impact:
--   - Donations that fail to complete will stay 'pending' until WayForPay expires them
--   - This is the same behavior as official WayForPay integration examples
--
-- Date: 2025-12-24
-- Version: 1.1
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Removing user_cancelled status...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PART 1: UPDATE RLS POLICY
-- =============================================================================================================

-- Remove the old policy that allowed updating to both user_cancelled and widget_load_failed
DROP POLICY IF EXISTS "Allow anonymous update pending to failed" ON public.donations;

DO $$
BEGIN
    RAISE NOTICE '✓ Dropped old RLS policy (allowed user_cancelled and widget_load_failed)';
END $$;

-- Create new policy that only allows updating to widget_load_failed
CREATE POLICY "Allow anonymous update pending to widget_load_failed"
ON public.donations
FOR UPDATE
TO anon, authenticated
USING (
  -- Can only update donations that are currently in 'pending' status
  donation_status = 'pending'
)
WITH CHECK (
  -- Can only update TO widget_load_failed (removed user_cancelled)
  donation_status = 'widget_load_failed'
);

DO $$
BEGIN
    RAISE NOTICE '✓ Created new RLS policy (only allows widget_load_failed)';
END $$;

-- =============================================================================================================
-- PART 2: UPDATE CHECK CONSTRAINT
-- =============================================================================================================

-- Drop existing constraint
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS donations_status_check;

-- Add new CHECK constraint WITHOUT user_cancelled
ALTER TABLE public.donations
ADD CONSTRAINT donations_status_check CHECK (
  donation_status IN (
    -- Pre-payment
    'pending',
    'widget_load_failed',
    -- REMOVED: 'user_cancelled' - unreliable detection

    -- Processing
    'processing',
    'fraud_check',

    -- Payment complete
    'paid',
    'confirmed',
    'delivering',
    'completed',

    -- Payment failed
    'expired',
    'declined',
    'failed',

    -- Refund
    'refunding',
    'refund_processing',
    'refunded'
  )
);

DO $$
BEGIN
    RAISE NOTICE '✓ Updated CHECK constraint (removed user_cancelled)';
END $$;

-- =============================================================================================================
-- PART 3: MIGRATE EXISTING DATA
-- =============================================================================================================

DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migrating existing user_cancelled records...';
    RAISE NOTICE '========================================';

    -- Check if any records have user_cancelled status
    SELECT COUNT(*) INTO affected_count
    FROM public.donations
    WHERE donation_status = 'user_cancelled';

    IF affected_count > 0 THEN
        RAISE NOTICE 'Found % records with user_cancelled status', affected_count;

        -- Update user_cancelled to expired (most semantically similar)
        UPDATE public.donations
        SET donation_status = 'expired'
        WHERE donation_status = 'user_cancelled';

        RAISE NOTICE '✓ Migrated % records from user_cancelled → expired', affected_count;
    ELSE
        RAISE NOTICE '✓ No user_cancelled records found, no migration needed';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PART 4: ADD UPDATED COMMENT
-- =============================================================================================================

COMMENT ON CONSTRAINT donations_status_check ON public.donations IS
'Enforces valid donation status values (15 total, removed user_cancelled due to unreliable detection).
WayForPay Expired webhook is the authoritative signal for payment timeout.
See docs/PAYMENT_WORKFLOW.md for status definitions and transitions.';

DO $$
BEGIN
    RAISE NOTICE '✓ Updated documentation comment';
END $$;

-- =============================================================================================================
-- PART 5: VERIFICATION
-- =============================================================================================================

DO $$
DECLARE
    constraint_exists BOOLEAN;
    policy_exists BOOLEAN;
    invalid_count INTEGER;
    valid_statuses TEXT[];
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifying changes...';
    RAISE NOTICE '========================================';

    -- Check constraint
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'donations_status_check'
          AND table_name = 'donations'
          AND table_schema = 'public'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RAISE NOTICE '✓ Constraint donations_status_check exists';
    ELSE
        RAISE WARNING '⚠ Constraint not found';
    END IF;

    -- Check old policy was removed
    SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'donations'
          AND policyname = 'Allow anonymous update pending to failed'
    ) INTO policy_exists;

    IF NOT policy_exists THEN
        RAISE NOTICE '✓ Old RLS policy successfully removed';
    ELSE
        RAISE WARNING '⚠ Old RLS policy still exists';
    END IF;

    -- Check new policy was created
    SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'donations'
          AND policyname = 'Allow anonymous update pending to widget_load_failed'
    ) INTO policy_exists;

    IF policy_exists THEN
        RAISE NOTICE '✓ New RLS policy successfully created';
    ELSE
        RAISE WARNING '⚠ New RLS policy not found';
    END IF;

    -- List all valid statuses
    valid_statuses := ARRAY[
        'pending', 'widget_load_failed',
        'processing', 'fraud_check',
        'paid', 'confirmed', 'delivering', 'completed',
        'expired', 'declined', 'failed',
        'refunding', 'refund_processing', 'refunded'
    ];

    RAISE NOTICE '';
    RAISE NOTICE 'Valid donation status values (% total):', array_length(valid_statuses, 1);
    FOR i IN 1..array_length(valid_statuses, 1) LOOP
        RAISE NOTICE '  % %',
            LPAD(i::TEXT, 2, ' '),
            valid_statuses[i];
    END LOOP;

    -- Verify no invalid statuses remain
    SELECT COUNT(*) INTO invalid_count
    FROM public.donations
    WHERE donation_status NOT IN (
        'pending', 'widget_load_failed',
        'processing', 'fraud_check',
        'paid', 'confirmed', 'delivering', 'completed',
        'expired', 'declined', 'failed',
        'refunding', 'refund_processing', 'refunded'
    );

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠ Found % records with invalid status!', invalid_count;
    ELSE
        RAISE NOTICE '✓ All records have valid status values';
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
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  ✓ Removed user_cancelled from valid statuses';
    RAISE NOTICE '  ✓ Dropped old RLS policy (user_cancelled + widget_load_failed)';
    RAISE NOTICE '  ✓ Created new RLS policy (widget_load_failed only)';
    RAISE NOTICE '  ✓ Migrated existing user_cancelled records to expired';
    RAISE NOTICE '  ✓ Total valid statuses: 15 (was 16)';
    RAISE NOTICE '';
    RAISE NOTICE 'Removed Status:';
    RAISE NOTICE '  ✗ user_cancelled - unreliable client-side detection';
    RAISE NOTICE '';
    RAISE NOTICE 'Alternative Approach:';
    RAISE NOTICE '  → Pending donations stay "pending" until WayForPay expires them';
    RAISE NOTICE '  → WayForPay sends "Expired" webhook (authoritative)';
    RAISE NOTICE '  → widget_load_failed still available for script errors';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Update TypeScript types (remove user_cancelled)';
    RAISE NOTICE '  2. Remove user_cancelled from client code';
    RAISE NOTICE '  3. Regenerate database types: npx supabase gen types typescript';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
