/**
 * Email Utility Functions
 */

import { I18nText, Locale } from './types'

/**
 * Get localized text from i18n object
 */
export function getLocalizedText(i18nText: I18nText, locale: Locale): string {
  return i18nText[locale] || i18nText.en
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`
}

/**
 * Format donation IDs as HTML list
 */
export function formatDonationIdsHTML(donationIds: string[]): string {
  return donationIds.map(id => `<li><strong>${id}</strong></li>`).join('')
}

/**
 * Format donation IDs as plain text list
 */
export function formatDonationIdsText(donationIds: string[]): string {
  return donationIds.map(id => `- ${id}`).join('\n')
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, char => map[char])
}

/**
 * Get tracking URL for donation
 */
export function getTrackingUrl(locale: Locale): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://waytofutureua.org.ua'
  return `${baseUrl}/${locale}/track-donation`
}
