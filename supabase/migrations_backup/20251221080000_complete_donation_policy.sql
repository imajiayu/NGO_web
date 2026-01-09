-- =============================================================================================================
-- Complete Donation Insert Policy
-- =============================================================================================================
-- Description: Adds back all safe constraints to the INSERT policy
--              Excludes any subqueries that might cause RLS violations
-- =============================================================================================================

-- =============================================
-- DROP OLD POLICY
-- =============================================

DROP POLICY IF EXISTS "Allow anonymous insert pending donations" ON public.donations;

-- =============================================
-- CREATE COMPLETE POLICY
-- =============================================

CREATE POLICY "Allow anonymous insert pending donations"
ON public.donations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- 1. Only allow 'pending' status
  donation_status = 'pending'

  -- 2. Amount validation
  AND amount > 0
  AND amount <= 10000

  -- 3. Currency validation
  AND currency IN ('USD', 'UAH', 'EUR')

  -- 4. Order reference must be provided
  AND order_reference IS NOT NULL
  AND order_reference != ''

  -- 5. Donation public ID must be provided
  AND donation_public_id IS NOT NULL
  AND donation_public_id != ''

  -- 6. Donor information must be provided
  AND donor_name IS NOT NULL
  AND donor_name != ''
  AND donor_email IS NOT NULL
  AND donor_email != ''
  AND donor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'  -- Email format validation

  -- 7. Locale must be valid
  AND locale IN ('en', 'zh', 'ua')

  -- 8. Project ID must be provided (existence checked by foreign key constraint)
  AND project_id IS NOT NULL
);

-- =============================================
-- COMMENT
-- =============================================

COMMENT ON POLICY "Allow anonymous insert pending donations" ON public.donations IS
'Complete policy with all safe validations.
Foreign key constraint ensures project exists.
Application layer validates project status.';

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Complete Donation Policy Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Validations:';
  RAISE NOTICE '  ✓ Status = pending';
  RAISE NOTICE '  ✓ Amount: 0 < x <= 10000';
  RAISE NOTICE '  ✓ Currency: USD/UAH/EUR';
  RAISE NOTICE '  ✓ Email format validation';
  RAISE NOTICE '  ✓ All required fields';
  RAISE NOTICE '  ✓ Valid locale';
  RAISE NOTICE '========================================';
END $$;
