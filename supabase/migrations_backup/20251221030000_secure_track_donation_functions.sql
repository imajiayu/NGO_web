-- =============================================================================================================
-- Security Fix: Secure Track Donation and Refund Functions
-- =============================================================================================================
-- Description: Creates secure database functions for tracking donations and requesting refunds
--              Replaces the insecure pattern of using service role in Server Actions
--
-- Security Context:
--   BEFORE: Server Actions used service role client (bypassed ALL RLS) - SECURITY RISK!
--   AFTER:  Server Actions use anonymous client with secure functions - SECURE
--
-- Functions:
--   1. get_donations_by_email_verified(email, donation_id) - Verify ownership and return all donations
--   2. request_donation_refund(donation_public_id, email) - Verify ownership and request refund
--
-- Security Features:
--   ✅ Email + Donation ID verification (must match)
--   ✅ SECURITY DEFINER (runs with function owner's permissions, bypasses RLS)
--   ✅ Internal validation prevents unauthorized access
--   ✅ Only returns obfuscated data where appropriate
-- =============================================================================================================

-- =============================================
-- FUNCTION 1: Get Donations by Email (Verified)
-- =============================================

-- Drop existing function if exists
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
  IF NOT EXISTS (
    SELECT 1
    FROM donations
    WHERE donation_public_id = p_donation_id
      AND LOWER(donor_email) = LOWER(p_email)
  ) THEN
    -- If verification fails, return empty result (don't reveal why)
    RETURN;
  END IF;

  -- Step 2: If verified, return all donations for this email
  -- Join with projects to get project information
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

-- Add comment
COMMENT ON FUNCTION get_donations_by_email_verified(TEXT, TEXT) IS
'Securely retrieves all donations for an email address after verifying ownership.
Requires both email and a valid donation ID to prevent enumeration attacks.
Used by track donation feature. Returns full email (user already knows it).';

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_donations_by_email_verified(TEXT, TEXT) TO anon, authenticated;

-- =============================================
-- FUNCTION 2: Request Donation Refund (Verified)
-- =============================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS request_donation_refund(TEXT, TEXT);

CREATE OR REPLACE FUNCTION request_donation_refund(
  p_donation_public_id TEXT,
  p_email TEXT
)
RETURNS JSON
SECURITY DEFINER -- Run with function owner's permissions (bypasses RLS)
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_donation_id BIGINT;
  v_status VARCHAR(20);
BEGIN
  -- Step 1: Verify ownership and get current status
  SELECT id, donation_status
  INTO v_donation_id, v_status
  FROM donations
  WHERE donation_public_id = p_donation_public_id
    AND LOWER(donor_email) = LOWER(p_email);

  -- Step 2: Check if donation exists and belongs to this email
  IF v_donation_id IS NULL THEN
    RETURN json_build_object(
      'error', 'donationNotFound',
      'message', 'Donation not found or email does not match'
    );
  END IF;

  -- Step 3: Validate refund eligibility based on status
  -- Cannot refund if already completed
  IF v_status = 'completed' THEN
    RETURN json_build_object(
      'error', 'cannotRefundCompleted',
      'message', 'Cannot refund completed donations'
    );
  END IF;

  -- Already refunding or refunded
  IF v_status IN ('refunding', 'refunded') THEN
    RETURN json_build_object(
      'error', 'alreadyRefunding',
      'message', 'Refund already in progress or completed'
    );
  END IF;

  -- Cannot refund pending or failed donations
  IF v_status IN ('pending', 'failed') THEN
    RETURN json_build_object(
      'error', 'cannotRefundPending',
      'message', 'Cannot refund pending or failed donations'
    );
  END IF;

  -- Step 4: Update donation status to 'refunding'
  -- The trigger will automatically update project current_units
  UPDATE donations
  SET donation_status = 'refunding'
  WHERE id = v_donation_id;

  -- Step 5: Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Refund request submitted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Catch any unexpected errors
    RETURN json_build_object(
      'error', 'serverError',
      'message', 'An unexpected error occurred'
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION request_donation_refund(TEXT, TEXT) IS
'Securely requests a refund for a donation after verifying email ownership.
Validates refund eligibility and updates status to refunding.
Used by track donation refund feature.';

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION request_donation_refund(TEXT, TEXT) TO anon, authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  func_count INTEGER;
BEGIN
  -- Count the new functions
  SELECT COUNT(*)
  INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_donations_by_email_verified', 'request_donation_refund');

  IF func_count = 2 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Secure Functions Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Function 1: get_donations_by_email_verified';
    RAISE NOTICE '  Purpose: Track donations by email';
    RAISE NOTICE '  Security: Email + Donation ID verification';
    RAISE NOTICE '  Returns: All donations for verified email';
    RAISE NOTICE '';
    RAISE NOTICE 'Function 2: request_donation_refund';
    RAISE NOTICE '  Purpose: Request refund for donation';
    RAISE NOTICE '  Security: Email ownership verification';
    RAISE NOTICE '  Returns: Success/error JSON';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Features:';
    RAISE NOTICE '  ✓ SECURITY DEFINER (bypasses RLS safely)';
    RAISE NOTICE '  ✓ Internal email verification';
    RAISE NOTICE '  ✓ Prevents enumeration attacks';
    RAISE NOTICE '  ✓ Status validation for refunds';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage (from anonymous client):';
    RAISE NOTICE '  SELECT * FROM get_donations_by_email_verified(';
    RAISE NOTICE '    ''user@example.com'', ''1-ABC123''';
    RAISE NOTICE '  );';
    RAISE NOTICE '';
    RAISE NOTICE '  SELECT request_donation_refund(';
    RAISE NOTICE '    ''1-ABC123'', ''user@example.com''';
    RAISE NOTICE '  );';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔒 Security Improvement:';
    RAISE NOTICE '  Server Actions now use anonymous client';
    RAISE NOTICE '  Service role no longer needed for tracking';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Failed to create secure functions! Expected 2, got %', func_count;
  END IF;
END $$;
