-- =============================================================================================================
-- Fix: update_project_units trigger to handle all donation statuses
-- =============================================================================================================
-- Problem: The trigger only checked for transitions from ('pending', 'refunding', 'refunded') to counted statuses.
--          New statuses like 'processing', 'fraud_check', 'widget_load_failed', etc. were not handled,
--          causing current_units not to increment when status changes from these states to 'paid'.
--
-- Solution:
--   1. Update trigger to handle ALL non-counted statuses when transitioning to counted statuses
--   2. Include 'refund_processing' in decrement logic
--   3. Recalculate all projects' current_units to fix existing data
--
-- Non-counted statuses (should NOT increment current_units):
--   - pending, processing, fraud_check, widget_load_failed (pre-payment/processing)
--   - expired, declined, failed (payment failed)
--   - refunding, refund_processing, refunded (refund states)
--
-- Counted statuses (should increment current_units):
--   - paid, confirmed, delivering, completed
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fixing update_project_units trigger...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- 1. DROP AND RECREATE THE TRIGGER FUNCTION
-- =============================================

DROP FUNCTION IF EXISTS public.update_project_units() CASCADE;

CREATE OR REPLACE FUNCTION public.update_project_units()
RETURNS TRIGGER AS $$
DECLARE
    -- Define status categories for clarity
    -- Counted statuses: donations that contribute to current_units
    counted_statuses TEXT[] := ARRAY['paid', 'confirmed', 'delivering', 'completed'];

    -- Non-counted statuses: donations that do NOT contribute to current_units
    non_counted_statuses TEXT[] := ARRAY[
        'pending', 'processing', 'fraud_check', 'widget_load_failed',  -- pre-payment/processing
        'expired', 'declined', 'failed',                                -- payment failed
        'refunding', 'refund_processing', 'refunded'                    -- refund states
    ];
BEGIN
    -- INSERT: Only count donations with counted status
    IF (TG_OP = 'INSERT') THEN
        IF NEW.donation_status = ANY(counted_statuses) THEN
            UPDATE public.projects
            SET current_units = current_units + 1
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;

    -- UPDATE: Handle status transitions
    ELSIF (TG_OP = 'UPDATE') THEN
        -- FROM non-counted TO counted -> increment
        IF OLD.donation_status = ANY(non_counted_statuses)
           AND NEW.donation_status = ANY(counted_statuses) THEN
            UPDATE public.projects
            SET current_units = current_units + 1
            WHERE id = NEW.project_id;

        -- FROM counted TO non-counted -> decrement
        ELSIF OLD.donation_status = ANY(counted_statuses)
              AND NEW.donation_status = ANY(non_counted_statuses) THEN
            UPDATE public.projects
            SET current_units = current_units - 1
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;

    -- DELETE: Decrement if deleting a counted donation
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.donation_status = ANY(counted_statuses) THEN
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

COMMENT ON FUNCTION public.update_project_units IS
'Automatically updates project current_units when donation status changes.
Counted statuses (increment): paid, confirmed, delivering, completed.
Non-counted statuses: pending, processing, fraud_check, widget_load_failed, expired, declined, failed, refunding, refund_processing, refunded.';

DO $$
BEGIN
    RAISE NOTICE '✓ Trigger function recreated with all status handling';
END $$;

-- =============================================
-- 2. RECALCULATE ALL PROJECTS'' CURRENT_UNITS
-- =============================================

DO $$
DECLARE
    project_record RECORD;
    correct_count INTEGER;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Recalculating current_units for all projects...';
    RAISE NOTICE '========================================';

    -- Loop through all projects
    FOR project_record IN
        SELECT id, project_name, current_units
        FROM public.projects
        ORDER BY id
    LOOP
        -- Count donations with counted statuses
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

            updated_count := updated_count + 1;
        ELSE
            RAISE NOTICE 'Project % (%): Already correct (%)',
                project_record.id,
                project_record.project_name,
                correct_count;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✓ Recalculation complete! Updated % projects.', updated_count;
END $$;

-- =============================================
-- 3. VERIFICATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes:';
    RAISE NOTICE '  ✓ Trigger now handles ALL donation statuses';
    RAISE NOTICE '  ✓ Transitions from processing/fraud_check/etc to paid now increment';
    RAISE NOTICE '  ✓ Transitions to refund_processing now decrement';
    RAISE NOTICE '  ✓ Existing project current_units recalculated';
    RAISE NOTICE '';
    RAISE NOTICE 'Counted statuses: paid, confirmed, delivering, completed';
    RAISE NOTICE 'Non-counted: pending, processing, fraud_check, widget_load_failed,';
    RAISE NOTICE '             expired, declined, failed, refunding, refund_processing, refunded';
    RAISE NOTICE '========================================';
END $$;
