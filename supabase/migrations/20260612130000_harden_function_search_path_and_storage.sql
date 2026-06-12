-- ============================================================================
-- 安全硬化：函数 search_path + 触发器函数权限收紧 + 存储桶 list 策略收紧
-- ============================================================================
-- 生成日期：2026-06-12
-- 依据：线上 get_advisors(security) 实测 + 逐项对照业务代码裁决。
-- 原则：全部为「行为不变的纯收紧/硬化」，不改变任何业务逻辑。
--
-- 分组：
--   B 组 = 真实硬化（SECURITY DEFINER 函数补 search_path、触发器函数撤多余 EXECUTE、
--          donation-results 撤无人依赖的 public list 策略）
--   C 组 = 消除 lint 噪音（INVOKER 函数补 search_path，风险极低）
--   D 组 = market-order-results 撤 public list 策略
--          —— ⚠️ 必须与 app/actions/market-order-files.ts 的 TS 改动同时部署，详见文末注释
-- ============================================================================


-- ============================================================================
-- B 组：SECURITY DEFINER 函数补 SET search_path = public
-- ----------------------------------------------------------------------------
-- 背景：这些函数是 SECURITY DEFINER 但线上 proconfig=NULL（mutable search_path），
-- 构成 search_path 注入提权面。函数体仅访问 public 对象，SET search_path = public
-- 完全保持行为。其中 restore_stock / log_market_order_status_change 源于迁移
-- 20260331400000 从 P2-12 起【半失败中止】（`CREATE OR REPLACE ... RETURNS BOOLEAN`
-- 改返回类型报错），其 search_path 当年未落地；此处用 ALTER FUNCTION 补上——只改函数
-- 配置、不动返回类型，故不会重蹈 P2-12 的报错。详见 20260612000000 注释。
-- ============================================================================

ALTER FUNCTION public.restore_stock(p_item_id bigint, p_quantity integer)
  SET search_path = public;

ALTER FUNCTION public.log_donation_status_change()
  SET search_path = public;

ALTER FUNCTION public.log_market_order_status_change()
  SET search_path = public;

ALTER FUNCTION public.unsubscribe_email(p_email text)
  SET search_path = public;

ALTER FUNCTION public.upsert_email_subscription(p_email text, p_locale text)
  SET search_path = public;


-- ============================================================================
-- B 组：撤销触发器函数的多余 EXECUTE 授权
-- ----------------------------------------------------------------------------
-- log_donation_status_change / log_market_order_status_change 是触发器函数，
-- 由触发器机制调用（不依赖 EXECUTE 授权），绝不应经 PostgREST /rpc 直接暴露。
-- 无任何代码经 RPC 调用它们。撤销 anon/authenticated/public 的 EXECUTE 不影响触发器触发。
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.log_donation_status_change()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.log_market_order_status_change()
  FROM PUBLIC, anon, authenticated;


-- ============================================================================
-- B 组：撤销 donation-results 桶的 public list 策略
-- ----------------------------------------------------------------------------
-- 该桶为 public bucket：图片通过公开 URL（/object/public/...）直读，不经 RLS。
-- 唯一的 .list() 调用方是 getInternalClient()（service_role，app/actions/donation-result.ts），
-- service_role 绕过 RLS，不依赖此策略。故撤销「public 可 list 全桶」是安全的，
-- 公开图片展示不受影响，仅消除「可枚举全桶文件」的暴露面。
-- ============================================================================

DROP POLICY IF EXISTS "Public Access - View result images" ON storage.objects;


-- ============================================================================
-- C 组：INVOKER 函数补 SET search_path = public（消 lint 噪音，低优先）
-- ----------------------------------------------------------------------------
-- 这些以调用者权限运行（SECURITY INVOKER），search_path mutable 风险极低；
-- 补 search_path 纯为清除 function_search_path_mutable 告警，行为不变。
-- ============================================================================

ALTER FUNCTION public.generate_donation_public_id(project_id_input bigint)
  SET search_path = public;

ALTER FUNCTION public.prevent_donation_immutable_fields()
  SET search_path = public;

ALTER FUNCTION public.prevent_market_order_immutable_fields()
  SET search_path = public;

ALTER FUNCTION public.prevent_page_views_modify()
  SET search_path = public;

ALTER FUNCTION public.prevent_project_immutable_fields()
  SET search_path = public;

ALTER FUNCTION public.prevent_subscription_immutable_fields()
  SET search_path = public;

ALTER FUNCTION public.update_email_subscription_updated_at()
  SET search_path = public;

ALTER FUNCTION public.update_project_units()
  SET search_path = public;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;


-- ============================================================================
-- D 组：撤销 market-order-results 桶的 public list 策略
-- ----------------------------------------------------------------------------
-- ⚠️⚠️⚠️ 破坏性前置条件 ⚠️⚠️⚠️
-- 与 donation-results 不同，market-order-results 的 .list() 当前调用方是
-- createServerClient()（anon，app/actions/market-order-files.ts → getPublicOrderProofFiles）。
-- 直接撤销此策略会让「义卖公开凭证展示」失效（anon 无法 list）。
--
-- 因此本段【必须】与以下 TS 改动同时部署（代码先行或同批）：
--   将 getPublicOrderProofFiles() 内的 createServerClient() 改为 getInternalClient()
--   （service_role），与 donation-result.ts 的做法对齐。service_role 绕过 RLS，
--   不依赖 public list 策略；图片仍走公开 URL 直读，不受影响。
--
-- 若尚未部署该 TS 改动，请【注释掉下面这行】再 push，待代码上线后再单独补这条。
-- ============================================================================

DROP POLICY IF EXISTS "Public access to market-order-results" ON storage.objects;
