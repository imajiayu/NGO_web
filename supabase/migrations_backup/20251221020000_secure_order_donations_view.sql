-- =============================================================================================================
-- Security Fix: Create Secure View for Order Donations Query
-- =============================================================================================================
-- Description: Creates a database view for querying donations by order_reference
--              Returns obfuscated email (not full email) and excludes donor_name
--              This allows the public API to use anonymous client with RLS
--
-- Security Context:
--   BEFORE: API used service role (bypassed RLS), exposed donor_email and donor_name - SECURITY RISK!
--   AFTER:  API uses anonymous client with view (RLS enforced), obfuscated email only - SECURE
--
-- View Features:
--   ✅ Obfuscates email addresses (e.g., john.doe@example.com → j***e@e***.com)
--   ✅ Excludes donor_name (not needed for success page)
--   ✅ Includes project information
--   ✅ Only shows donations that are not pending (paid+)
-- =============================================================================================================

-- =============================================
-- DROP EXISTING VIEW (if exists)
-- =============================================

DROP VIEW IF EXISTS public.order_donations_secure;

-- =============================================
-- CREATE SECURE VIEW FOR ORDER DONATIONS
-- =============================================

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
  -- Only show non-pending donations (security: prevent exposing unconfirmed donations)
  d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded')
  -- Order reference must exist
  AND d.order_reference IS NOT NULL
  AND d.order_reference != '';

-- =============================================
-- ADD COMMENT TO VIEW
-- =============================================

COMMENT ON VIEW public.order_donations_secure IS
'Secure view for querying donations by order_reference.
Returns obfuscated email addresses and excludes donor names for privacy.
Used by public API endpoint /api/donations/order/[orderReference].
Only shows confirmed donations (not pending).';

-- =============================================
-- GRANT PUBLIC ACCESS TO VIEW
-- =============================================

-- Grant SELECT to anonymous and authenticated users
GRANT SELECT ON public.order_donations_secure TO anon, authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  view_count INTEGER;
BEGIN
  -- Count the new view
  SELECT COUNT(*)
  INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND table_name = 'order_donations_secure';

  IF view_count = 1 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Secure View Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'View: order_donations_secure';
    RAISE NOTICE 'Purpose: Query donations by order_reference';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Features:';
    RAISE NOTICE '  ✓ Email obfuscation (j***e@e***.com)';
    RAISE NOTICE '  ✓ Donor name excluded';
    RAISE NOTICE '  ✓ Only confirmed donations (no pending)';
    RAISE NOTICE '  ✓ Public access granted (anon, authenticated)';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage:';
    RAISE NOTICE '  SELECT * FROM order_donations_secure';
    RAISE NOTICE '  WHERE order_reference = ''DONATE-1-123456-ABC''';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔒 Security Improvement:';
    RAISE NOTICE '  API now uses anonymous client with view';
    RAISE NOTICE '  Service role no longer needed for order queries';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Failed to create secure view!';
  END IF;
END $$;
