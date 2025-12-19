-- =============================================
-- Verification Query: Check Project Units
-- =============================================
-- This query verifies that current_units matches
-- the actual count of valid donations

SELECT
    p.id,
    p.project_name,
    p.current_units AS stored_units,
    p.target_units,
    COUNT(CASE
        WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
        THEN 1
    END) AS calculated_units,
    CASE
        WHEN p.current_units = COUNT(CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN 1
        END) THEN '✅ CORRECT'
        ELSE '❌ MISMATCH'
    END AS status,
    STRING_AGG(
        CONCAT(d.id, ':', d.donation_status),
        ', '
        ORDER BY d.id
    ) AS all_donations
FROM projects p
LEFT JOIN donations d ON p.id = d.project_id
GROUP BY p.id, p.project_name, p.current_units, p.target_units
ORDER BY p.id;
