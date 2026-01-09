-- =============================================================================================================
-- Fix RLS Policies - Remove policies that query auth.users table
-- =============================================================================================================
-- Description: Removes admin policies that cause "permission denied for table users" error
--
-- Problem: Admin policies were trying to query auth.users table, which anon/authenticated roles
--          don't have permission to access, causing errors even for public queries.
--
-- Solution: Remove admin policies and rely on service role client for admin operations.
--           Service role client bypasses RLS entirely, so these policies are unnecessary.
-- =============================================================================================================

-- =============================================
-- DROP PROBLEMATIC ADMIN POLICIES
-- =============================================

-- Drop projects admin policies (not needed - use service role for admin operations)
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

-- Drop donations admin policies (not needed - use service role for admin operations)
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can update donation status" ON public.donations;

-- Drop storage admin policies (not needed - use service role for admin operations)
DROP POLICY IF EXISTS "Admin Only - Upload result images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Only - Update result images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Only - Delete result images" ON storage.objects;

-- =============================================================================================================
-- SUMMARY
-- =============================================================================================================
--
-- Remaining Policies:
--
-- PROJECTS:
--   ✅ "Public can view active projects" - allows viewing active/completed projects
--   ❌ Admin operations → use service role client (bypasses RLS)
--
-- DONATIONS:
--   ✅ "Public can view confirmed donations" - allows viewing paid/confirmed/delivering/completed
--   ✅ "Service role can insert donations" - webhooks can insert
--   ❌ Admin operations → use service role client (bypasses RLS)
--
-- STORAGE:
--   ✅ "Public Access - View result images" - anyone can view
--   ❌ Admin operations → use service role client (bypasses RLS)
--
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS policies fixed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Removed policies that query auth.users table';
    RAISE NOTICE 'Admin operations should now use service role client';
    RAISE NOTICE '========================================';
END $$;
