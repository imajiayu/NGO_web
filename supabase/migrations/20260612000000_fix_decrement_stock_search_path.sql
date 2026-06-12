-- ============================================
-- decrement_stock 补 SET search_path
-- ============================================
-- 背景：decrement_stock 是 SECURITY DEFINER 函数，但 20260328000000 定义时
-- 未设置 search_path。20260331400000 修复了 restore_stock 与触发器函数，
-- 唯独遗漏此函数。本迁移仅补 search_path，函数逻辑不变。

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
