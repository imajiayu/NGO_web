-- =============================================================================================================
-- 清理旧架构遗留的无用函数
-- =============================================================================================================
-- 说明：这些函数与已删除的 pending_payments 表相关，或已被新函数替代
--
-- 删除的函数：
--   1. update_project_units_on_donation - 已被 update_project_units() 触发器替代
--   2. cleanup_expired_pending_payments - pending_payments 表已删除，使用 cleanup_expired_pending_donations() 替代
--   3. update_pending_payment_expires_at - pending_payments 表已删除
--
-- 日期：2025-12-25
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Cleaning up legacy functions...';
    RAISE NOTICE '========================================';
END $$;

-- 删除旧的项目单位更新函数（已被触发器替代）
DROP FUNCTION IF EXISTS update_project_units_on_donation CASCADE;

-- 删除与 pending_payments 表相关的函数（该表已被删除）
DROP FUNCTION IF EXISTS cleanup_expired_pending_payments CASCADE;
DROP FUNCTION IF EXISTS update_pending_payment_expires_at CASCADE;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Deleted functions:';
    RAISE NOTICE '  ✓ update_project_units_on_donation (replaced by trigger)';
    RAISE NOTICE '  ✓ cleanup_expired_pending_payments (table removed)';
    RAISE NOTICE '  ✓ update_pending_payment_expires_at (table removed)';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Legacy functions cleanup completed!';
    RAISE NOTICE '========================================';
END $$;
