-- 修复管理员 RLS 策略
-- 问题：之前的 WITH CHECK 子查询存在列引用歧义，导致 error=21000

-- ============================================
-- Projects 表策略修复
-- ============================================

-- 删除有问题的更新策略
DROP POLICY IF EXISTS "Admins can update projects" ON projects;

-- 重新创建更新策略（简化版本）
-- 说明：应用层已经在 admin.ts 中过滤掉了不应修改的字段
-- RLS 只需要检查权限，不需要检查字段修改限制
CREATE POLICY "Admins can update projects"
ON projects FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================
-- Donations 表策略修复
-- ============================================

-- 删除有问题的更新策略
DROP POLICY IF EXISTS "Admins can update donation status" ON donations;

-- 重新创建更新策略（简化版本）
-- 说明：允许管理员更新 donation_status 和 donation_result_url 字段
-- 状态转换验证在应用层（admin.ts）中处理
CREATE POLICY "Admins can update donation status"
ON donations FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================
-- 添加触发器来防止修改关键字段（可选的额外保护）
-- ============================================

-- Projects 表：防止修改 id, created_at
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_project_immutable_fields_trigger ON projects;
CREATE TRIGGER prevent_project_immutable_fields_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION prevent_project_immutable_fields();

-- Donations 表：防止修改关键字段
CREATE OR REPLACE FUNCTION prevent_donation_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 不允许修改这些关键字段
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot modify donation id';
  END IF;

  IF OLD.donation_public_id != NEW.donation_public_id THEN
    RAISE EXCEPTION 'Cannot modify donation_public_id';
  END IF;

  IF OLD.project_id != NEW.project_id THEN
    RAISE EXCEPTION 'Cannot modify project_id';
  END IF;

  IF OLD.donor_name != NEW.donor_name THEN
    RAISE EXCEPTION 'Cannot modify donor_name';
  END IF;

  IF OLD.donor_email != NEW.donor_email THEN
    RAISE EXCEPTION 'Cannot modify donor_email';
  END IF;

  IF OLD.amount != NEW.amount THEN
    RAISE EXCEPTION 'Cannot modify amount';
  END IF;

  IF OLD.order_reference != NEW.order_reference THEN
    RAISE EXCEPTION 'Cannot modify order_reference';
  END IF;

  IF OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_donation_immutable_fields_trigger ON donations;
CREATE TRIGGER prevent_donation_immutable_fields_trigger
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_donation_immutable_fields();

-- ============================================
-- 注释
-- ============================================

COMMENT ON POLICY "Admins can update projects" ON projects IS
'Admins can update projects. Immutable fields (id, created_at) are protected by trigger.';

COMMENT ON POLICY "Admins can update donation status" ON donations IS
'Admins can update donation status and result URL. Immutable fields are protected by trigger. Status transition validation is handled in application layer.';

COMMENT ON FUNCTION prevent_project_immutable_fields() IS
'Prevents modification of immutable project fields (id, created_at)';

COMMENT ON FUNCTION prevent_donation_immutable_fields() IS
'Prevents modification of immutable donation fields (id, donation_public_id, project_id, donor info, amount, order_reference, created_at)';
