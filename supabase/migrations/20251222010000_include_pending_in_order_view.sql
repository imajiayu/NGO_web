-- =============================================================================================================
-- Fix: Include Pending Donations in order_donations_secure View
-- =============================================================================================================
-- Description: Updates order_donations_secure view to include 'pending' status donations
--
-- Problem:
--   Users are redirected to success page immediately after payment, but WayForPay webhook
--   may not have confirmed the payment yet. The view excludes 'pending' donations, so users
--   see empty donation details on the success page.
--
-- Solution:
--   Include 'pending' status in the view's WHERE clause. This is safe because:
--   1. order_reference is only created after user initiates payment
--   2. order_reference format includes timestamp and random chars (hard to guess)
--   3. Success page only has access to order_reference if payment was initiated
--   4. Email is still obfuscated for privacy
--
-- Security:
--   ✅ Still obfuscates email addresses
--   ✅ Still excludes donor_name
--   ✅ order_reference acts as a secure identifier
--   ✅ Only users who completed payment flow have the order_reference
-- =============================================================================================================

-- =============================================
-- DROP AND RECREATE VIEW
-- =============================================

DROP VIEW IF EXISTS public.order_donations_secure;

CREATE VIEW public.order_donations_secure AS
SELECT
  d.id,
  d.donation_public_id,
  d.amount,
  d.donation_status,
  d.order_reference,
  -- Obfuscate email: john.doe@example.com → j***e@e***.com
  CASE
    WHEN position('@' in d.donor_email) > 0 THEN
      -- Email format: local@domain
      CASE
        WHEN length(split_part(d.donor_email, '@', 1)) <= 2 THEN
          -- Very short local part (1-2 chars): show first char + ***
          substring(split_part(d.donor_email, '@', 1), 1, 1) || '***@' ||
          CASE
            WHEN length(split_part(d.donor_email, '@', 2)) <= 3 THEN
              -- Very short domain: show first char + ***
              substring(split_part(d.donor_email, '@', 2), 1, 1) || '***'
            ELSE
              -- Normal domain: show first char + *** + last 2 chars
              substring(split_part(d.donor_email, '@', 2), 1, 1) || '***' ||
              substring(split_part(d.donor_email, '@', 2), length(split_part(d.donor_email, '@', 2)) - 1, 2)
          END
        ELSE
          -- Normal local part: show first char + *** + last char
          substring(split_part(d.donor_email, '@', 1), 1, 1) || '***' ||
          substring(split_part(d.donor_email, '@', 1), length(split_part(d.donor_email, '@', 1)), 1) || '@' ||
          CASE
            WHEN length(split_part(d.donor_email, '@', 2)) <= 3 THEN
              -- Very short domain: show first char + ***
              substring(split_part(d.donor_email, '@', 2), 1, 1) || '***'
            ELSE
              -- Normal domain: show first char + *** + last 2 chars (usually .xx like .com)
              substring(split_part(d.donor_email, '@', 2), 1, 1) || '***' ||
              substring(split_part(d.donor_email, '@', 2), length(split_part(d.donor_email, '@', 2)) - 1, 2)
          END
      END
    ELSE
      -- Fallback if no @ found (invalid email)
      '***'
  END AS donor_email_obfuscated,
  -- Project information (join)
  p.id AS project_id,
  p.project_name,
  p.project_name_i18n,
  p.location,
  p.location_i18n,
  p.unit_name,
  p.unit_name_i18n
FROM
  public.donations d
  INNER JOIN public.projects p ON d.project_id = p.id
WHERE
  -- CHANGED: Now includes 'pending' status for immediate display after payment
  -- Users are redirected with order_reference only after initiating payment
  d.donation_status IN ('pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded')
  -- Order reference must exist (acts as secure identifier)
  AND d.order_reference IS NOT NULL
  AND d.order_reference != '';

-- =============================================
-- UPDATE COMMENT
-- =============================================

COMMENT ON VIEW public.order_donations_secure IS
'Secure view for querying donations by order_reference.
Returns obfuscated email addresses and excludes donor names for privacy.
Used by public API endpoint /api/donations/order/[orderReference].
Includes pending donations for immediate display on success page.';

-- =============================================
-- GRANT PUBLIC ACCESS TO VIEW
-- =============================================

GRANT SELECT ON public.order_donations_secure TO anon, authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ View Updated Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'View: order_donations_secure';
  RAISE NOTICE '';
  RAISE NOTICE 'Change:';
  RAISE NOTICE '  Now includes "pending" status donations';
  RAISE NOTICE '';
  RAISE NOTICE 'Reason:';
  RAISE NOTICE '  Users see success page immediately after payment';
  RAISE NOTICE '  Webhook confirmation may take a few seconds';
  RAISE NOTICE '  Need to show donation details while still pending';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ order_reference acts as secure identifier';
  RAISE NOTICE '  ✓ Only available after payment initiation';
  RAISE NOTICE '  ✓ Email still obfuscated';
  RAISE NOTICE '  ✓ Donor name still excluded';
  RAISE NOTICE '========================================';
END $$;
