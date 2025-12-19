-- =============================================================================================================
-- Fix: update_project_units trigger to handle 'refunding' status
--
-- Problem: When donation status changes from paid/confirmed/delivering/completed to 'refunding',
--          the current_units was not decremented, causing incorrect progress calculation.
--
-- Solution:
--   1. Update trigger to decrement current_units when transitioning to 'refunding' OR 'refunded'
--   2. Recalculate all projects' current_units to fix existing data
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Fixing refunding trigger and recalculating project units...';
END $$;

-- =============================================
-- 1. DROP AND RECREATE THE TRIGGER FUNCTION
-- =============================================

DROP FUNCTION IF EXISTS public.update_project_units() CASCADE;

CREATE OR REPLACE FUNCTION public.update_project_units()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: Only count non-pending/non-refunding/non-refunded donations
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
        IF OLD.donation_status IN ('pending', 'refunding', 'refunded')
           AND NEW.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
            UPDATE public.projects
            SET current_units = current_units + 1
            WHERE id = NEW.project_id;

        -- FROM paid/confirmed/delivering/completed TO refunding/refunded -> decrement
        ELSIF OLD.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
              AND NEW.donation_status IN ('refunding', 'refunded') THEN
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

-- Recreate the trigger
CREATE TRIGGER update_project_units_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_units();

COMMENT ON FUNCTION public.update_project_units IS 'Automatically updates project current_units when donation status changes. Counts only: paid, confirmed, delivering, completed. Excludes: pending, refunding, refunded.';

-- =============================================
-- 2. RECALCULATE ALL PROJECTS' CURRENT_UNITS
-- =============================================

DO $$
DECLARE
    project_record RECORD;
    correct_count INTEGER;
BEGIN
    RAISE NOTICE 'Recalculating current_units for all projects...';

    -- Loop through all projects
    FOR project_record IN
        SELECT id, project_name, current_units
        FROM public.projects
        ORDER BY id
    LOOP
        -- Count donations with valid statuses
        SELECT COUNT(*) INTO correct_count
        FROM public.donations
        WHERE project_id = project_record.id
          AND donation_status IN ('paid', 'confirmed', 'delivering', 'completed');

        -- Update if different
        IF project_record.current_units != correct_count THEN
            RAISE NOTICE 'Project % (%): Correcting % -> %',
                project_record.id,
                project_record.project_name,
                project_record.current_units,
                correct_count;

            UPDATE public.projects
            SET current_units = correct_count
            WHERE id = project_record.id;
        ELSE
            RAISE NOTICE 'Project % (%): Already correct (%)',
                project_record.id,
                project_record.project_name,
                correct_count;
        END IF;
    END LOOP;

    RAISE NOTICE 'Recalculation complete!';
END $$;

-- =============================================
-- 3. VERIFICATION QUERY
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '=== Verification ===';
    RAISE NOTICE 'Run this query to verify the fix:';
    RAISE NOTICE 'SELECT p.id, p.project_name, p.current_units, COUNT(d.id) as calculated_units';
    RAISE NOTICE 'FROM projects p';
    RAISE NOTICE 'LEFT JOIN donations d ON p.id = d.project_id';
    RAISE NOTICE '  AND d.donation_status IN (''paid'', ''confirmed'', ''delivering'', ''completed'')';
    RAISE NOTICE 'GROUP BY p.id';
    RAISE NOTICE 'ORDER BY p.id;';
END $$;
