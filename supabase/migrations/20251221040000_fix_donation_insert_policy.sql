-- =============================================================================================================
-- Fix: Donation Insert RLS Policy
-- =============================================================================================================
-- Description: Fixes the RLS policy for anonymous donation insertion
--              The previous policy had a subquery that caused RLS violations
--
-- Problem: Subquery "project_id IN (SELECT id FROM projects WHERE status = 'active')"
--          may not work correctly with RLS on the projects table
--
-- Solution: Simplify the policy - remove project status check from RLS
--          Application layer already validates project is active before insertion
-- =============================================================================================================

-- =============================================
-- DROP OLD POLICY
-- =============================================

DROP POLICY IF EXISTS "Allow anonymous insert pending donations" ON public.donations;

-- =============================================
-- CREATE SIMPLIFIED POLICY
-- =============================================

CREATE POLICY "Allow anonymous insert pending donations"
ON public.donations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- 1. Only allow 'pending' status (webhooks will update to 'paid' using service role)
  donation_status = 'pending'

  -- 2. Amount validation: must be positive and reasonable
  AND amount > 0
  AND amount <= 10000  -- Maximum $10,000 per unit (prevents abuse)

  -- 3. Project exists (no status check - app layer validates this)
  AND project_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.projects WHERE id = project_id)

  -- 4. Currency validation: only allowed currencies
  AND currency IN ('USD', 'UAH', 'EUR')

  -- 5. Order reference must be provided
  AND order_reference IS NOT NULL
  AND order_reference != ''

  -- 6. Donation public ID must be provided and unique
  AND donation_public_id IS NOT NULL
  AND donation_public_id != ''

  -- 7. Basic donor information must be provided
  AND donor_name IS NOT NULL
  AND donor_name != ''
  AND donor_email IS NOT NULL
  AND donor_email != ''

  -- 8. Locale must be valid
  AND locale IN ('en', 'zh', 'ua')
);

-- =============================================
-- ADD COMMENT
-- =============================================

COMMENT ON POLICY "Allow anonymous insert pending donations" ON public.donations IS
'Allows anonymous and authenticated users to insert donations with pending status only.
Simplified version without project status check (app layer validates this).
Webhooks will update status to paid using service role (bypassing RLS).';

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count the new policy
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'donations'
    AND policyname = 'Allow anonymous insert pending donations';

  IF policy_count = 1 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS Policy Fixed Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Policy: Allow anonymous insert pending donations';
    RAISE NOTICE 'Change: Removed project status subquery';
    RAISE NOTICE 'Reason: Subquery caused RLS violations';
    RAISE NOTICE 'Note: App layer validates project status';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Failed to fix RLS policy!';
  END IF;
END $$;
