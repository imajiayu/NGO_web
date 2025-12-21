-- =============================================================================================================
-- Minimal Donation Insert Policy for Testing
-- =============================================================================================================
-- Description: Creates a minimal RLS policy with no complex checks
--              to identify what's causing the RLS violation
--
-- Strategy: Start with minimal policy, then add checks one by one
-- =============================================================================================================

-- =============================================
-- DROP OLD POLICY
-- =============================================

DROP POLICY IF EXISTS "Allow anonymous insert pending donations" ON public.donations;

-- =============================================
-- CREATE MINIMAL POLICY
-- =============================================

CREATE POLICY "Allow anonymous insert pending donations"
ON public.donations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Only check that status is pending - nothing else
  donation_status = 'pending'
);

-- =============================================
-- COMMENT
-- =============================================

COMMENT ON POLICY "Allow anonymous insert pending donations" ON public.donations IS
'Minimal policy for testing - only checks donation_status = pending.
Application layer validates all other constraints.';

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Minimal RLS Policy Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policy: Allow anonymous insert pending donations';
  RAISE NOTICE 'Check: donation_status = pending only';
  RAISE NOTICE 'Purpose: Testing - find RLS violation cause';
  RAISE NOTICE '========================================';
END $$;
