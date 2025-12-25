/**
 * Refund Success Email Template
 */

import { RefundSuccessEmailParams, EmailContent } from '../../types'
import { getLocalizedText, formatCurrency } from '../../utils'
import { createEmailLayout } from '../base/layout'
import {
  createDetailBox,
  createDetailRow,
  createDonationIdsList,
  createInfoBox,
  createSignature
} from '../base/components'
import { refundSuccessContent } from './content'
import { escapeHtml } from '../../utils'

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
    currency,
    refundReason
  } = params

  const t = refundSuccessContent[locale]
  const projectName = getLocalizedText(projectNameI18n, locale)

  // Build email content
  const contentHTML = `
    <p class="greeting">${t.greeting(escapeHtml(donorName))}</p>

    <p><strong>${t.confirmation}</strong></p>

    <p>${t.processed}</p>

    ${createDetailBox(`
      ${createDetailRow(t.refundAmountLabel, `<strong>${formatCurrency(refundAmount, currency)}</strong>`)}
      ${refundReason ? createDetailRow(t.reasonLabel, escapeHtml(refundReason)) : ''}
    `)}

    ${createDetailBox(`
      <div class="detail-row">
        <span class="label">${t.donationIdsLabel}</span>
      </div>
      ${createDonationIdsList(donationIds)}
    `)}

    ${createInfoBox(t.processingTime)}

    <div class="section">
      <p>${t.gratitude}</p>
      <p>${t.hopeToContinue}</p>
    </div>

    <p>${t.contact}</p>

    ${createSignature(locale)}
  `

  const html = createEmailLayout({
    title: t.title,
    content: contentHTML,
    locale
  })

  // Plain text version
  const text = `
${t.greeting(donorName)}

${t.confirmation}

${t.processed}

${t.refundAmountLabel} ${formatCurrency(refundAmount, currency)}
${refundReason ? `${t.reasonLabel} ${refundReason}` : ''}

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
