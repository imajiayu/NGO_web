-- ============================================================================
-- 性能优化：market_orders 的 buyer RLS 策略 initplan 化
-- ============================================================================
-- 生成日期：2026-06-12
-- 依据：线上 get_advisors(performance) 的 auth_rls_initplan 告警（lint 0003）。
-- 问题：4 条 buyer 策略中的 `auth.uid()` 是裸调用，PostgreSQL 会对【每一行】重新求值，
--       大表查询时产生不必要开销。
-- 修复：用 `(select auth.uid())` 包裹，使其作为 InitPlan 只求值一次（Supabase 官方推荐）。
--       顺带把 "view own orders" 里同样每行求值的 `is_admin()` 也包成 `(select is_admin())`。
-- 原则：【逻辑完全等价、行为不变】——auth.uid()/is_admin() 均为 STABLE，单次求值与逐行
--       求值结果一致，仅改变求值次数。不触碰 "Admin can manage orders"（未被该 lint 命中）。
-- ============================================================================

-- SELECT：本人订单或管理员
DROP POLICY IF EXISTS "Buyers can view own orders" ON market_orders;
CREATE POLICY "Buyers can view own orders" ON market_orders
  FOR SELECT
  USING ((buyer_id = (select auth.uid())) OR (select is_admin()));

-- INSERT：仅能插入本人的 pending 订单
DROP POLICY IF EXISTS "Buyers can insert own pending orders" ON market_orders;
CREATE POLICY "Buyers can insert own pending orders" ON market_orders
  FOR INSERT TO authenticated
  WITH CHECK ((buyer_id = (select auth.uid())) AND (status = 'pending'));

-- UPDATE：本人 pending → widget_load_failed
DROP POLICY IF EXISTS "Buyers can update own pending to widget_load_failed" ON market_orders;
CREATE POLICY "Buyers can update own pending to widget_load_failed" ON market_orders
  FOR UPDATE TO authenticated
  USING ((buyer_id = (select auth.uid())) AND (status = 'pending'))
  WITH CHECK (status = 'widget_load_failed');

-- UPDATE：本人 pending → expired（买家取消）
DROP POLICY IF EXISTS "Buyers can cancel own pending order" ON market_orders;
CREATE POLICY "Buyers can cancel own pending order" ON market_orders
  FOR UPDATE TO authenticated
  USING ((buyer_id = (select auth.uid())) AND (status = 'pending'))
  WITH CHECK (status = 'expired');
