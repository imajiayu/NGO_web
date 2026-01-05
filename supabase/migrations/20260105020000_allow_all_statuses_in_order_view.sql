-- =============================================================================================================
-- Enhancement: Allow All Donation Statuses in order_donations_secure View
-- =============================================================================================================
-- Description: Remove status filter to allow querying donations in any status
--
-- Reason:
--   Currently the view only includes specific statuses (pending, paid, completed, etc.)
--   but excludes failed payment statuses (widget_load_failed, expired, declined, failed).
--   Users should be able to see ALL their donations regardless of status on the success page.
--
-- Current Missing Statuses:
--   - widget_load_failed (payment widget failed to load)
--   - expired (payment session expired)
--   - declined (bank declined payment)
--   - failed (other payment failures)
--
-- Solution:
--   Remove the status filter from WHERE clause.
--   Only keep order_reference validation for security.
--
-- Security:
--   ✅ Email still obfuscated
--   ✅ Donor name still excluded
--   ✅ order_reference as secure identifier (users only get this after initiating payment)
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
  p.unit_name_i18n,
  p.aggregate_donations  -- For proper display logic in success page
FROM
  public.donations d
  INNER JOIN public.projects p ON d.project_id = p.id
WHERE
  -- REMOVED: Status filter - now accepts ALL statuses
  -- This allows users to see failed payments, expired sessions, etc.

  -- Order reference must exist (acts as secure identifier)
  d.order_reference IS NOT NULL
  AND d.order_reference != '';

-- =============================================
-- UPDATE COMMENT
-- =============================================

COMMENT ON VIEW public.order_donations_secure IS
'Secure view for querying donations by order_reference.
Returns obfuscated email addresses and excludes donor names for privacy.
Used by public API endpoint /api/donations/order/[orderReference].
NOW INCLUDES ALL DONATION STATUSES - no status filter applied.
All 15 possible statuses are visible: pending, widget_load_failed, processing,
fraud_check, paid, confirmed, delivering, completed, expired, declined, failed,
refunding, refund_processing, refunded.
Includes aggregate_donations flag for proper UI display.';

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
  RAISE NOTICE 'Enhancement:';
  RAISE NOTICE '  ✓ Removed status filter';
  RAISE NOTICE '  ✓ Now accepts ALL 15 donation statuses';
  RAISE NOTICE '';
  RAISE NOTICE 'New Visible Statuses:';
  RAISE NOTICE '  + widget_load_failed (widget error)';
  RAISE NOTICE '  + expired (payment timeout)';
  RAISE NOTICE '  + declined (bank declined)';
  RAISE NOTICE '  + failed (other failures)';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefit:';
  RAISE NOTICE '  Users can now see complete order history';
  RAISE NOTICE '  including failed payment attempts';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ Email still obfuscated';
  RAISE NOTICE '  ✓ Donor name still excluded';
  RAISE NOTICE '  ✓ order_reference as secure identifier';
  RAISE NOTICE '========================================';
END $$;
