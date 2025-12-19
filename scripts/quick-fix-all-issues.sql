-- ============================================
-- QUICK FIX: Resolve All ProjectCard Issues
-- ============================================
-- Run this script in Supabase SQL Editor

-- STEP 1: Check current project data
-- ============================================
SELECT
  id,
  project_name,
  start_date,
  end_date,
  is_long_term,
  status,
  current_units,
  target_units,
  unit_name,
  unit_price,
  CASE
    WHEN start_date IS NULL THEN '❌ Missing start_date'
    WHEN is_long_term IS NULL THEN '⚠️  is_long_term is NULL (should be true or false)'
    WHEN is_long_term = false AND end_date IS NULL THEN '⚠️  Fixed-term project missing end_date'
    WHEN is_long_term = true AND end_date IS NOT NULL THEN '⚠️  Long-term project has end_date (should be NULL)'
    ELSE '✅ OK'
  END AS validation_status
FROM projects
ORDER BY id;

-- STEP 2: Fix NULL is_long_term values
-- ============================================
-- This sets all NULL is_long_term to false (fixed-term projects)
UPDATE projects
SET is_long_term = false
WHERE is_long_term IS NULL;

-- STEP 3: Update project_stats view (CRITICAL!)
-- ============================================
-- Drop the existing view
DROP VIEW IF EXISTS public.project_stats;

-- Recreate with all necessary fields
CREATE OR REPLACE VIEW public.project_stats AS
SELECT
    p.id,
    p.project_name,
    p.location,
    p.start_date,
    p.end_date,
    p.is_long_term,
    p.status,
    p.target_units,
    p.current_units,
    p.unit_name,
    p.unit_price,
    COALESCE(SUM(d.amount), 0) as total_raised,
    COUNT(d.id) as donation_count,
    ROUND((p.current_units::NUMERIC / NULLIF(p.target_units, 0) * 100), 2) as progress_percentage,
    (p.target_units * p.unit_price) as target_amount
FROM public.projects p
LEFT JOIN public.donations d ON p.id = d.project_id AND d.donation_status IN ('confirmed', 'delivering', 'completed')
GROUP BY
    p.id,
    p.project_name,
    p.location,
    p.start_date,
    p.end_date,
    p.is_long_term,
    p.status,
    p.target_units,
    p.current_units,
    p.unit_name,
    p.unit_price;

COMMENT ON VIEW public.project_stats IS 'Aggregated project statistics including donation totals and progress - Updated to include all project fields';

-- STEP 4: Verify the view was created correctly
-- ============================================
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_stats'
ORDER BY ordinal_position;

-- Expected columns:
-- id (bigint), project_name (character varying), location (character varying),
-- start_date (date), end_date (date), is_long_term (boolean),
-- status (character varying), target_units (integer), current_units (integer),
-- unit_name (character varying), unit_price (numeric),
-- total_raised (numeric), donation_count (bigint),
-- progress_percentage (numeric), target_amount (numeric)

-- STEP 5: View final results
-- ============================================
SELECT
  id,
  project_name,
  location,
  start_date,
  end_date,
  is_long_term,
  status,
  CONCAT(current_units, ' / ', target_units, ' ', unit_name) as progress,
  CONCAT('$', unit_price) as price_per_unit,
  donation_count,
  progress_percentage || '%' as progress_pct
FROM project_stats
ORDER BY
  CASE status
    WHEN 'active' THEN 1
    WHEN 'planned' THEN 2
    WHEN 'completed' THEN 3
    WHEN 'paused' THEN 4
  END;

-- ============================================
-- OPTIONAL: Fix specific projects manually
-- ============================================

-- Example 1: Make a project long-term
-- UPDATE projects
-- SET
--   is_long_term = true,
--   end_date = NULL
-- WHERE id = 1;

-- Example 2: Make a project fixed-term with an end date
-- UPDATE projects
-- SET
--   is_long_term = false,
--   end_date = '2024-12-31'::date
-- WHERE id = 2;

-- Example 3: Set a start date if missing
-- UPDATE projects
-- SET start_date = '2024-01-01'::date
-- WHERE id = 3;

-- ============================================
-- DONE!
-- ============================================
-- After running this script:
-- 1. Refresh your browser
-- 2. Check the home page
-- 3. You should see all project cards working correctly
