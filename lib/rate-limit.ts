/**
 * 轻量级内存速率限制器
 *
 * 适用于 Vercel Serverless — 同一实例内有效。
 * 多实例间不共享，作为 Supabase Auth 内建保护之上的补充层。
 * 如需跨实例限制，可替换为 Upstash Redis + @upstash/ratelimit。
 */

import { headers } from 'next/headers'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// 定期清理过期条目，防止内存泄漏
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 分钟
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * 检查速率限制
 * @returns true = 允许, false = 超限
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxAttempts) return false
  entry.count++
  return true
}

/**
 * 取客户端 IP（用于按 IP 限流）。
 * 优先 x-forwarded-for 首段，回退 x-real-ip，再回退 'unknown'。
 */
export async function getClientIP(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
