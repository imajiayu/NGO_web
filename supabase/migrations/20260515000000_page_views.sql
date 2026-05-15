-- ============================================
-- page_views: 页面浏览 + CTA 点击事件表（append-only）
--
-- 用途：admin 后台转化漏斗分析。三类事件源：
--   1. 页面浏览（首页 / 项目详情页 / 商品详情页 / 商品列表页）
--   2. CTA 点击（项目页的"提交捐赠"按钮 + 商品页的"立即购买"按钮）
--   3. 与 donations / market_orders 联合可计算"曝光 → 意图 → 成功"漏斗
--
-- 写入：匿名访客通过 /api/track 路由处理器 + anon 角色直接 INSERT，RLS WITH CHECK 限制字段范围。
-- 读取：仅 admin（is_admin() = true）。
-- 修改：append-only，UPDATE/DELETE 一律触发器拒绝（包括 service_role）。
-- 保留：永久（无 cron 清理，遵循产品决策）。
-- ============================================

BEGIN;

CREATE TABLE public.page_views (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'cta_click')),
  page_type TEXT NOT NULL CHECK (page_type IN ('home', 'project', 'market_item', 'market_list', 'other')),
  entity_id INTEGER,                                       -- project_id 或 item_id；home/market_list/other 时为 NULL
  path TEXT NOT NULL CHECK (length(path) <= 200),
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh', 'ua')),
  session_id TEXT NOT NULL CHECK (length(session_id) BETWEEN 8 AND 64),
  user_agent TEXT CHECK (user_agent IS NULL OR length(user_agent) <= 500),
  referrer TEXT CHECK (referrer IS NULL OR length(referrer) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.page_views IS 'Append-only analytics events: page views + CTA clicks. Anonymous INSERT via /api/track, admin SELECT only.';
COMMENT ON COLUMN public.page_views.event_type IS 'view = page view, cta_click = CTA button click (donation submit / market buy now)';
COMMENT ON COLUMN public.page_views.page_type IS 'Page bucket: home / project / market_item / market_list / other';
COMMENT ON COLUMN public.page_views.entity_id IS 'project_id when page_type=project, item_id when page_type=market_item, NULL otherwise';
COMMENT ON COLUMN public.page_views.session_id IS 'Client-generated UUID stored in sessionStorage; enables session-level dedup without persistent user identifier';

CREATE INDEX idx_page_views_lookup ON public.page_views (event_type, page_type, entity_id, created_at DESC);
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_session ON public.page_views (session_id);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert events"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('view', 'cta_click')
    AND page_type IN ('home', 'project', 'market_item', 'market_list', 'other')
    AND locale IN ('en', 'zh', 'ua')
  );

CREATE POLICY "Admins can view all events"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE OR REPLACE FUNCTION public.prevent_page_views_modify()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  RAISE EXCEPTION 'page_views is append-only — UPDATE/DELETE not allowed';
END;
$$;

ALTER FUNCTION public.prevent_page_views_modify() OWNER TO postgres;

CREATE TRIGGER prevent_page_views_update_trigger
  BEFORE UPDATE ON public.page_views
  FOR EACH ROW EXECUTE FUNCTION public.prevent_page_views_modify();

CREATE TRIGGER prevent_page_views_delete_trigger
  BEFORE DELETE ON public.page_views
  FOR EACH ROW EXECUTE FUNCTION public.prevent_page_views_modify();

COMMIT;
