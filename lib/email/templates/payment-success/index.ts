/**
 * Payment Success Email Template
 */

import { PaymentSuccessEmailParams, EmailContent } from '../../types'
import { getLocalizedText, formatCurrency, getTrackingUrl } from '../../utils'
import { createEmailLayout } from '../base/layout'
import {
  createDetailBox,
  createDetailRow,
  createDonationIdsList,
  createInfoBox,
  createActionBox,
  createButton,
  createSignature
} from '../base/components'
import { paymentSuccessContent } from './content'
import { escapeHtml } from '../../utils'

/**
 * Generate payment success email content
 */
export function generatePaymentSuccessEmail(params: PaymentSuccessEmailParams): EmailContent {
  const {
    locale,
    donorName,
    projectNameI18n,
    locationI18n,
    unitNameI18n,
    donationIds,
    quantity,
    unitPrice,
    totalAmount,
    currency
  } = params

  const t = paymentSuccessContent[locale]
  const projectName = getLocalizedText(projectNameI18n, locale)
  const location = getLocalizedText(locationI18n, locale)
  const unitName = getLocalizedText(unitNameI18n, locale)
  const trackingUrl = getTrackingUrl(locale)

  // Build email content
  const contentHTML = `
    <p class="greeting">${t.greeting(escapeHtml(donorName))}</p>
    <p><strong>${t.thankYou}</strong></p>
    <p>${t.confirmation}</p>

    ${createDetailBox(`
      ${createDetailRow(t.projectLabel, escapeHtml(projectName))}
      ${createDetailRow(t.locationLabel, escapeHtml(location))}
      ${createDetailRow(t.quantityLabel, `${quantity} ${escapeHtml(unitName)}`)}
      ${createDetailRow(t.unitPriceLabel, formatCurrency(unitPrice, currency))}
      ${createDetailRow(t.totalAmountLabel, `<strong>${formatCurrency(totalAmount, currency)}</strong>`)}
    `)}

    ${createDetailBox(`
      <div class="detail-row">
        <span class="label">${t.donationIdsLabel}</span>
      </div>
      ${createDonationIdsList(donationIds)}
    `)}

    ${createInfoBox(t.donationIdsNote)}

    ${createActionBox(t.trackingTitle, `
      ${t.trackingContent}
      <br><br>
      ${createButton(t.trackingButton, trackingUrl)}
    `)}

    ${createActionBox(t.nextStepsTitle, t.nextStepsContent)}

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

${t.thankYou}

${t.confirmation}

${t.projectLabel} ${projectName}
${t.locationLabel} ${location}
${t.quantityLabel} ${quantity} ${unitName}
${t.unitPriceLabel} ${formatCurrency(unitPrice, currency)}
${t.totalAmountLabel} ${formatCurrency(totalAmount, currency)}

${t.donationIdsLabel}
${donationIds.map(id => `- ${id}`).join('\n')}

${t.donationIdsNote}

${t.trackingTitle}
${t.trackingContent}
${trackingUrl}

${t.nextStepsTitle}
${t.nextStepsContent}

${t.contact}
  `.trim()

  return {
    subject: t.subject,
    html,
    text
  }
}
