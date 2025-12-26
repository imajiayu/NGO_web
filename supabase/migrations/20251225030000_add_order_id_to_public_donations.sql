-- =============================================================================================================
-- Add order_id to public_project_donations View
-- =============================================================================================================
-- Description: Updates public_project_donations view to include order_id field
-- Date: 2025-12-25
-- Version: 1.0
--
-- Changes:
--   - Add order_id field (MD5 hash of order_reference) to group donations from same payment
--   - Maintains privacy by not exposing actual order_reference
--   - Allows UI to visually group donations from the same transaction
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Adding order_id to public_project_donations view...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- DROP AND RECREATE VIEW WITH order_id
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Updating public_project_donations view...';
END $$;

-- Drop existing view
DROP VIEW IF EXISTS public.public_project_donations CASCADE;

-- Recreate view with order_id field
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
    -- ✨ NEW: Order ID - MD5 hash of order_reference for grouping without exposing actual reference
    MD5(COALESCE(d.order_reference, '')) as order_id,
    d.amount,
    d.currency,
    d.donation_status,
    d.donated_at,
    d.updated_at
FROM public.donations d
WHERE d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
ORDER BY d.donated_at DESC;

-- Grant permissions
GRANT SELECT ON public.public_project_donations TO anon, authenticated;

-- Add comment
COMMENT ON VIEW public.public_project_donations IS 'Public view of project donations with obfuscated email addresses for privacy protection. Only shows successful donations. Includes order_id (MD5 hash) to group donations from same payment without exposing order_reference.';

DO $$
BEGIN
    RAISE NOTICE '✓ Updated: public_project_donations view with order_id field';
END $$;

-- =============================================================================================================
-- VERIFICATION
-- =============================================================================================================

DO $$
DECLARE
    view_exists BOOLEAN;
    column_exists BOOLEAN;
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

    -- Check if order_id column exists in view
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'public_project_donations'
          AND column_name = 'order_id'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE NOTICE '✓ Column order_id exists in view';
    ELSE
        RAISE WARNING '⚠ Column order_id not found in view';
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
    RAISE NOTICE '  ✓ public_project_donations view (added order_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'New field:';
    RAISE NOTICE '  - order_id: MD5 hash of order_reference';
    RAISE NOTICE '';
    RAISE NOTICE 'Purpose:';
    RAISE NOTICE '  - Groups donations from the same payment transaction';
    RAISE NOTICE '  - Maintains privacy (does not expose order_reference)';
    RAISE NOTICE '  - Enables visual grouping in UI';
    RAISE NOTICE '========================================';
END $$;
