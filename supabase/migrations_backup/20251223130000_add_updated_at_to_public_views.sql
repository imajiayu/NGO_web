-- =============================================================================================================
-- Add updated_at to Public Donation Views
-- =============================================================================================================
-- Description: Updates public_project_donations view to include updated_at field
-- Date: 2025-12-23
-- Version: 1.0
--
-- Changes:
--   - Add updated_at field to public_project_donations view
--   - Add updated_at field to get_donations_by_email_verified function
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Adding updated_at to public donation views...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PART 1: UPDATE public_project_donations VIEW
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Updating public_project_donations view...';
END $$;

-- Drop and recreate the view with updated_at
DROP VIEW IF EXISTS public.public_project_donations CASCADE;

CREATE VIEW public.public_project_donations AS
SELECT
    d.id,
    d.donation_public_id,
    d.project_id,
    -- Email obfuscation: john.doe@example.com -> j***e@e***.com
    CASE
        WHEN d.donor_email IS NOT NULL AND POSITION('@' IN d.donor_email) > 0 THEN
            -- Local part: first char + *** + last char before @
            SUBSTRING(d.donor_email FROM 1 FOR 1) ||
            '***' ||
            SUBSTRING(d.donor_email FROM POSITION('@' IN d.donor_email) - 1 FOR 1) ||
            '@' ||
            -- Domain part: first char + ***
            SUBSTRING(
                SUBSTRING(d.donor_email FROM POSITION('@' IN d.donor_email) + 1)
                FROM 1 FOR 1
            ) ||
            '***' ||
            -- Keep the top-level domain (e.g., .com)
            CASE
                WHEN POSITION('.' IN SUBSTRING(d.donor_email FROM POSITION('@' IN d.donor_email) + 1)) > 0 THEN
                    '.' || SPLIT_PART(
                        SUBSTRING(d.donor_email FROM POSITION('@' IN d.donor_email) + 1),
                        '.',
                        2
                    )
                ELSE ''
            END
        ELSE NULL
    END as donor_email_obfuscated,
    d.amount,
    d.currency,
    d.donation_status,
    d.donated_at,
    d.updated_at  -- ✨ NEW: Add updated_at field
FROM public.donations d
WHERE d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
ORDER BY d.donated_at DESC;

-- Grant permissions
GRANT SELECT ON public.public_project_donations TO anon, authenticated;

-- Add comment
COMMENT ON VIEW public.public_project_donations IS 'Public view of project donations with obfuscated email addresses for privacy protection. Only shows successful donations. Includes updated_at timestamp.';

DO $$
BEGIN
    RAISE NOTICE '✓ Updated: public_project_donations view';
END $$;

-- =============================================================================================================
-- PART 2: UPDATE get_donations_by_email_verified FUNCTION
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Updating get_donations_by_email_verified function...';
END $$;

-- Drop existing function
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
  updated_at TIMESTAMPTZ,  -- ✨ NEW: Add updated_at field
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
    d.updated_at,  -- ✨ NEW: Include updated_at in SELECT
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
Used by track donation feature. Returns full email (user already knows it).
Includes updated_at timestamp for tracking changes.';

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_donations_by_email_verified(TEXT, TEXT) TO anon, authenticated;

DO $$
BEGIN
    RAISE NOTICE '✓ Updated: get_donations_by_email_verified function';
END $$;

-- =============================================================================================================
-- VERIFICATION
-- =============================================================================================================

DO $$
DECLARE
    view_exists BOOLEAN;
    func_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifying changes...';
    RAISE NOTICE '========================================';

    -- Check if view exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public'
          AND viewname = 'public_project_donations'
    ) INTO view_exists;

    IF view_exists THEN
        RAISE NOTICE '✓ View public_project_donations exists';
    ELSE
        RAISE WARNING '⚠ View public_project_donations not found';
    END IF;

    -- Check if function exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_donations_by_email_verified'
    ) INTO func_exists;

    IF func_exists THEN
        RAISE NOTICE '✓ Function get_donations_by_email_verified exists';
    ELSE
        RAISE WARNING '⚠ Function get_donations_by_email_verified not found';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- COMPLETION SUMMARY
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated objects:';
    RAISE NOTICE '  ✓ public_project_donations view (added updated_at)';
    RAISE NOTICE '  ✓ get_donations_by_email_verified function (added updated_at)';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - Public donation lists now show last update time';
    RAISE NOTICE '  - Track donation feature shows when status changed';
    RAISE NOTICE '========================================';
END $$;
