-- =============================================================================================================
-- Drop Unused Database Functions
-- =============================================================================================================
-- Description: Removes database functions that are not being used in the codebase
-- Version: 1.0
-- Date: 2025-12-21
--
-- Analysis Summary:
-- - Analyzed all database objects (views, functions, triggers) defined in migrations
-- - Searched entire codebase for usage of each object
-- - Identified 3 functions that are not called anywhere in the code
--
-- Unused Functions (to be dropped):
-- 1. get_donation_result_url(TEXT) - Returns donation result image URL
--    - Created in: 20251219061700_reset_complete.sql
--    - Usage: Not found in codebase
--    - Reason: Feature for donation result images appears to be unused
--
-- 2. cleanup_expired_pending_donations() - Deletes pending donations older than 24 hours
--    - Created in: 20251219061700_reset_complete.sql
--    - Usage: Not found in codebase
--    - Reason: No cron job or scheduled task calling this function
--
-- 3. get_translated_text(JSONB, TEXT, TEXT) - Returns translated text from i18n JSON
--    - Created in: 20251219100000_add_project_i18n.sql
--    - Usage: Not found in codebase
--    - Reason: Application uses client-side i18n instead of database-level translation
--
-- Unused Views (to be dropped):
-- 4. public_donation_feed - Global donation feed view
--    - Created in: 20251219061700_reset_complete.sql
--    - Usage: Functions getPublicDonationFeed() and getDashboardStats() defined but never called
--    - Reason: No UI component displays global donation feed across all projects
--    - Note: public_project_donations view is still used and will be kept
--
-- Impact Analysis:
-- - These functions can be safely removed without affecting application functionality
-- - No views, triggers, or other database objects depend on these functions
-- - No application code references these functions
--
-- Rollback Plan:
-- If needed, these functions can be recreated by re-running their original migration files:
-- - get_donation_result_url: Lines 454-482 of 20251219061700_reset_complete.sql
-- - cleanup_expired_pending_donations: Lines 487-500 of 20251219061700_reset_complete.sql
-- - get_translated_text: Lines 27-50 of 20251219100000_add_project_i18n.sql
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Dropping unused database functions...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- 1. DROP get_donation_result_url
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping function: get_donation_result_url(TEXT)';
END $$;

DROP FUNCTION IF EXISTS public.get_donation_result_url(TEXT) CASCADE;

-- =============================================
-- 2. DROP cleanup_expired_pending_donations
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping function: cleanup_expired_pending_donations()';
END $$;

DROP FUNCTION IF EXISTS public.cleanup_expired_pending_donations() CASCADE;

-- =============================================
-- 3. DROP get_translated_text
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping function: get_translated_text(JSONB, TEXT, TEXT)';
END $$;

DROP FUNCTION IF EXISTS public.get_translated_text(JSONB, TEXT, TEXT) CASCADE;

-- =============================================
-- 4. DROP public_donation_feed VIEW
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping view: public_donation_feed';
END $$;

DROP VIEW IF EXISTS public.public_donation_feed CASCADE;

-- =============================================================================================================
-- COMPLETION
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Successfully dropped 3 unused functions and 1 unused view';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Dropped functions:';
    RAISE NOTICE '  1. get_donation_result_url(TEXT)';
    RAISE NOTICE '  2. cleanup_expired_pending_donations()';
    RAISE NOTICE '  3. get_translated_text(JSONB, TEXT, TEXT)';
    RAISE NOTICE '';
    RAISE NOTICE 'Dropped views:';
    RAISE NOTICE '  4. public_donation_feed';
    RAISE NOTICE '';
    RAISE NOTICE 'Kept (still in use):';
    RAISE NOTICE '  ✓ public_project_donations view';
    RAISE NOTICE '  ✓ project_stats view';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database cleanup complete!';
    RAISE NOTICE '========================================';
END $$;
