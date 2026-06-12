-- ============================================
-- decrement_stock 补 SET search_path
-- ============================================
-- 背景：decrement_stock 是 SECURITY DEFINER 函数，但 20260328000000 定义时
-- 未设置 search_path。本迁移仅补 search_path，函数逻辑不变。
--
-- 注（2026-06-12 核对线上后更正）：迁移 20260331400000 虽记录为「已应用」，实际是
-- 从第二条语句起【半失败中止】——P2-12 的 `CREATE OR REPLACE FUNCTION restore_stock(...)
-- RETURNS BOOLEAN` 试图改变已有函数返回类型（原为 VOID），PostgreSQL 直接报错
-- "cannot change return type of existing function"，导致其后的语句全部未执行。
-- 线上指纹印证：P2-10（total_amount 约束，在报错前）已生效；而 P2-12 之后的三项
--   · restore_stock 仍为 VOID + mutable search_path
--   · buyer_id 外键仍为 NO ACTION（非 P2-13 期望的 ON DELETE RESTRICT）
--   · log_market_order_status_change 仍为 mutable search_path
-- 均未落地。本迁移只补 decrement_stock 的 search_path；restore_stock 与
-- log_market_order_status_change 的 search_path 由 20260612130000 用 ALTER FUNCTION 补齐。
-- 至于 restore_stock 的 BOOLEAN 返回类型与 buyer_id 的 ON DELETE RESTRICT，经评估对线上
-- 行为无实际影响（调用方只判 error；NO ACTION 与 RESTRICT 对「删除有订单的用户」阻止行为等价），
-- 【有意保留为线上现状，不再修复】，以避免对支付回滚关键函数做 DROP+CREATE 的回归风险。

CREATE OR REPLACE FUNCTION decrement_stock(
  p_item_id BIGINT,
  p_quantity INT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rows_affected INT;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'decrement_stock: quantity must be positive, got %', p_quantity;
  END IF;

  UPDATE market_items
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_item_id
    AND stock_quantity >= p_quantity
    AND status = 'on_sale';

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- 权限保持不变（仅 service_role）
REVOKE EXECUTE ON FUNCTION decrement_stock FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock TO service_role;
