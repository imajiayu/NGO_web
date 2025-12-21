-- =============================================================================================================
-- Fix: Allow Anonymous Users to Read Projects
-- =============================================================================================================
-- Description: Allows anonymous users to read projects table
--              This fixes the RLS violation when donations table policy checks project existence
--
-- Problem: donations table RLS policy has "EXISTS (SELECT 1 FROM projects WHERE id = project_id)"
--          This subquery fails because anon users can't read projects table
--
-- Solution: Grant SELECT permission to anon users on projects table
--          This is safe - projects are public information anyway
-- =============================================================================================================

-- =============================================
-- DROP OLD POLICY (if exists)
-- =============================================

DROP POLICY IF EXISTS "Public can view active projects" ON public.projects;
DROP POLICY IF EXISTS "Allow anonymous read projects" ON public.projects;

-- =============================================
-- CREATE NEW POLICY - ALLOW ANON READ
-- =============================================

-- Allow anonymous and authenticated users to read ALL projects
CREATE POLICY "Allow anonymous read projects"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (true);

-- =============================================
-- ADD COMMENT
-- =============================================

COMMENT ON POLICY "Allow anonymous read projects" ON public.projects IS
'Allows anonymous and authenticated users to read all projects.
This is needed for donation RLS policy to check project existence.
Projects are public information, so this is safe.';

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count the new policy
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'projects'
    AND policyname = 'Allow anonymous read projects';

  IF policy_count = 1 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Projects RLS Policy Updated!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Policy: Allow anonymous read projects';
    RAISE NOTICE 'Change: Allow anon users to read projects';
    RAISE NOTICE 'Reason: Fix donation RLS policy subquery';
    RAISE NOTICE 'Security: Safe - projects are public info';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Failed to create projects RLS policy!';
  END IF;
END $$;
