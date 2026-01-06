/**
 * Reusable Email Components
 */

import { NGO_BRANDING } from '../../config'
import { Locale } from '../../types'
import { getLocalizedText } from '../../utils'

/**
 * Email header with title
 */
export function createHeader(title: string, locale: Locale): string {
  return `
    <div class="header">
      <h1 class="header-title">${title}</h1>
    </div>
  `
}

/**
 * Email footer with NGO information and links
 */
export function createFooter(locale: Locale): string {
  const ngoName = getLocalizedText(NGO_BRANDING.name, locale)

  const footerText = {
    en: {
      automated: 'This is an automated email. Please do not reply to this message.',
      contact: 'If you have any questions, please contact us at',
      website: 'Visit our website',
      copyright: `© ${new Date().getFullYear()} ${ngoName}. All rights reserved.`
    },
    zh: {
      automated: '这是一封自动发送的邮件，请勿回复。',
      contact: '如有任何疑问，请联系我们：',
      website: '访问我们的网站',
      copyright: `© ${new Date().getFullYear()} ${ngoName}。保留所有权利。`
    },
    ua: {
      automated: 'Це автоматичний лист. Будь ласка, не відповідайте на це повідомлення.',
      contact: 'Якщо у вас виникнуть запитання, зв\'яжіться з нами за адресою',
      website: 'Відвідайте наш сайт',
      copyright: `© ${new Date().getFullYear()} ${ngoName}. Всі права захищені.`
    }
  }

  const t = footerText[locale]

  return `
    <div class="footer">
      <p style="margin: 5px 0;">${t.automated}</p>
      <p style="margin: 10px 0;">
        ${t.contact} <a href="mailto:${NGO_BRANDING.contactEmail}" class="footer-link">${NGO_BRANDING.contactEmail}</a>
      </p>
      <div class="footer-links">
        <a href="${NGO_BRANDING.websiteUrl}" class="footer-link">${t.website}</a>
      </div>
      <p style="margin: 15px 0 5px 0;">${t.copyright}</p>
    </div>
  `
}

/**
 * Email signature
 */
export function createSignature(locale: Locale): string {
  const ngoName = getLocalizedText(NGO_BRANDING.name, locale)

  const signatureText = {
    en: {
      regards: 'With gratitude,',
      team: 'Team'
    },
    zh: {
      regards: '致以诚挚的感谢，',
      team: '团队'
    },
    ua: {
      regards: 'З вдячністю,',
      team: 'Команда'
    }
  }

  const t = signatureText[locale]

  return `
    <div class="signature">
      <p style="margin: 5px 0;">${t.regards}</p>
      <p class="signature-name" style="margin: 5px 0;">${ngoName} ${t.team}</p>
      <p style="margin: 10px 0 5px 0; color: #6b7280; font-size: 14px;">
        <a href="mailto:${NGO_BRANDING.contactEmail}" style="color: #667eea; text-decoration: none;">${NGO_BRANDING.contactEmail}</a>
      </p>
    </div>
  `
}

/**
 * Detail box component
 */
export function createDetailBox(content: string): string {
  return `<div class="detail-box">${content}</div>`
}

/**
 * Detail row component
 */
export function createDetailRow(label: string, value: string): string {
  return `
    <div class="detail-row">
      <span class="label">${label}</span>
      <span class="value">${value}</span>
    </div>
  `
}

/**
 * Info box component
 */
export function createInfoBox(content: string): string {
  return `<div class="info-box">${content}</div>`
}

/**
 * Success box component
 */
export function createSuccessBox(title: string, content: string): string {
  return `
    <div class="success-box">
      <strong>${title}</strong>
      <p style="margin: 10px 0 0 0;">${content}</p>
    </div>
  `
}

/**
 * Action box component
 */
export function createActionBox(title: string, content: string): string {
  return `
    <div class="action-box">
      <strong>${title}</strong>
      <p style="margin: 10px 0 0 0;">${content}</p>
    </div>
  `
}

/**
 * Button component
 */
export function createButton(text: string, url: string): string {
  return `<a href="${url}" class="button" style="display: inline-block; background: #0ea5e9; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0;">${text}</a>`
}

/**
 * Donation IDs list component
 */
export function createDonationIdsList(donationIds: string[]): string {
  const items = donationIds.map(id => `<li><strong>${id}</strong></li>`).join('')
  return `<ul class="donation-ids">${items}</ul>`
}

/**
 * Image component
 */
export function createImage(src: string, alt: string): string {
  return `
    <div class="image-container">
      <img src="${src}" alt="${alt}" class="result-image" />
    </div>
  `
}

/**
 * Donation item card for multi-donation orders
 * @param index - 1-based index for display
 * @param donationId - Donation public ID
 * @param projectName - Localized project name
 * @param location - Localized location
 * @param quantity - Quantity text (e.g., "1 unit" or empty for aggregate mode)
 * @param amount - Formatted amount string (e.g., "$10.00")
 */
export function createDonationItemCard(
  index: number,
  donationId: string,
  projectName: string,
  location: string,
  quantity: string,
  amount: string
): string {
  return `
    <div class="donation-item-card">
      <div class="donation-item-header">
        <span class="donation-item-index">${index}</span>
        <code class="donation-item-id">${donationId}</code>
        <span class="donation-item-amount">${amount}</span>
      </div>
      <div class="donation-item-details">
        <div class="donation-item-project">${projectName}</div>
        <div class="donation-item-location">${location}</div>
        ${quantity ? `<div class="donation-item-quantity">${quantity}</div>` : ''}
      </div>
    </div>
  `
}
