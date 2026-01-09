-- =============================================================================================================
-- Protect is_long_term field from modification
-- =============================================================================================================
-- Description: Updates the trigger function to prevent modification of is_long_term after project creation
--              This field can only be set when creating a project, not during updates
-- Version: 1.0
-- Date: 2025-12-25
--
-- Protected fields (after this migration):
-- - id: Cannot be modified (system field)
-- - created_at: Cannot be modified (timestamp)
-- - aggregate_donations: Cannot be modified (donation behavior flag)
-- - is_long_term: Cannot be modified (project duration flag) ✨ NEW
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Protecting is_long_term field from modification...';
    RAISE NOTICE '========================================';
END $$;

-- Update trigger function to protect is_long_term field
CREATE OR REPLACE FUNCTION prevent_project_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 不允许修改 id
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot modify project id';
  END IF;

  -- 不允许修改 created_at
  IF OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify project created_at';
  END IF;

  -- 不允许修改 aggregate_donations（只能在创建时设置）
  IF OLD.aggregate_donations != NEW.aggregate_donations THEN
    RAISE EXCEPTION 'Cannot modify aggregate_donations after project creation';
  END IF;

  -- 不允许修改 is_long_term（只能在创建时设置）✨ NEW
  IF OLD.is_long_term != NEW.is_long_term THEN
    RAISE EXCEPTION 'Cannot modify is_long_term after project creation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function comment
COMMENT ON FUNCTION prevent_project_immutable_fields() IS
'Prevents modification of immutable project fields (id, created_at, aggregate_donations, is_long_term)';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'is_long_term field is now protected from modification';
    RAISE NOTICE '========================================';
END $$;
