/**
 * Reusable Email Components - Website UI Style (Dark Gradient Theme)
 *
 * All components use inline styles for maximum email client compatibility
 */

import { NGO_BRANDING } from '../../config'
import { Locale } from '../../types'
import { getLocalizedText } from '../../utils'

/**
 * Email header with glassmorphism style
 */
export function createHeader(title: string, locale: Locale, badge?: string, subtitle?: string): string {
  const badgeText = badge || {
    en: 'Way to Future UA',
    zh: '乌克兰未来之路',
    ua: 'Way to Future UA'
  }[locale]

  return `
    <!-- Glassmorphism Header -->
    <tr>
      <td style="padding: 24px 24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 28px; text-align: center;">
              <div style="display: inline-block; padding: 6px 16px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); border-radius: 50px; margin-bottom: 12px;">
                <span style="color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">${badgeText}</span>
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 8px; line-height: 1.3;">
                ${title}
              </h1>
              ${subtitle ? `<p style="color: rgba(255,255,255,0.8); font-size: 15px; margin: 0;">${subtitle}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
    <!-- Footer -->
    <tr>
      <td style="background: rgba(0,0,0,0.2); padding: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; margin: 0 0 12px;">
          ${t.automated}
        </p>
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; margin: 0 0 12px;">
          ${t.contact} <a href="mailto:${NGO_BRANDING.contactEmail}" style="color: #60a5fa; text-decoration: none;">${NGO_BRANDING.contactEmail}</a>
        </p>
        <p style="text-align: center; margin: 0 0 12px;">
          <a href="${NGO_BRANDING.websiteUrl}" style="color: #60a5fa; font-size: 13px; text-decoration: none;">${t.website}</a>
        </p>
        <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin: 0;">
          ${t.copyright}
        </p>
      </td>
    </tr>
  `
}

/**
 * Email signature
 */
export function createSignature(locale: Locale): string {
  const ngoName = getLocalizedText(NGO_BRANDING.name, locale)

  const signatureText = {
    en: {
      regards: 'With heartfelt gratitude,',
      team: 'Team'
    },
    zh: {
      regards: '衷心感谢，',
      team: '团队'
    },
    ua: {
      regards: 'З щирою вдячністю,',
      team: 'Команда'
    }
  }

  const t = signatureText[locale]

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
      <tr>
        <td>
          <p style="color: rgba(255,255,255,0.75); font-size: 16px; margin: 0 0 8px;">${t.regards}</p>
          <p style="color: #ffffff; font-weight: 600; font-size: 16px; margin: 0 0 8px;">${ngoName} ${t.team}</p>
          <p style="margin: 0;">
            <a href="mailto:${NGO_BRANDING.contactEmail}" style="color: #60a5fa; font-size: 14px; text-decoration: none;">${NGO_BRANDING.contactEmail}</a>
          </p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Detail box component - dark glass style
 */
export function createDetailBox(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          ${content}
        </td>
      </tr>
    </table>
  `
}

/**
 * Detail row component
 */
export function createDetailRow(label: string, value: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0;">
      <tr>
        <td style="color: rgba(255,255,255,0.7); font-weight: 600; font-size: 14px; padding-bottom: 4px;">${label}</td>
      </tr>
      <tr>
        <td style="color: #ffffff; font-size: 15px;">${value}</td>
      </tr>
    </table>
  `
}

/**
 * Info box component - amber/warning style
 */
export function createInfoBox(content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%); border: 1px solid rgba(251,191,36,0.3); border-radius: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px;">
          <p style="color: #fbbf24; font-size: 14px; margin: 0; line-height: 1.6;">${content}</p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Success box component - green style
 */
export function createSuccessBox(title: string, content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(5,150,105,0.1) 100%); border: 1px solid rgba(52,211,153,0.3); border-radius: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #34d399; font-size: 18px; font-weight: 700; margin: 0 0 8px;">${title}</p>
          <p style="color: rgba(255,255,255,0.85); font-size: 15px; margin: 0; line-height: 1.6;">${content}</p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Action box component - blue style
 */
export function createActionBox(title: string, content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(59,130,246,0.1) 100%); border: 1px solid rgba(96,165,250,0.3); border-radius: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #60a5fa; font-size: 15px; font-weight: 700; margin: 0 0 8px;">${title}</p>
          <div style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6;">${content}</div>
        </td>
      </tr>
    </table>
  `
}

/**
 * Error/Alert box component - red style
 */
export function createErrorBox(title: string, content: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.1) 100%); border: 1px solid rgba(239,68,68,0.3); border-radius: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #f87171; font-size: 15px; font-weight: 700; margin: 0 0 8px;">${title}</p>
          <p style="color: rgba(255,255,255,0.85); font-size: 15px; margin: 0; line-height: 1.6;">${content}</p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Button component - gradient blue style
 */
export function createButton(text: string, url: string, color: 'blue' | 'green' = 'blue'): string {
  const gradient = color === 'green'
    ? 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
    : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'

  return `<a href="${url}" style="display: inline-block; background: ${gradient}; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">${text}</a>`
}

/**
 * Donation IDs list component
 */
export function createDonationIdsList(donationIds: string[]): string {
  const items = donationIds.map(id => `
    <tr>
      <td style="background: rgba(255,255,255,0.1); padding: 10px 14px; margin: 0; border-radius: 8px;">
        <code style="font-family: 'Courier New', monospace; font-size: 14px; color: rgba(255,255,255,0.9);">${id}</code>
      </td>
    </tr>
    <tr><td style="height: 8px;"></td></tr>
  `).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      ${items}
    </table>
  `
}

/**
 * Image component with rounded corners
 */
export function createImage(src: string, alt: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td align="center">
          <img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); display: block;" />
        </td>
      </tr>
    </table>
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
    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin: 12px 0;">
      <tr>
        <td style="padding: 16px;">
          <!-- Header Row -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" valign="top">
                <div style="width: 28px; height: 28px; line-height: 28px; text-align: center; background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%); color: #ffffff; border-radius: 50%; font-size: 13px; font-weight: 600;">${index}</div>
              </td>
              <td style="padding-left: 10px;" valign="middle">
                <code style="font-family: 'Courier New', monospace; font-size: 13px; color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px;">${donationId}</code>
              </td>
              <td align="right" valign="middle">
                <span style="font-weight: 700; font-size: 16px; color: #34d399;">${amount}</span>
              </td>
            </tr>
          </table>
          <!-- Details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px; padding-left: 38px;">
            <tr>
              <td>
                <p style="font-weight: 600; color: #ffffff; font-size: 15px; margin: 0;">${projectName}</p>
                <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 4px 0 0;">${location}</p>
                ${quantity ? `<p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 4px 0 0; font-style: italic;">${quantity}</p>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Order total component - gradient green style
 */
export function createOrderTotal(label: string, amount: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(5,150,105,0.1) 100%); border: 2px solid #34d399; border-radius: 12px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-weight: 600; color: #34d399; font-size: 16px;">${label}</td>
              <td align="right" style="font-weight: 700; color: #34d399; font-size: 22px;">${amount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

/**
 * Stats card component - for displaying key metrics
 */
export function createStatsCard(value: string, label: string, color: 'blue' | 'green' | 'purple' = 'blue'): string {
  const gradients = {
    blue: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    green: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    purple: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
  }

  return `
    <td style="padding: 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: ${gradients[color]}; border-radius: 16px;">
        <tr>
          <td style="padding: 20px 12px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #ffffff;">${value}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 4px; font-weight: 600;">${label}</div>
          </td>
        </tr>
      </table>
    </td>
  `
}
