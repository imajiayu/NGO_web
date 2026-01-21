-- Migration: Fix progress calculation for aggregated projects
--
-- Problem:
--   For aggregated projects, progress_percentage was calculated using current_units/target_units.
--   But current_units only counts donation records (+1 per donation), not the actual amount.
--   This caused progress to show incorrectly (e.g., $3/$10000 instead of $600/$10000).
--
-- Solution:
--   - For aggregated projects: use total_raised / target_units
--   - For non-aggregated projects: use current_units / target_units (unchanged)
--
-- This avoids data redundancy since total_raised already correctly calculates the sum of amounts.

-- Drop and recreate the project_stats view with corrected progress calculation
CREATE OR REPLACE VIEW "public"."project_stats" AS
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
    -- Calculate total_raised (sum of amounts for paid/confirmed/delivering/completed donations)
    COALESCE(SUM(
        CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN d.amount
            ELSE 0
        END
    ), 0) AS total_raised,
    -- Count unique transactions (by order_reference)
    COUNT(DISTINCT
        CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN d.order_reference
            ELSE NULL
        END
    ) AS donation_count,
    -- Progress percentage: different calculation for aggregated vs non-aggregated
    CASE
        WHEN p.target_units > 0 THEN
            CASE
                WHEN p.aggregate_donations THEN
                    -- Aggregated projects: progress = total_raised / target_units
                    ROUND(
                        (COALESCE(SUM(
                            CASE
                                WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
                                THEN d.amount
                                ELSE 0
                            END
                        ), 0) / p.target_units::NUMERIC) * 100,
                        2
                    )
                ELSE
                    -- Non-aggregated projects: progress = current_units / target_units
                    ROUND((p.current_units::NUMERIC / p.target_units::NUMERIC) * 100, 2)
            END
        ELSE 0
    END AS progress_percentage
FROM public.projects p
LEFT JOIN public.donations d ON p.id = d.project_id
GROUP BY p.id;

-- Update comment
COMMENT ON VIEW "public"."project_stats" IS 'Project statistics view with corrected progress calculation.
- donation_count: actual payment transactions (unique order_reference)
- total_raised: sum of amounts for successful donations
- progress_percentage:
  - Aggregated projects: total_raised / target_units (amount-based)
  - Non-aggregated projects: current_units / target_units (unit-based)';
