-- Drop the existing view
DROP VIEW IF EXISTS public.project_stats;

-- Recreate the view with aggregate_donations field
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
    COUNT(
        CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN 1
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
