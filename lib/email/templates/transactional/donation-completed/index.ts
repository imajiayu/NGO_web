/**
 * Donation Completed Email Template
 */

import { DonationCompletedEmailParams, EmailContent } from '../../../types'
import { getLocalizedText, formatCurrency, getTrackingUrl } from '../../../utils'
import { createEmailLayout } from '../../base/layout'
import {
  createDetailBox,
  createDetailRow,
  createDonationIdsList,
  createSuccessBox,
  createImage,
  createButton,
  createSignature
} from '../../base/components'
import { donationCompletedContent } from './content'
import { escapeHtml } from '../../../utils'

/**
 * Generate donation completed email content
 */
export function generateDonationCompletedEmail(params: DonationCompletedEmailParams): EmailContent {
  const {
    locale,
    donorName,
    projectNameI18n,
    locationI18n,
    unitNameI18n,
    donationIds,
    quantity,
    totalAmount,
    currency,
    resultImageUrl
  } = params

  const t = donationCompletedContent[locale]
  const projectName = getLocalizedText(projectNameI18n, locale)
  const location = getLocalizedText(locationI18n, locale)
  const unitName = getLocalizedText(unitNameI18n, locale)
  const trackingUrl = getTrackingUrl(locale)

  // Build email content
  const contentHTML = `
    <p class="greeting">${t.greeting(escapeHtml(donorName))}</p>

    ${createSuccessBox(t.congratulations, t.completed)}

    <p>${t.impact}</p>

    ${createDetailBox(`
      ${createDetailRow(t.projectLabel, escapeHtml(projectName))}
      ${createDetailRow(t.locationLabel, escapeHtml(location))}
      ${createDetailRow(t.quantityLabel, `${quantity} ${escapeHtml(unitName)}`)}
      ${createDetailRow(t.totalAmountLabel, `<strong>${formatCurrency(totalAmount, currency)}</strong>`)}
    `)}

    ${createDetailBox(`
      <div class="detail-row">
        <span class="label">${t.donationIdsLabel}</span>
      </div>
      ${createDonationIdsList(donationIds)}
    `)}

    ${resultImageUrl ? `
      <div class="section">
        <h3>${t.resultTitle}</h3>
        <p>${t.resultDescription}</p>
        ${createImage(resultImageUrl, 'Donation delivery confirmation')}
      </div>
    ` : ''}

    <div class="section" style="text-align: center; margin: 30px 0;">
      ${createButton(t.trackingButton, trackingUrl)}
      <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">${t.trackingHint}</p>
    </div>

    <div class="section">
      <p><strong>${t.gratitude}</strong></p>
    </div>

    ${createSuccessBox(t.shareTitle, t.shareContent)}

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

${t.congratulations}
${t.completed}

${t.impact}

${t.projectLabel} ${projectName}
${t.locationLabel} ${location}
${t.quantityLabel} ${quantity} ${unitName}
${t.totalAmountLabel} ${formatCurrency(totalAmount, currency)}

${t.donationIdsLabel}
${donationIds.map(id => `- ${id}`).join('\n')}

${resultImageUrl ? `${t.resultTitle}\n${t.resultDescription}\n${resultImageUrl}\n` : ''}

${t.gratitude}

${t.shareTitle}
${t.shareContent}

${t.contact}
  `.trim()

  return {
    subject: t.subject,
    html,
    text
  }
}
