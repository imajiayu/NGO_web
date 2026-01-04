-- =============================================================================================================
-- Fix: Add Missing Payment Statuses to order_donations_secure View
-- =============================================================================================================
-- Description: Adds 'processing', 'fraud_check', and 'refund_processing' statuses to the view
--
-- Problem:
--   When user completes payment and is redirected to success page, WayForPay webhook may have
--   already updated the donation status from 'pending' to 'processing' or 'fraud_check'.
--   These statuses were missing from the view, causing the success page to show no donation details.
--
-- WayForPay Status Mapping (from webhook handler):
--   - PENDING → fraud_check (anti-fraud verification)
--   - IN_PROCESSING → processing (gateway processing)
--   - REFUND_IN_PROCESSING → refund_processing
--
-- Solution:
--   Include all intermediate payment statuses in the view:
--   - pending (initial)
--   - processing (gateway processing)
--   - fraud_check (anti-fraud check)
--   - paid (success)
--   - confirmed, delivering, completed (fulfillment)
--   - refunding, refund_processing, refunded (refund flow)
--
-- Security:
--   ✅ Still obfuscates email addresses
--   ✅ Still excludes donor_name
--   ✅ order_reference acts as secure identifier
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
  -- Include all payment flow statuses for success page display
  -- ADDED: 'processing', 'fraud_check', 'refund_processing'
  d.donation_status IN (
    'pending',           -- Initial state (just created)
    'processing',        -- NEW: Gateway is processing payment
    'fraud_check',       -- NEW: Anti-fraud verification in progress
    'paid',              -- Payment confirmed
    'confirmed',         -- NGO confirmed receipt
    'delivering',        -- Physical delivery in progress
    'completed',         -- Delivery completed
    'refunding',         -- Refund requested
    'refund_processing', -- NEW: Refund being processed
    'refunded'           -- Refund completed
  )
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
Includes all payment flow statuses: pending, processing, fraud_check, paid,
confirmed, delivering, completed, refunding, refund_processing, refunded.';

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
  RAISE NOTICE 'Bug Fixed:';
  RAISE NOTICE '  Success page showing empty when status is';
  RAISE NOTICE '  "processing" or "fraud_check"';
  RAISE NOTICE '';
  RAISE NOTICE 'Added Statuses:';
  RAISE NOTICE '  + processing (gateway processing)';
  RAISE NOTICE '  + fraud_check (anti-fraud verification)';
  RAISE NOTICE '  + refund_processing (refund in progress)';
  RAISE NOTICE '';
  RAISE NOTICE 'All Included Statuses:';
  RAISE NOTICE '  pending, processing, fraud_check, paid,';
  RAISE NOTICE '  confirmed, delivering, completed,';
  RAISE NOTICE '  refunding, refund_processing, refunded';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ Email still obfuscated';
  RAISE NOTICE '  ✓ Donor name still excluded';
  RAISE NOTICE '  ✓ order_reference as secure identifier';
  RAISE NOTICE '========================================';
END $$;
