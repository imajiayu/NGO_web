-- =============================================================================================================
-- Add order_reference to get_donations_by_email_verified Function
-- =============================================================================================================
-- Purpose: Return order_reference field so frontend can group donations by order
--          This is needed for the order-grouped UI display
-- =============================================================================================================

DROP FUNCTION IF EXISTS get_donations_by_email_verified(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_donations_by_email_verified(
  p_email TEXT,
  p_donation_id TEXT
)
RETURNS TABLE (
  id BIGINT,
  donation_public_id VARCHAR(50),
  order_reference VARCHAR(255),  -- ✨ NEW: Add order_reference field
  project_id BIGINT,
  donor_email VARCHAR(255),
  amount NUMERIC(10,2),
  currency VARCHAR(10),
  donation_status VARCHAR(20),
  donated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  project_name VARCHAR(255),
  project_name_i18n JSONB,
  location VARCHAR(255),
  location_i18n JSONB,
  unit_name VARCHAR(50),
  unit_name_i18n JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Step 1: Verify that the donation ID belongs to the provided email
  IF NOT EXISTS (
    SELECT 1
    FROM donations verify
    WHERE verify.donation_public_id = p_donation_id
      AND LOWER(verify.donor_email) = LOWER(p_email)
  ) THEN
    RETURN;
  END IF;

  -- Step 2: Return all donations for this email with order_reference
  RETURN QUERY
  SELECT
    d.id,
    d.donation_public_id,
    d.order_reference,  -- ✨ NEW: Include order_reference
    d.project_id,
    d.donor_email,
    d.amount,
    d.currency,
    d.donation_status,
    d.donated_at,
    d.updated_at,
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

-- Update comment
COMMENT ON FUNCTION get_donations_by_email_verified(TEXT, TEXT) IS
'Securely retrieves all donations for an email address after verifying ownership.
Includes order_reference for grouping donations by order in the UI.
Used by track donation feature.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_donations_by_email_verified(TEXT, TEXT) TO anon, authenticated;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Updated: get_donations_by_email_verified';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Added field: order_reference';
  RAISE NOTICE 'Purpose: Group donations by order in frontend UI';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
