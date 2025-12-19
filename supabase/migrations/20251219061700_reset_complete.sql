-- =============================================================================================================
-- NGO Platform - Complete Database Reset & Initialization
-- =============================================================================================================
-- Description: Drops all existing database objects and recreates the complete schema
-- Version: 2.0
-- Date: 2025-12-19
--
-- IMPORTANT: This migration is idempotent and can be run multiple times.
--            Each run will completely reset the database to the initial state.
--            ALL DATA WILL BE LOST when running this migration!
--
-- Changes from original schema:
-- - projects.target_units is now NULLABLE (can be NULL for projects without specific targets)
-- - WayForPay integration (order_reference instead of stripe_payment_intent_id)
-- - donation_status includes 'pending' state
-- - Storage bucket for donation results
-- =============================================================================================================

-- =============================================================================================================
-- PHASE 1: DROP ALL EXISTING OBJECTS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting database reset...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- 1.1 DROP STORAGE POLICIES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping storage policies...';
END $$;

DROP POLICY IF EXISTS "Public Access - View result images" ON storage.objects;

-- =============================================
-- 1.2 DROP RLS POLICIES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping RLS policies...';
END $$;

-- Projects policies
DROP POLICY IF EXISTS "Public can view active projects" ON public.projects;

-- Donations policies
DROP POLICY IF EXISTS "Public can view confirmed donations" ON public.donations;
DROP POLICY IF EXISTS "Service role can insert donations" ON public.donations;

-- =============================================
-- 1.3 DROP TRIGGERS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping triggers...';
END $$;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_project_units_trigger ON public.donations;

