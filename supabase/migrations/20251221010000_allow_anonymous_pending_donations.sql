-- =============================================================================================================
-- Security Fix: Allow Anonymous Insert for Pending Donations
-- =============================================================================================================
-- Description: Adds RLS policy to allow anonymous users to create pending donations
--              This replaces the previous insecure pattern of using service role in Server Actions
--
-- Security Context:
--   BEFORE: Server Actions used service role client (bypassed ALL RLS) - SECURITY RISK!
--   AFTER:  Server Actions use anonymous client (RLS enforced) - SECURE
--
-- Policy Constraints:
--   1. Only 'pending' status allowed (webhooks use service role to update to 'paid')
--   2. Amount must be positive and <= $10,000 (prevent abuse)
--   3. Project must exist and be 'active'
--   4. Currency must be valid (USD, UAH, EUR)
-- =============================================================================================================

-- =============================================
-- DROP EXISTING INSERT POLICY (if any)
-- =============================================

DROP POLICY IF EXISTS "Service role can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Allow anonymous insert pending donations" ON public.donations;

-- =============================================
-- CREATE NEW SECURE INSERT POLICY
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

  -- 3. Project validation: must exist and be active
  AND project_id IN (
    SELECT id FROM public.projects WHERE status = 'active'
  )

  -- 4. Currency validation: only allowed currencies
  AND currency IN ('USD', 'UAH', 'EUR')

  -- 5. Order reference must be provided (format: DONATE-{project_id}-{timestamp}-{random})
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
-- ADD COMMENT TO POLICY
-- =============================================

COMMENT ON POLICY "Allow anonymous insert pending donations" ON public.donations IS
'Allows anonymous and authenticated users to insert donations with pending status only.
This is used by the donation form Server Action to create pending donations.
Webhooks will update status to paid using service role (bypassing RLS).
Constraints enforce security: amount limits, active projects only, valid currencies.';

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
    RAISE NOTICE '✅ RLS Policy Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Policy: Allow anonymous insert pending donations';
    RAISE NOTICE 'Applies to: anon, authenticated roles';
    RAISE NOTICE 'Operation: INSERT';
    RAISE NOTICE 'Constraints:';
    RAISE NOTICE '  - Status must be "pending"';
    RAISE NOTICE '  - Amount: 0 < amount <= 10000';
    RAISE NOTICE '  - Project must be active';
    RAISE NOTICE '  - Currency: USD, UAH, EUR only';
    RAISE NOTICE '  - Required fields validated';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔒 Security Improvement:';
    RAISE NOTICE '  Server Actions now use anonymous client (RLS enforced)';
    RAISE NOTICE '  Service role limited to webhooks only';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Failed to create RLS policy!';
  END IF;
END $$;
