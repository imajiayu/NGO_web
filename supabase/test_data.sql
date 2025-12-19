-- =============================================================================================================
-- Test Data: Sample Projects
-- =============================================================================================================
-- Description: Creates two test projects for development and testing
-- =============================================================================================================

-- =============================================
-- Project 1: Long-term project (no end date, no target)
-- =============================================
INSERT INTO public.projects (
    project_name,
    location,
    start_date,
    end_date,
    is_long_term,
    target_units,
    current_units,
    unit_price,
    unit_name,
    status
) VALUES (
    'Clean Water Initiative - Rural Villages',
    'Western Uganda',
    '2025-01-01',
    NULL,                    -- No end date (long-term project)
    true,                    -- Is long-term
    NULL,                    -- No specific target (ongoing project)
    0,                       -- No donations yet
    25.00,                   -- $25 per water filter
    'water filter',
    'active'
);

-- =============================================
-- Project 2: Short-term project (with end date and target)
-- =============================================
INSERT INTO public.projects (
    project_name,
    location,
    start_date,
    end_date,
    is_long_term,
    target_units,
    current_units,
    unit_price,
    unit_name,
    status
) VALUES (
    'Emergency Food Relief - Winter 2025',
    'Northern Ukraine',
    '2025-01-15',
    '2025-03-31',            -- Ends March 31, 2025
    false,                   -- Not long-term
    500,                     -- Target: 500 food kits
    0,                       -- No donations yet
    15.00,                   -- $15 per food kit
    'food kit',
    'active'
);

-- =============================================
-- Verify inserted projects
-- =============================================
SELECT
    id,
    project_name,
    location,
    start_date,
    end_date,
    is_long_term,
    target_units,
    current_units,
    unit_price,
    unit_name,
    status
FROM public.projects
ORDER BY id;

-- =============================================
-- View project stats
-- =============================================
SELECT
    id,
    project_name,
    is_long_term,
    target_units,
    current_units,
    progress_percentage,
    target_amount,
    total_raised
FROM public.project_stats
ORDER BY id;
