/**
 * Client-side analytics tracking helper.
 *
 * 用法：
 *   trackEvent({ event_type: 'view', page_type: 'home', path, locale })
 *   trackEvent({ event_type: 'cta_click', page_type: 'project', entity_id: 3, path, locale })
 *
 * 设计原则：对用户零感知。
 * - 完全异步、不阻塞调用方
 * - sendBeacon 优先（页面卸载场景更可靠），降级 fetch keepalive
 * - 任何失败都静默吞，绝不抛出
 * - session_id 存 sessionStorage（关浏览器即丢，对应"一次访问"的会话语义）
 * - 同 (event_type|page_type|entity_id|path) 在 30 秒内的重复调用自动去重
 *   防 React StrictMode 双调用 + 客户端路由抖动 + 用户快速来回切换
 */

const SESSION_STORAGE_KEY = 'wtf_analytics_sid'
const DEDUPE_WINDOW_MS = 30_000

const recentEvents = new Map<string, number>()

export type PageType = 'home' | 'project' | 'market_item' | 'market_list' | 'other'
export type EventType = 'view' | 'cta_click'

export interface TrackEventInput {
  event_type: EventType
  page_type: PageType
  entity_id?: number | null
  path: string
  locale: 'en' | 'zh' | 'ua'
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    let sid = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!sid) {
      sid = generateSessionId()
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, sid)
    }
    return sid
  } catch {
    return null
  }
}

function shouldSkipDuplicate(key: string): boolean {
  const now = Date.now()
  const last = recentEvents.get(key)
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) {
    return true
  }
  recentEvents.set(key, now)
  if (recentEvents.size > 50) {
    for (const [k, t] of recentEvents) {
      if (now - t >= DEDUPE_WINDOW_MS) recentEvents.delete(k)
    }
  }
  return false
}

export function trackEvent(input: TrackEventInput): void {
  if (typeof window === 'undefined') return

  const sessionId = getSessionId()
  if (!sessionId) return

  const dedupeKey = `${input.event_type}|${input.page_type}|${input.entity_id ?? ''}|${input.path}`
  if (shouldSkipDuplicate(dedupeKey)) return

  const payload = JSON.stringify({
    event_type: input.event_type,
    page_type: input.page_type,
    entity_id: input.entity_id ?? null,
    path: input.path,
    locale: input.locale,
    session_id: sessionId,
    referrer: document.referrer ? document.referrer.slice(0, 500) : null,
  })

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      const ok = navigator.sendBeacon('/api/track', blob)
      if (ok) return
    }
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // swallow — analytics must never break the page
  }
}
