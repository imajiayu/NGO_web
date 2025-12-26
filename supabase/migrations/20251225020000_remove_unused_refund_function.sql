-- =============================================================================================================
-- 删除未使用的退款数据库函数
-- =============================================================================================================
-- 说明：request_donation_refund 函数从未在项目中被使用
--
-- 实际退款实现：
--   - Server Action: app/actions/track-donation.ts requestRefund()
--   - 直接调用 WayForPay API
--   - 使用 service role client 更新状态
--
-- 删除的函数：
--   - request_donation_refund(p_donation_public_id, p_email) - 未使用的数据库退款函数
--
-- 日期：2025-12-25
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Removing unused refund database function...';
    RAISE NOTICE '========================================';
END $$;

-- 删除未使用的退款函数
DROP FUNCTION IF EXISTS request_donation_refund(TEXT, TEXT) CASCADE;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Deleted function:';
    RAISE NOTICE '  ✓ request_donation_refund (never used in code)';
    RAISE NOTICE '';
    RAISE NOTICE 'Refund implementation:';
    RAISE NOTICE '  → Server Action: requestRefund() in app/actions/track-donation.ts';
    RAISE NOTICE '  → Uses WayForPay API directly';
    RAISE NOTICE '  → Updates database via service role client';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Unused refund function removed!';
    RAISE NOTICE '========================================';
END $$;
