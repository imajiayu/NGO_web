/**
 * Analytics Ingest Route
 *
 * 接收前端 `lib/analytics/track.ts` 上报的页面浏览 / CTA 点击事件，
 * 通过 anon 角色 INSERT 进 `page_views` 表（RLS WITH CHECK 控制字段范围）。
 *
 * 失败一律静默吞：分析数据丢一两条比抛错影响用户体验更可接受。
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { logger } from '@/lib/logger'
import { getPublicClient } from '@/lib/supabase/action-clients'

const trackEventSchema = z.object({
  event_type: z.enum(['view', 'cta_click']),
  page_type: z.enum(['home', 'project', 'market_item', 'market_list', 'other']),
  entity_id: z.number().int().positive().optional().nullable(),
  path: z.string().min(1).max(200),
  locale: z.enum(['en', 'zh', 'ua']),
  session_id: z.string().min(8).max(64),
  referrer: z.string().max(500).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ ok: false }, { status: 204 })
    }

    const parsed = trackEventSchema.safeParse(body)
    if (!parsed.success) {
      logger.warn('API', 'Invalid track event payload', {
        issues: parsed.error.issues.slice(0, 3),
      })
      return NextResponse.json({ ok: false }, { status: 204 })
    }

    const data = parsed.data
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

    const supabase = getPublicClient()
    const { error } = await supabase.from('page_views').insert({
      event_type: data.event_type,
      page_type: data.page_type,
      entity_id: data.entity_id ?? null,
      path: data.path,
      locale: data.locale,
      session_id: data.session_id,
      user_agent: userAgent,
      referrer: data.referrer ?? null,
    })

    if (error) {
      logger.warn('API', 'page_views insert failed', {
        code: error.code,
        message: error.message,
      })
      return NextResponse.json({ ok: false }, { status: 204 })
    }

    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (error) {
    logger.errorWithStack('API', 'track route unexpected error', error)
    return NextResponse.json({ ok: false }, { status: 204 })
  }
}
