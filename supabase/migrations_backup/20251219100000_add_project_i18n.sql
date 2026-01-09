-- =============================================================================================================
-- Add i18n support for projects table
-- =============================================================================================================
-- Description: Adds JSON fields for multi-language support (en, zh, ua)
-- Date: 2025-12-19
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Adding i18n fields to projects table...';
END $$;

-- =============================================
-- Add JSON columns for translations
-- =============================================

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_name_i18n JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS location_i18n JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS unit_name_i18n JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description_i18n JSONB DEFAULT '{}';

-- =============================================
-- Create helper function to get translated text
-- =============================================

CREATE OR REPLACE FUNCTION public.get_translated_text(
    i18n_json JSONB,
    fallback_text TEXT,
    requested_locale TEXT DEFAULT 'en'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Try to get the requested locale
    IF i18n_json ? requested_locale AND i18n_json->>requested_locale IS NOT NULL AND i18n_json->>requested_locale != '' THEN
        RETURN i18n_json->>requested_locale;
    END IF;

    -- Fallback to English
    IF i18n_json ? 'en' AND i18n_json->>'en' IS NOT NULL AND i18n_json->>'en' != '' THEN
        RETURN i18n_json->>'en';
    END IF;

    -- Final fallback to the original text
    RETURN fallback_text;
END;
$$;

-- =============================================
-- Migrate existing data (English as default)
-- =============================================

UPDATE public.projects
SET
    project_name_i18n = jsonb_build_object('en', project_name),
    location_i18n = jsonb_build_object('en', location),
    unit_name_i18n = jsonb_build_object('en', unit_name),
    description_i18n = '{}'::jsonb
WHERE project_name_i18n = '{}'::jsonb;

-- =============================================
-- Update project_stats view to support i18n
-- =============================================

-- Drop and recreate the view (PostgreSQL doesn't allow adding columns in the middle)
DROP VIEW IF EXISTS public.project_stats CASCADE;

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

-- =============================================
-- Create indexes for better JSON query performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_projects_name_i18n_en ON public.projects ((project_name_i18n->>'en'));
CREATE INDEX IF NOT EXISTS idx_projects_name_i18n_zh ON public.projects ((project_name_i18n->>'zh'));
CREATE INDEX IF NOT EXISTS idx_projects_name_i18n_ua ON public.projects ((project_name_i18n->>'ua'));

-- =============================================
-- Add comment for documentation
-- =============================================

COMMENT ON COLUMN public.projects.project_name_i18n IS 'Translated project names: {"en": "...", "zh": "...", "ua": "..."}';
COMMENT ON COLUMN public.projects.location_i18n IS 'Translated locations: {"en": "...", "zh": "...", "ua": "..."}';
COMMENT ON COLUMN public.projects.unit_name_i18n IS 'Translated unit names: {"en": "kit", "zh": "套件", "ua": "комплект"}';
COMMENT ON COLUMN public.projects.description_i18n IS 'Translated descriptions: {"en": "...", "zh": "...", "ua": "..."}';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'i18n migration completed successfully!';
    RAISE NOTICE '========================================';
END $$;
