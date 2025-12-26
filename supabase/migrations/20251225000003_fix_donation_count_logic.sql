-- Fix donation_count to count actual payment transactions (by order_reference)
-- instead of counting individual donation records

-- Drop the existing view
DROP VIEW IF EXISTS public.project_stats;

-- Recreate the view with corrected donation_count logic
CREATE VIEW public.project_stats AS
SELECT
    p.id,
    p.project_name,
    p.project_name_i18n,
    p.location,
    p.location_i18n,
    p.status,
    p.target_units,
    p.current_units,
    p.unit_name,
    p.unit_name_i18n,
    p.unit_price,
    p.start_date,
    p.end_date,
    p.is_long_term,
    p.aggregate_donations,
    p.description_i18n,
    COALESCE(SUM(
        CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN d.amount
            ELSE 0
        END
    ), 0) AS total_raised,
    -- Count unique order_references instead of individual records
    -- This represents actual payment transactions (donation count)
    COUNT(DISTINCT
        CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN d.order_reference
            ELSE NULL
        END
    ) AS donation_count,
    CASE
        WHEN p.target_units > 0 THEN
            ROUND((p.current_units::NUMERIC / p.target_units::NUMERIC) * 100, 2)
        ELSE 0
    END AS progress_percentage
FROM public.projects p
LEFT JOIN public.donations d ON p.id = d.project_id
GROUP BY p.id;

-- Grant SELECT permissions
GRANT SELECT ON public.project_stats TO anon, authenticated;

-- Add comment explaining the donation_count logic
COMMENT ON VIEW public.project_stats IS
'Project statistics view. donation_count represents actual payment transactions (unique order_reference), not individual donation records. For example, if a user buys 10 blankets in one transaction, it counts as 1 donation.';
