-- =============================================================================================================
-- Add Public Project Donations View with Email Obfuscation
-- =============================================================================================================
-- Description: Creates a secure view for public donation listings with email obfuscation
-- Version: 1.0
-- Date: 2025-12-19
--
-- Security Improvements:
-- - Email addresses are obfuscated (e.g., john.doe@example.com -> j***e@e***.com)
-- - Only safe fields are exposed
-- - No sensitive contact information included
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Creating secure public donation view...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- DROP EXISTING VIEW IF EXISTS
-- =============================================

DROP VIEW IF EXISTS public.public_project_donations CASCADE;

-- =============================================
-- CREATE OBFUSCATED DONATION VIEW
-- =============================================

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
    d.donated_at
FROM public.donations d
WHERE d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
ORDER BY d.donated_at DESC;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT ON public.public_project_donations TO anon, authenticated;

-- =============================================
-- ADD COMMENTS
-- =============================================

COMMENT ON VIEW public.public_project_donations IS 'Public view of project donations with obfuscated email addresses for privacy protection. Only shows successful donations.';

-- =============================================================================================================
-- COMPLETION
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Secure donation view created successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'View: public.public_project_donations';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - Email obfuscation (j***e@e***.com)';
    RAISE NOTICE '  - Only successful donations';
    RAISE NOTICE '  - No sensitive contact info';
    RAISE NOTICE '========================================';
END $$;
