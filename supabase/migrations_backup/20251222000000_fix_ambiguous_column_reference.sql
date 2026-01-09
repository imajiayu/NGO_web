-- =============================================================================================================
-- Fix: Ambiguous Column Reference in get_donations_by_email_verified
-- =============================================================================================================
-- Description: Fixes the ambiguous column reference error in get_donations_by_email_verified function
-- Error: column reference "donation_public_id" is ambiguous (PostgreSQL error code 42702)
-- Cause: donation_public_id could refer to either:
--        1. The column donations.donation_public_id
--        2. The output parameter donation_public_id from RETURNS TABLE
-- Solution: Add table aliases and qualify all column references
-- =============================================================================================================

-- =============================================
-- DROP AND RECREATE FUNCTION WITH FIX
-- =============================================

DROP FUNCTION IF EXISTS get_donations_by_email_verified(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_donations_by_email_verified(
  p_email TEXT,
  p_donation_id TEXT
)
RETURNS TABLE (
  id BIGINT,
  donation_public_id VARCHAR(50),
  project_id BIGINT,
  donor_email VARCHAR(255),
  amount NUMERIC(10,2),
  currency VARCHAR(10),
  donation_status VARCHAR(20),
  donated_at TIMESTAMPTZ,
  project_name VARCHAR(255),
  project_name_i18n JSONB,
  location VARCHAR(255),
  location_i18n JSONB,
  unit_name VARCHAR(50),
  unit_name_i18n JSONB
)
SECURITY DEFINER -- Run with function owner's permissions (bypasses RLS)
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Step 1: Verify that the donation ID belongs to the provided email
  -- This prevents enumeration attacks - must know both email AND a valid donation ID
  -- FIX: Use table alias 'verify' and qualify column references
  IF NOT EXISTS (
    SELECT 1
    FROM donations verify
    WHERE verify.donation_public_id = p_donation_id
      AND LOWER(verify.donor_email) = LOWER(p_email)
  ) THEN
    -- If verification fails, return empty result (don't reveal why)
    RETURN;
  END IF;

  -- Step 2: If verified, return all donations for this email
  -- Join with projects to get project information
  -- FIX: Use table aliases 'd' and 'p' and qualify all column references
  RETURN QUERY
  SELECT
    d.id,
    d.donation_public_id,
    d.project_id,
    d.donor_email,
    d.amount,
    d.currency,
    d.donation_status,
    d.donated_at,
    p.project_name,
    p.project_name_i18n,
    p.location,
    p.location_i18n,
    p.unit_name,
    p.unit_name_i18n
  FROM donations d
  INNER JOIN projects p ON d.project_id = p.id
  WHERE LOWER(d.donor_email) = LOWER(p_email)
  ORDER BY d.donated_at DESC;
END;
$$;

-- =============================================
-- COMMENT AND PERMISSIONS
-- =============================================

COMMENT ON FUNCTION get_donations_by_email_verified(TEXT, TEXT) IS
'Securely retrieves all donations for an email address after verifying ownership.
Requires both email and a valid donation ID to prevent enumeration attacks.
Used by track donation feature. Returns full email (user already knows it).
Fixed: Ambiguous column reference by adding table aliases.';

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_donations_by_email_verified(TEXT, TEXT) TO anon, authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Fixed Ambiguous Column Reference!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Function: get_donations_by_email_verified';
  RAISE NOTICE 'Issue: Column reference "donation_public_id" was ambiguous';
  RAISE NOTICE 'Fix: Added table aliases and qualified all column references';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Verification query: Added alias "verify"';
  RAISE NOTICE '  - Main query: Using aliases "d" and "p"';
  RAISE NOTICE '  - All columns now properly qualified';
  RAISE NOTICE '========================================';
END $$;
