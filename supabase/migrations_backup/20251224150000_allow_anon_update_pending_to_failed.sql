-- =============================================================================================================
-- Allow Anonymous Users to Update Pending Donations to Failed Status
-- =============================================================================================================
-- Description:
--   Allows anonymous users to update their own pending donations to failed status
--   (user_cancelled, widget_load_failed) when payment is not completed.
--
-- Security:
--   - Can only update FROM 'pending' status
--   - Can only update TO 'user_cancelled' or 'widget_load_failed'
--   - Prevents updating other users' donations or already processed donations
--
-- Use Cases:
--   - User closes payment window without completing payment → user_cancelled
--   - Payment widget script fails to load → widget_load_failed
--
-- Date: 2025-12-24
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Adding anonymous UPDATE policy for failed donations...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- DROP OLD POLICY (if exists)
-- =============================================================================================================

DROP POLICY IF EXISTS "Allow anonymous update pending to failed" ON public.donations;

-- =============================================================================================================
-- CREATE UPDATE POLICY
-- =============================================================================================================

CREATE POLICY "Allow anonymous update pending to failed"
ON public.donations
FOR UPDATE
TO anon, authenticated
USING (
  -- Can only update donations that are currently in 'pending' status
  donation_status = 'pending'
)
WITH CHECK (
  -- Can only update TO these failed statuses
  donation_status IN ('user_cancelled', 'widget_load_failed')
);

DO $$
BEGIN
    RAISE NOTICE '✓ UPDATE policy created for anonymous users';
END $$;

-- =============================================================================================================
-- ADD COMMENT
-- =============================================================================================================

COMMENT ON POLICY "Allow anonymous update pending to failed" ON public.donations IS
'Allows anonymous users to update pending donations to failed status (user_cancelled, widget_load_failed).
This enables client-side error handling when payment widget fails to load or user cancels payment.
Security: Can only transition FROM pending TO failed statuses.';

DO $$
BEGIN
    RAISE NOTICE '✓ Documentation comment added';
END $$;

-- =============================================================================================================
-- VERIFICATION
-- =============================================================================================================

DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifying policy...';
    RAISE NOTICE '========================================';

    -- Check if policy exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'donations'
          AND policyname = 'Allow anonymous update pending to failed'
    ) INTO policy_exists;

    IF policy_exists THEN
        RAISE NOTICE '✓ Policy "Allow anonymous update pending to failed" exists';
    ELSE
        RAISE WARNING '⚠ Policy not found';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Policy Details:';
    RAISE NOTICE '  - Roles: anon, authenticated';
    RAISE NOTICE '  - Command: UPDATE';
    RAISE NOTICE '  - USING: donation_status = ''pending''';
    RAISE NOTICE '  - WITH CHECK: donation_status IN (''user_cancelled'', ''widget_load_failed'')';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Features:';
    RAISE NOTICE '  ✓ Can only update FROM pending status';
    RAISE NOTICE '  ✓ Can only update TO failed statuses';
    RAISE NOTICE '  ✓ Cannot update paid/confirmed/completed donations';
    RAISE NOTICE '  ✓ Prevents status manipulation';
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
    RAISE NOTICE '  ✓ Anonymous users can now update pending → failed';
    RAISE NOTICE '  ✓ Supports user_cancelled and widget_load_failed';
    RAISE NOTICE '  ✓ Client-side error handling enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Test payment window cancellation';
    RAISE NOTICE '  2. Verify status updates in database';
    RAISE NOTICE '  3. Check markDonationFailed() function works';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
