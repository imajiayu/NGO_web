-- =============================================================================================================
-- 限制管理员状态更新权限
-- =============================================================================================================
-- 目的：确保管理员只能修改业务流程中的状态（paid/confirmed/delivering/completed）
--       退款状态（refunding/refund_processing/refunded）由 WayForPay API 自动处理
--
-- 变更内容：
--   1. 更新触发器，添加状态转换验证
--   2. 只允许以下状态转换：
--      - paid → confirmed
--      - confirmed → delivering
--      - delivering → completed
--   3. 禁止管理员修改任何退款相关状态
--
-- 安全性：
--   ✅ 数据库级别强制执行，即使应用层绕过也无效
--   ✅ 防止管理员意外或恶意修改退款状态
--   ✅ 保持退款状态与 WayForPay 一致性
-- =============================================================================================================

-- =============================================
-- 更新 Donations 表触发器：添加状态转换验证
-- =============================================

CREATE OR REPLACE FUNCTION prevent_donation_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 不允许修改这些关键字段（保持原有逻辑）
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

  -- 新增：验证状态转换（仅当状态被修改时）
  IF OLD.donation_status != NEW.donation_status THEN
    -- 检查是否由管理员发起（authenticated 用户）
    -- 如果是服务角色（绕过 RLS），允许任意状态转换（用于 Webhook 等）
    IF auth.uid() IS NOT NULL THEN
      -- 管理员只能执行以下状态转换
      IF NOT (
        (OLD.donation_status = 'paid' AND NEW.donation_status = 'confirmed') OR
        (OLD.donation_status = 'confirmed' AND NEW.donation_status = 'delivering') OR
        (OLD.donation_status = 'delivering' AND NEW.donation_status = 'completed')
      ) THEN
        RAISE EXCEPTION 'Invalid status transition: % → %. Admins can only update: paid→confirmed, confirmed→delivering, delivering→completed. Refund statuses are handled automatically by WayForPay.',
          OLD.donation_status, NEW.donation_status;
      END IF;
    END IF;
    -- 如果是服务角色（auth.uid() IS NULL），允许任意状态转换
    -- 这确保 Webhook 和退款逻辑可以正常工作
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器已存在，无需重新创建
-- 只需更新函数即可

-- =============================================
-- 更新注释
-- =============================================

COMMENT ON FUNCTION prevent_donation_immutable_fields() IS
'Prevents modification of immutable donation fields and enforces status transition rules.
- Admins can only perform: paid→confirmed, confirmed→delivering, delivering→completed
- Service role (webhooks) can perform any status transition
- Refund statuses are managed by WayForPay API only';

-- =============================================
-- 验证
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Donation Status Update Restrictions Applied!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin Status Transitions (ALLOWED):';
  RAISE NOTICE '  ✓ paid → confirmed';
  RAISE NOTICE '  ✓ confirmed → delivering';
  RAISE NOTICE '  ✓ delivering → completed';
  RAISE NOTICE '';
  RAISE NOTICE 'Restricted Transitions (AUTOMATIC ONLY):';
  RAISE NOTICE '  ✗ Any refund-related status changes';
  RAISE NOTICE '  ✗ pending → paid (WayForPay webhook)';
  RAISE NOTICE '  ✗ paid/confirmed/delivering → refunding (User request + WayForPay API)';
  RAISE NOTICE '  ✗ refunding → refund_processing/refunded (WayForPay API)';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  🔒 Database-level enforcement';
  RAISE NOTICE '  🔒 Service role can bypass (for webhooks)';
  RAISE NOTICE '  🔒 Admins cannot modify refund statuses';
  RAISE NOTICE '========================================';
END $$;