-- =============================================
-- 1.4 DROP FUNCTIONS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping functions...';
END $$;

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_project_units() CASCADE;
DROP FUNCTION IF EXISTS public.generate_donation_public_id(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.get_project_progress(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.get_recent_donations(BIGINT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.is_project_goal_reached(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.get_donation_result_url(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_pending_donations() CASCADE;

-- =============================================
-- 1.5 DROP VIEWS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping views...';
END $$;

DROP VIEW IF EXISTS public.project_stats CASCADE;
DROP VIEW IF EXISTS public.public_donation_feed CASCADE;

-- =============================================
-- 1.6 DROP TABLES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping tables...';
END $$;

DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Old tables (if they exist)
DROP TABLE IF EXISTS public.pending_payments CASCADE;

-- =============================================
-- 1.7 CLEAN STORAGE BUCKETS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Cleaning storage buckets...';
END $$;

-- Delete all objects in donation-results bucket
DELETE FROM storage.objects WHERE bucket_id = 'donation-results';

-- Delete the bucket itself
DELETE FROM storage.buckets WHERE id = 'donation-results';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Cleanup complete. Starting creation...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PHASE 2: CREATE DATABASE SCHEMA
-- =============================================================================================================

-- =============================================
-- 2.1 EXTENSIONS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Creating extensions...';
END $$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 2.2 CREATE TABLES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Creating tables...';
END $$;

-- ---------------------------------------------
-- PROJECTS TABLE
-- ---------------------------------------------
CREATE TABLE public.projects (
    id BIGSERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_long_term BOOLEAN DEFAULT FALSE,
    target_units INTEGER,  -- ✨ CHANGED: Now nullable (was NOT NULL DEFAULT 0)
    current_units INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(10,2) NOT NULL,
    unit_name VARCHAR(50) DEFAULT 'kit',
    status VARCHAR(20) DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('planned', 'active', 'completed', 'paused')),
    CONSTRAINT valid_units CHECK (
        current_units >= 0
        AND (target_units IS NULL OR target_units >= 0)  -- ✨ CHANGED: Allow NULL target_units
    ),
    CONSTRAINT valid_unit_price CHECK (unit_price > 0),
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ---------------------------------------------
-- DONATIONS TABLE
-- ---------------------------------------------
CREATE TABLE public.donations (
    id BIGSERIAL PRIMARY KEY,
    donation_public_id VARCHAR(50) NOT NULL UNIQUE,
    project_id BIGINT NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_message TEXT,
    contact_telegram VARCHAR(255),
    contact_whatsapp VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50),
    order_reference VARCHAR(255),  -- ✨ WayForPay order reference (DONATE-{project_id}-{timestamp})
    donation_status VARCHAR(20) DEFAULT 'paid',
    locale VARCHAR(5) DEFAULT 'en',
    donated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign Key
    CONSTRAINT fk_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT valid_donation_status CHECK (
        donation_status IN ('pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded')
    ),
    CONSTRAINT valid_locale CHECK (locale IN ('en', 'zh', 'ua')),
    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- =============================================
-- 2.3 CREATE INDEXES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Creating indexes...';
END $$;

-- Projects indexes
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_start_date ON public.projects(start_date);

-- Donations indexes
CREATE INDEX idx_donations_project_id ON public.donations(project_id);
CREATE INDEX idx_donations_status ON public.donations(donation_status);
CREATE INDEX idx_donations_public_id ON public.donations(donation_public_id);
CREATE INDEX idx_donations_email ON public.donations(donor_email);
CREATE INDEX idx_donations_locale ON public.donations(locale);

-- WayForPay specific indexes
CREATE UNIQUE INDEX idx_donations_order_reference
    ON public.donations(order_reference)
    WHERE order_reference IS NOT NULL;

CREATE INDEX idx_donations_order_ref_status
    ON public.donations(order_reference, donation_status)
    WHERE order_reference IS NOT NULL;

-- Refund status index
CREATE INDEX idx_donations_refund_status
    ON public.donations(donation_status)
    WHERE donation_status IN ('refunding', 'refunded');

-- =============================================================================================================
-- PHASE 3: CREATE FUNCTIONS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating functions...';
END $$;

-- =============================================
-- 3.1 TRIGGER FUNCTIONS
-- =============================================

-- ---------------------------------------------
-- Auto-update updated_at timestamp
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Auto-update project units based on donation status
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.update_project_units()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: Only count non-pending donations
    IF (TG_OP = 'INSERT') THEN
        IF NEW.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
            UPDATE public.projects
            SET current_units = current_units + 1
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;

    -- UPDATE: Handle status transitions
    ELSIF (TG_OP = 'UPDATE') THEN
        -- FROM pending TO paid/confirmed/delivering/completed -> increment
        IF OLD.donation_status = 'pending'
           AND NEW.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
            UPDATE public.projects
            SET current_units = current_units + 1
            WHERE id = NEW.project_id;

        -- FROM paid/confirmed/delivering/completed TO refunded -> decrement
        ELSIF OLD.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
              AND NEW.donation_status = 'refunded' THEN
            UPDATE public.projects
            SET current_units = current_units - 1
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;

    -- DELETE: Decrement if deleting a counted donation
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
            UPDATE public.projects
            SET current_units = current_units - 1
            WHERE id = OLD.project_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3.2 BUSINESS LOGIC FUNCTIONS
-- =============================================

-- ---------------------------------------------
-- Generate unique donation public ID
-- Format: {project_id}-{XXXXXX}
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_donation_public_id(project_id_input BIGINT)
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    done BOOLEAN := FALSE;
    random_suffix TEXT;
BEGIN
    WHILE NOT done LOOP
        -- Generate 6-character random suffix (alphanumeric uppercase)
        random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

        -- Format: {project_id}-{random_suffix}
        new_id := project_id_input::TEXT || '-' || random_suffix;

        -- Check if ID already exists for this project
        IF NOT EXISTS (
            SELECT 1 FROM public.donations
            WHERE donation_public_id = new_id
            AND project_id = project_id_input
        ) THEN
            done := TRUE;
        END IF;
    END LOOP;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Get detailed progress information for a project
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_project_progress(project_id_input BIGINT)
RETURNS TABLE (
    project_id BIGINT,
    project_name VARCHAR,
    target_units INTEGER,
    current_units INTEGER,
    progress_percentage NUMERIC,
    total_donations BIGINT,
    total_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.project_name,
        p.target_units,
        p.current_units,
        CASE
            WHEN p.target_units IS NULL OR p.target_units = 0 THEN NULL
            ELSE ROUND((p.current_units::NUMERIC / p.target_units * 100), 2)
        END,
        COUNT(d.id),
        COALESCE(SUM(d.amount), 0)
    FROM public.projects p
    LEFT JOIN public.donations d ON p.id = d.project_id
        AND d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
    WHERE p.id = project_id_input
    GROUP BY p.id, p.project_name, p.target_units, p.current_units;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Get recent donations for a project
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_recent_donations(
    project_id_input BIGINT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    donation_public_id VARCHAR,
    donor_name VARCHAR,
    amount NUMERIC,
    currency VARCHAR,
    donated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.donation_public_id,
        d.donor_name,
        d.amount,
        d.currency,
        d.donated_at
    FROM public.donations d
    WHERE d.project_id = project_id_input
        AND d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
    ORDER BY d.donated_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------
-- Check if project goal is reached
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.is_project_goal_reached(project_id_input BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    project_record RECORD;
BEGIN
    SELECT current_units, target_units INTO project_record
    FROM public.projects
    WHERE id = project_id_input;

    IF project_record IS NULL THEN
        RETURN FALSE;
    END IF;

    -- If no target set, project is never "reached"
    IF project_record.target_units IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN project_record.current_units >= project_record.target_units;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Get donation result image URL
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_donation_result_url(donation_public_id_input TEXT)
RETURNS TEXT AS $$
DECLARE
    image_path TEXT;
    base_url TEXT;
BEGIN
    -- Get the Supabase URL from settings
    base_url := current_setting('app.settings.supabase_url', true);

    -- If not set, use a placeholder
    IF base_url IS NULL THEN
        base_url := 'YOUR_SUPABASE_URL';
    END IF;

    -- Check if any image exists for this donation
    SELECT name INTO image_path
    FROM storage.objects
    WHERE bucket_id = 'donation-results'
        AND name LIKE donation_public_id_input || '/%'
    LIMIT 1;

    -- Return the public URL if image exists
    IF image_path IS NOT NULL THEN
        RETURN base_url || '/storage/v1/object/public/donation-results/' || image_path;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------
-- Clean up expired pending donations (older than 24 hours)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_donations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete pending donations older than 24 hours
    DELETE FROM public.donations
    WHERE donation_status = 'pending'
        AND created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================================================
-- PHASE 4: CREATE VIEWS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating views...';
END $$;

-- ---------------------------------------------
-- Aggregated project statistics
-- ---------------------------------------------
CREATE VIEW public.project_stats AS
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
    CASE
        WHEN p.target_units IS NULL OR p.target_units = 0 THEN NULL
        ELSE ROUND((p.current_units::NUMERIC / p.target_units * 100), 2)
    END as progress_percentage,
    CASE
        WHEN p.target_units IS NULL THEN NULL
        ELSE (p.target_units * p.unit_price)
    END as target_amount
FROM public.projects p
LEFT JOIN public.donations d ON p.id = d.project_id
    AND d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
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

-- ---------------------------------------------
-- Public donation feed with anonymized donor names
-- ---------------------------------------------
CREATE VIEW public.public_donation_feed AS
SELECT
    d.donation_public_id,
    p.project_name,
    p.id as project_id,
    -- Anonymize donor name (show first name + initial)
    CASE
        WHEN POSITION(' ' IN d.donor_name) > 0 THEN
            SPLIT_PART(d.donor_name, ' ', 1) || ' ' ||
            LEFT(SPLIT_PART(d.donor_name, ' ', 2), 1) || '.'
        ELSE
            LEFT(d.donor_name, 1) || REPEAT('*', GREATEST(LENGTH(d.donor_name) - 1, 3))
    END as donor_display_name,
    d.amount,
    d.currency,
    d.donated_at,
    d.donation_status
FROM public.donations d
JOIN public.projects p ON d.project_id = p.id
WHERE d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
ORDER BY d.donated_at DESC;

-- =============================================================================================================
-- PHASE 5: CREATE TRIGGERS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating triggers...';
END $$;

-- Apply trigger to projects table
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to donations table
CREATE TRIGGER update_project_units_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_units();

-- =============================================================================================================
-- PHASE 6: CREATE STORAGE BUCKETS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating storage buckets...';
END $$;

-- Create storage bucket for donation results
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'donation-results',
    'donation-results',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================================================
-- PHASE 7: ENABLE ROW LEVEL SECURITY
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Enabling Row Level Security...';
END $$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- =============================================================================================================
-- PHASE 8: CREATE RLS POLICIES
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating RLS policies...';
END $$;

-- =============================================
-- 8.1 PROJECTS POLICIES
-- =============================================

-- Public can view active and completed projects
CREATE POLICY "Public can view active projects"
    ON public.projects
    FOR SELECT
    USING (status = 'active' OR status = 'completed');


-- =============================================
-- 8.2 DONATIONS POLICIES
-- =============================================

-- Public can view successful donations
CREATE POLICY "Public can view confirmed donations"
    ON public.donations
    FOR SELECT
    USING (donation_status IN ('paid', 'confirmed', 'delivering', 'completed'));

-- Service role can insert donations (from WayForPay webhooks)
CREATE POLICY "Service role can insert donations"
    ON public.donations
    FOR INSERT
    WITH CHECK (true);

-- =============================================================================================================
-- PHASE 9: CREATE STORAGE POLICIES
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating storage policies...';
END $$;

-- Public can view result images
CREATE POLICY "Public Access - View result images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'donation-results');


-- =============================================================================================================
-- PHASE 10: GRANT PERMISSIONS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Granting permissions...';
END $$;

GRANT SELECT ON public.project_stats TO anon, authenticated;
GRANT SELECT ON public.public_donation_feed TO anon, authenticated;

-- =============================================================================================================
-- PHASE 11: ADD COMMENTS
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Adding comments...';
END $$;

-- Tables
COMMENT ON TABLE public.projects IS 'Stores NGO project information with funding goals and progress';
COMMENT ON TABLE public.donations IS 'Stores donation records linked to projects with payment details';

-- Columns
COMMENT ON COLUMN public.projects.is_long_term IS 'Indicates if the project has no fixed end date';
COMMENT ON COLUMN public.projects.target_units IS 'Target number of units to fund (NULL for projects without specific targets)';
COMMENT ON COLUMN public.donations.donation_public_id IS 'Public-facing donation ID in format: {project_id}-{XXXXXX}';
COMMENT ON COLUMN public.donations.amount IS 'Donation amount per unit in the specified currency';
COMMENT ON COLUMN public.donations.order_reference IS 'WayForPay order reference (format: DONATE-{project_id}-{timestamp})';
COMMENT ON COLUMN public.donations.donation_status IS 'Donation status: pending (awaiting payment), paid (payment successful), confirmed (NGO confirmed), delivering (items being delivered), completed (delivery completed), refunding (refund in progress), refunded (payment refunded)';
COMMENT ON COLUMN public.donations.locale IS 'User language preference at time of donation: en (English), zh (Chinese), ua (Ukrainian)';

-- Functions
COMMENT ON FUNCTION public.generate_donation_public_id IS 'Generates a unique public-facing donation ID in format: {project_id}-{XXXXXX} (e.g., 1-A1B2C3)';
COMMENT ON FUNCTION public.get_project_progress IS 'Returns detailed progress information for a project';
COMMENT ON FUNCTION public.get_recent_donations IS 'Returns recent donations for a project';
COMMENT ON FUNCTION public.is_project_goal_reached IS 'Checks if a project has reached its funding goal';
COMMENT ON FUNCTION public.get_donation_result_url IS 'Returns the public URL for a donation result image. Returns NULL if no image exists.';
COMMENT ON FUNCTION public.cleanup_expired_pending_donations IS 'Deletes pending donations that are older than 24 hours';
COMMENT ON FUNCTION public.update_project_units IS 'Automatically updates project current_units when donation status changes';

-- Views
COMMENT ON VIEW public.project_stats IS 'Aggregated project statistics including donation totals and progress';
COMMENT ON VIEW public.public_donation_feed IS 'Public view of donations with anonymized donor names for privacy';

-- Policies
COMMENT ON POLICY "Public can view active projects" ON public.projects IS 'Allows anonymous and authenticated users to view active and completed projects';
COMMENT ON POLICY "Public can view confirmed donations" ON public.donations IS 'Allows viewing of successful donations only (admin operations use service role to bypass RLS)';
COMMENT ON POLICY "Service role can insert donations" ON public.donations IS 'Allows WayForPay webhooks to insert donation records (service role bypasses RLS)';

-- =============================================================================================================
-- COMPLETION
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database reset and initialization complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- 2 tables created (projects, donations)';
    RAISE NOTICE '- 8 functions created';
    RAISE NOTICE '- 2 views created';
    RAISE NOTICE '- 2 triggers created';
    RAISE NOTICE '- 1 storage bucket created (donation-results)';
    RAISE NOTICE '- All RLS policies applied';
    RAISE NOTICE '- All storage policies applied';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Key Changes:';
    RAISE NOTICE '- projects.target_units is now NULLABLE';
    RAISE NOTICE '- WayForPay integration (order_reference)';
    RAISE NOTICE '- donation_status includes "pending" state';
    RAISE NOTICE '========================================';
END $$;
