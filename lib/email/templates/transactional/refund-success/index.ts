/**
 * Refund Success Email Template - Website UI Style
 */

import { RefundSuccessEmailParams, EmailContent } from '../../../types'
import { getLocalizedText, formatCurrency } from '../../../utils'
import { createEmailLayout } from '../../base/layout'
import {
  createDetailBox,
  createDonationIdsList,
  createInfoBox,
  createSignature,
  createErrorBox
} from '../../base/components'
import { refundSuccessContent } from './content'
import { escapeHtml } from '../../../utils'

/**
 * Generate refund success email content
 */
export function generateRefundSuccessEmail(params: RefundSuccessEmailParams): EmailContent {
  const {
    locale,
    donorName,
    projectNameI18n,
    donationIds,
    refundAmount,
    currency
  } = params

  const t = refundSuccessContent[locale]
  const projectName = getLocalizedText(projectNameI18n, locale)

  // Badge text for header
  const badgeText = {
    en: 'Refund Processed',
    zh: '退款已处理',
    ua: 'Повернення оброблено'
  }[locale]

  // Build email content
  const contentHTML = `
    <p style="color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
      ${t.greeting(escapeHtml(donorName))}
    </p>

    <p style="color: rgba(255,255,255,0.75); font-size: 16px; line-height: 1.7; margin: 0 0 28px;">
      <strong style="color: #ffffff;">${t.confirmation}</strong>
    </p>

    <p style="color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
      ${t.processed}
    </p>

    <!-- Refund Amount Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%); border: 1px solid rgba(239,68,68,0.3); border-radius: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: rgba(255,255,255,0.7); font-weight: 600; font-size: 14px;">${t.refundAmountLabel}</td>
              <td align="right" style="font-weight: 700; color: #f87171; font-size: 24px;">${formatCurrency(refundAmount, currency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Donation IDs -->
    ${createDetailBox(`
      <p style="color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">${t.donationIdsLabel}</p>
      ${createDonationIdsList(donationIds)}
    `)}

    ${createInfoBox(t.processingTime)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
      <tr>
        <td>
          <p style="color: rgba(255,255,255,0.75); font-size: 16px; line-height: 1.7; margin: 0 0 16px;">
            ${t.gratitude}
          </p>
          <p style="color: rgba(255,255,255,0.75); font-size: 16px; line-height: 1.7; margin: 0;">
            ${t.hopeToContinue}
          </p>
        </td>
      </tr>
    </table>

    <p style="color: rgba(255,255,255,0.75); font-size: 16px; line-height: 1.7; margin: 28px 0 0;">
      ${t.contact}
    </p>

    ${createSignature(locale)}
  `

  const html = createEmailLayout({
    title: t.title,
    content: contentHTML,
    locale,
    badge: badgeText
  })

  // Plain text version
  const text = `
${t.greeting(donorName)}

${t.confirmation}

${t.processed}

${t.refundAmountLabel} ${formatCurrency(refundAmount, currency)}

${t.donationIdsLabel}
${donationIds.map(id => `- ${id}`).join('\n')}

${t.processingTime}

${t.gratitude}

${t.hopeToContinue}

${t.contact}
  `.trim()

  return {
    subject: t.subject,
    html,
    text
  }
}
