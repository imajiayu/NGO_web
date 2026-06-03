-- 回滚卡密支付（微信 / 支付宝，经 jeejia 发卡网）相关的全部数据库对象。
--
-- 背景：微信 / 支付宝支付改用 API 方案重做，原「卡密池」方案
-- （20260601000000_donation_card_keys）整体废弃。此迁移移除该方案引入的
-- 表、函数、触发器、索引与 RLS 策略，使数据库回到卡密功能引入之前的状态。
--
-- 全部使用 `if exists` / `cascade`，幂等：若远程从未应用过原迁移，
-- 本迁移同样可安全通过（不报错、无副作用）。

-- ============================================================
-- 业务函数（独立对象，需单独 drop）
-- ============================================================
drop function if exists public.redeem_donation_card_keys(text[], numeric, text);
drop function if exists public.release_donation_card_keys(text[], text);

-- ============================================================
-- 表（cascade 连带移除其上的 RLS 策略、索引 idx_donation_card_keys_order_ref、
-- 触发器 trg_touch_donation_card_keys）
-- ============================================================
drop table if exists public.donation_card_keys cascade;

-- ============================================================
-- 触发器函数（drop table 仅移除触发器本身，不移除其引用的函数，需单独 drop）
-- ============================================================
drop function if exists public.touch_donation_card_keys_updated_at();
