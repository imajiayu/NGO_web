-- 更新触发器函数，保护 aggregate_donations 字段不被修改
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新注释
COMMENT ON FUNCTION prevent_project_immutable_fields() IS
'Prevents modification of immutable project fields (id, created_at, aggregate_donations)';
