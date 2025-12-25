/**
 * Resend Email Client
 */

import { Resend } from 'resend'

// Lazy initialization to allow dotenv to load first
let _resend: Resend | null = null

function getResendClient(): Resend {
  if (_resend) return _resend

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }

  _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export const resend = new Proxy({} as Resend, {
  get(target, prop) {
    const client = getResendClient()
    const value = client[prop as keyof Resend]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@waytofutureua.org.ua'
