/**
 * Payment Success Email Template
 */

import { PaymentSuccessEmailParams, EmailContent } from '../../../types'
import { getLocalizedText, formatCurrency, getTrackingUrl } from '../../../utils'
import { createEmailLayout } from '../../base/layout'
import {
  createInfoBox,
  createActionBox,
  createButton,
  createSignature,
  createDonationItemCard
} from '../../base/components'
import { paymentSuccessContent } from './content'
import { escapeHtml } from '../../../utils'

/**
 * Generate payment success email content
 */
export function generatePaymentSuccessEmail(params: PaymentSuccessEmailParams): EmailContent {
  const {
    locale,
    donorName,
    donations,
    totalAmount,
    currency
  } = params

  const t = paymentSuccessContent[locale]
  const trackingUrl = getTrackingUrl(locale)

  // Build donation items HTML
  const donationItemsHTML = donations.map((donation, index) => {
    const projectName = getLocalizedText(donation.projectNameI18n, locale)
    const location = getLocalizedText(donation.locationI18n, locale)
    const unitName = getLocalizedText(donation.unitNameI18n, locale)

    // For unit mode: show "1 unit_name", for aggregate mode: empty string
    const quantityText = donation.isAggregate ? '' : t.quantityUnit(escapeHtml(unitName))

    return createDonationItemCard(
      index + 1,
      donation.donationPublicId,
      escapeHtml(projectName),
      escapeHtml(location),
      quantityText,
      formatCurrency(donation.amount, currency)
    )
  }).join('')

  // Build email content
  const contentHTML = `
    <p class="greeting">${t.greeting(escapeHtml(donorName))}</p>
    <p><strong>${t.thankYou}</strong></p>
    <p>${t.confirmation}</p>

    <div class="detail-box">
      <div class="detail-row">
        <span class="label">${t.orderDetailsLabel}</span>
      </div>
      <div class="donation-items-container">
        ${donationItemsHTML}
      </div>
      <div class="order-total">
        <span class="order-total-label">${t.totalAmountLabel}</span>
        <span class="order-total-amount">${formatCurrency(totalAmount, currency)}</span>
      </div>
    </div>

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
  const donationItemsText = donations.map((donation, index) => {
    const projectName = getLocalizedText(donation.projectNameI18n, locale)
    const location = getLocalizedText(donation.locationI18n, locale)
    const unitName = getLocalizedText(donation.unitNameI18n, locale)
    const quantityText = donation.isAggregate ? '' : ` (${t.quantityUnit(unitName)})`

    return `${index + 1}. ${donation.donationPublicId}
   ${projectName}
   ${location}${quantityText}
   ${t.amountLabel} ${formatCurrency(donation.amount, currency)}`
  }).join('\n\n')

  const text = `
${t.greeting(donorName)}

${t.thankYou}

${t.confirmation}

${t.orderDetailsLabel}
${donationItemsText}

${t.totalAmountLabel} ${formatCurrency(totalAmount, currency)}

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
