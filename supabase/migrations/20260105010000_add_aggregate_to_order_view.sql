-- =============================================================================================================
-- Enhancement: Add aggregate_donations to order_donations_secure View
-- =============================================================================================================
-- Description: Adds p.aggregate_donations field to the view for proper display in success page
--
-- Reason:
--   The success page needs to know if a project is an aggregate project (打赏模式) to:
--   1. Hide "quantity" display for aggregate donations (showing "1 unit" is meaningless)
--   2. Display individual donation records instead of aggregating by quantity
--   3. Show total amount for all donations in the order
--
-- Changes:
--   ✅ Add p.aggregate_donations to SELECT clause
--   ✅ Maintain all existing security measures (email obfuscation, etc.)
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
  p.aggregate_donations  -- NEW: For proper display logic in success page
FROM
  public.donations d
  INNER JOIN public.projects p ON d.project_id = p.id
WHERE
  -- Include all payment flow statuses for success page display
  d.donation_status IN (
    'pending',           -- Initial state (just created)
    'processing',        -- Gateway is processing payment
    'fraud_check',       -- Anti-fraud verification in progress
    'paid',              -- Payment confirmed
    'confirmed',         -- NGO confirmed receipt
    'delivering',        -- Physical delivery in progress
    'completed',         -- Delivery completed
    'refunding',         -- Refund requested
    'refund_processing', -- Refund being processed
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
confirmed, delivering, completed, refunding, refund_processing, refunded.
NEW: Includes aggregate_donations flag for proper UI display.';

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
  RAISE NOTICE '  + Added p.aggregate_donations field';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefit:';
  RAISE NOTICE '  Success page can now:';
  RAISE NOTICE '  - Detect aggregate projects (打赏模式)';
  RAISE NOTICE '  - Hide quantity for aggregate donations';
  RAISE NOTICE '  - Display all donation records properly';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ Email still obfuscated';
  RAISE NOTICE '  ✓ Donor name still excluded';
  RAISE NOTICE '  ✓ order_reference as secure identifier';
  RAISE NOTICE '========================================';
END $$;
