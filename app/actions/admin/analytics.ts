'use server'

import { getTranslatedText } from '@/lib/i18n-utils'
import { logger } from '@/lib/logger'
import { getAdminClient } from '@/lib/supabase/action-clients'
import { getAllProjectsWithStats } from '@/lib/supabase/queries'
import type { AppLocale, ProjectStats } from '@/types'

/**
 * Analytics aggregation for admin dashboard.
 *
 * Pulls `page_views` events in the selected time window and joins against
 * `donations` / `market_orders` to compute exposure → CTA-click → success funnels.
 *
 * Strategy: fetch raw events in the window, aggregate in memory.
 * page_views table is small-ish (no retention cleanup) but volumes are modest
 * for this product, so a single SELECT + in-memory bucket-fill is simpler than
 * round-tripping a SQL aggregate RPC.
 */

export type AnalyticsTimeRange = '7d' | '30d' | '90d' | 'all'

export interface AnalyticsFunnelRow {
  entity_id: number
  name: string
  views: number
  viewsDeduped: number
  ctaClicks: number
  successCount: number
}

export interface AnalyticsSummary {
  timeRange: AnalyticsTimeRange
  fromIso: string | null
  generatedAt: string
  home: { views: number; viewsDeduped: number }
  marketList: { views: number; viewsDeduped: number }
  projects: AnalyticsFunnelRow[]
  marketItems: AnalyticsFunnelRow[]
}

const SUCCESS_DONATION_STATUSES = ['paid', 'confirmed', 'delivering', 'completed'] as const
const SUCCESS_MARKET_STATUSES = ['paid', 'shipped', 'completed'] as const

type PageType = 'home' | 'project' | 'market_item' | 'market_list' | 'other'

interface PageViewRow {
  event_type: 'view' | 'cta_click'
  page_type: PageType
  entity_id: number | null
  session_id: string
}

function rangeToIso(range: AnalyticsTimeRange): string | null {
  if (range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export async function getAnalyticsSummary(
  range: AnalyticsTimeRange = '30d'
): Promise<AnalyticsSummary> {
  const supabase = await getAdminClient()
  const fromIso = rangeToIso(range)

  let pageViewsQuery = supabase
    .from('page_views')
    .select('event_type, page_type, entity_id, session_id')
  if (fromIso) pageViewsQuery = pageViewsQuery.gte('created_at', fromIso)
  const { data: pageViewsRaw, error: pvError } = await pageViewsQuery
  if (pvError) {
    logger.error('ADMIN', 'page_views query failed', { error: pvError.message })
    throw pvError
  }
  const pageViews = (pageViewsRaw ?? []) as PageViewRow[]

  // donations: pull (project_id, order_reference) for successful statuses
  let donationsQuery = supabase
    .from('donations')
    .select('project_id, order_reference')
    .in('donation_status', [...SUCCESS_DONATION_STATUSES])
  if (fromIso) donationsQuery = donationsQuery.gte('created_at', fromIso)
  const { data: donationsRaw, error: donationError } = await donationsQuery
  if (donationError) {
    logger.error('ADMIN', 'donations query failed', { error: donationError.message })
    throw donationError
  }
  const donations = (donationsRaw ?? []) as Array<{
    project_id: number
    order_reference: string
  }>

  // market_orders: count per item_id for successful statuses
  let ordersQuery = supabase
    .from('market_orders')
    .select('item_id, id')
    .in('status', [...SUCCESS_MARKET_STATUSES])
  if (fromIso) ordersQuery = ordersQuery.gte('created_at', fromIso)
  const { data: ordersRaw, error: ordersError } = await ordersQuery
  if (ordersError) {
    logger.error('ADMIN', 'market_orders query failed', { error: ordersError.message })
    throw ordersError
  }
  const orders = (ordersRaw ?? []) as Array<{ item_id: number; id: number }>

  const projects = (await getAllProjectsWithStats()) as ProjectStats[]

  const { data: itemsRaw, error: itemsError } = await supabase
    .from('market_items')
    .select('id, title_i18n')
  if (itemsError) {
    logger.error('ADMIN', 'market_items query failed', { error: itemsError.message })
    throw itemsError
  }
  const marketItems = (itemsRaw ?? []) as Array<{
    id: number
    title_i18n: Record<string, string> | null
  }>

  // ── aggregate page_views by (event_type, page_type, entity_id) ──
  const buckets = new Map<string, { raw: number; sessions: Set<string> }>()
  for (const pv of pageViews) {
    const key = `${pv.event_type}|${pv.page_type}|${pv.entity_id ?? ''}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { raw: 0, sessions: new Set() }
      buckets.set(key, bucket)
    }
    bucket.raw += 1
    bucket.sessions.add(pv.session_id)
  }

  function lookup(
    eventType: 'view' | 'cta_click',
    pageType: PageType,
    entityId: number | null
  ): { raw: number; dedup: number } {
    const bucket = buckets.get(`${eventType}|${pageType}|${entityId ?? ''}`)
    return { raw: bucket?.raw ?? 0, dedup: bucket?.sessions.size ?? 0 }
  }

  // ── donation success: distinct order_reference per project_id ──
  const projectSuccessRefs = new Map<number, Set<string>>()
  for (const d of donations) {
    let set = projectSuccessRefs.get(d.project_id)
    if (!set) {
      set = new Set()
      projectSuccessRefs.set(d.project_id, set)
    }
    set.add(d.order_reference)
  }

  // ── market order success: count per item_id ──
  const itemSuccessCount = new Map<number, number>()
  for (const o of orders) {
    itemSuccessCount.set(o.item_id, (itemSuccessCount.get(o.item_id) ?? 0) + 1)
  }

  const homeStats = lookup('view', 'home', null)
  const marketListStats = lookup('view', 'market_list', null)

  const projectRows: AnalyticsFunnelRow[] = projects
    .filter((p) => p.id !== null && p.id !== undefined)
    .map((p) => {
      const id = p.id as number
      const v = lookup('view', 'project', id)
      const c = lookup('cta_click', 'project', id)
      return {
        entity_id: id,
        name:
          getTranslatedText(p.project_name_i18n, 'en' as AppLocale) || `Project ${id}`,
        views: v.raw,
        viewsDeduped: v.dedup,
        ctaClicks: c.raw,
        successCount: projectSuccessRefs.get(id)?.size ?? 0,
      }
    })
    .sort((a, b) => a.entity_id - b.entity_id)

  const marketRows: AnalyticsFunnelRow[] = marketItems
    .map((item) => {
      const v = lookup('view', 'market_item', item.id)
      const c = lookup('cta_click', 'market_item', item.id)
      const title =
        (item.title_i18n &&
          (item.title_i18n.en || item.title_i18n.zh || item.title_i18n.ua)) ||
        `Item ${item.id}`
      return {
        entity_id: item.id,
        name: title,
        views: v.raw,
        viewsDeduped: v.dedup,
        ctaClicks: c.raw,
        successCount: itemSuccessCount.get(item.id) ?? 0,
      }
    })
    .sort((a, b) => a.entity_id - b.entity_id)

  return {
    timeRange: range,
    fromIso,
    generatedAt: new Date().toISOString(),
    home: { views: homeStats.raw, viewsDeduped: homeStats.dedup },
    marketList: { views: marketListStats.raw, viewsDeduped: marketListStats.dedup },
    projects: projectRows,
    marketItems: marketRows,
  }
}
