-- Quick verification script for ProjectCard data
-- Run this in Supabase SQL Editor to verify your setup

-- 1. Check if project_stats view has all required columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_stats'
ORDER BY ordinal_position;

-- Expected columns:
-- id, project_name, location, start_date, end_date, is_long_term,
-- status, target_units, current_units, unit_name, unit_price,
-- total_raised, donation_count, progress_percentage, target_amount

-- 2. View all projects with their complete data
SELECT
  id,
  project_name,
  location,
  start_date,
  end_date,
  is_long_term,
  status,
  target_units,
  current_units,
  unit_name,
  unit_price,
  total_raised,
  donation_count,
  progress_percentage
FROM project_stats
ORDER BY
  CASE status
    WHEN 'active' THEN 1
    WHEN 'planned' THEN 2
    WHEN 'completed' THEN 3
    WHEN 'paused' THEN 4
  END;

-- 3. Check for data issues
SELECT
  id,
  project_name,
  CASE
    WHEN start_date IS NULL THEN '❌ Missing start_date'
    WHEN end_date IS NULL AND is_long_term = false THEN '⚠️  Missing end_date (fixed-term project)'
    WHEN end_date IS NOT NULL AND is_long_term = true THEN '⚠️  Has end_date (long-term project should not)'
    WHEN is_long_term IS NULL THEN '❌ Missing is_long_term flag'
    ELSE '✅ OK'
  END AS validation_status
FROM projects;

-- 4. Sample fix queries (uncomment and modify as needed)

-- Fix a project that should be fixed-term:
-- UPDATE projects
-- SET
--   end_date = '2024-12-31',
--   is_long_term = false
-- WHERE id = YOUR_PROJECT_ID;

-- Fix a project that should be long-term:
-- UPDATE projects
-- SET
--   end_date = NULL,
--   is_long_term = true
-- WHERE id = YOUR_PROJECT_ID;

-- Set default is_long_term for existing projects (if NULL):
-- UPDATE projects
-- SET is_long_term = COALESCE(is_long_term, false)
-- WHERE is_long_term IS NULL;
