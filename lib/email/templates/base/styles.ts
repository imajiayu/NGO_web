/**
 * Base Email Styles - Website UI Style (Dark Gradient Theme)
 *
 * NOTE: These styles are primarily for reference. For better email client
 * compatibility, components use inline styles directly.
 */

import { EMAIL_COLORS } from '../../config'

export const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: ${EMAIL_COLORS.text};
    margin: 0;
    padding: 0;
    background-color: ${EMAIL_COLORS.background};
  }

  .email-wrapper {
    background: linear-gradient(135deg, ${EMAIL_COLORS.gradientStart} 0%, ${EMAIL_COLORS.gradientMid} 50%, ${EMAIL_COLORS.gradientEnd} 100%);
    padding: 40px 20px;
  }

  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: ${EMAIL_COLORS.cardBg};
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid ${EMAIL_COLORS.cardBorder};
  }

  .header {
    background: ${EMAIL_COLORS.glassBg};
    border: 1px solid ${EMAIL_COLORS.glassBorder};
    border-radius: 20px;
    padding: 28px;
    margin: 24px;
    text-align: center;
  }

  .header-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50px;
    margin-bottom: 12px;
  }

  .header-badge-text {
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .header-title {
    color: #ffffff;
    font-size: 26px;
    font-weight: 700;
    margin: 0 0 8px;
    line-height: 1.2;
  }

  .header-subtitle {
    color: rgba(255,255,255,0.8);
    font-size: 15px;
    margin: 0;
  }

  .content {
    padding: 32px 24px;
  }

  .greeting {
    color: ${EMAIL_COLORS.textMuted};
    font-size: 16px;
    margin-bottom: 15px;
  }

  .section {
    margin: 20px 0;
  }

  .detail-box {
    background: ${EMAIL_COLORS.backgroundLight};
    border: 1px solid ${EMAIL_COLORS.border};
    border-radius: 16px;
    padding: 20px;
    margin: 20px 0;
  }

  .detail-row {
    margin: 10px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .label {
    font-weight: 600;
    color: ${EMAIL_COLORS.textMuted};
  }

  .value {
    color: ${EMAIL_COLORS.text};
  }

  .donation-ids {
    list-style: none;
    padding: 0;
    margin: 10px 0;
  }

  .donation-ids li {
    background: rgba(255,255,255,0.1);
    padding: 8px 12px;
    margin: 5px 0;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: ${EMAIL_COLORS.textMuted};
  }

  .info-box {
    background: linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%);
    border: 1px solid rgba(251,191,36,0.3);
    border-radius: 16px;
    padding: 16px;
    margin: 15px 0;
    font-size: 14px;
    color: #fbbf24;
  }

  .success-box {
    background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(5,150,105,0.1) 100%);
    border: 1px solid rgba(52,211,153,0.3);
    border-radius: 16px;
    padding: 20px;
    margin: 20px 0;
  }

  .action-box {
    background: linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(59,130,246,0.1) 100%);
    border: 1px solid rgba(96,165,250,0.3);
    border-radius: 16px;
    padding: 20px;
    margin: 20px 0;
  }

  .button {
    display: inline-block;
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    color: #ffffff !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    margin: 10px 0;
  }

  .image-container {
    margin: 20px 0;
    text-align: center;
  }

  .result-image {
    max-width: 100%;
    height: auto;
    border-radius: 16px;
    border: 1px solid ${EMAIL_COLORS.border};
  }

  .signature {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid ${EMAIL_COLORS.border};
  }

  .signature-name {
    font-weight: 600;
    color: ${EMAIL_COLORS.text};
  }

  .signature-title {
    color: ${EMAIL_COLORS.textLight};
    font-size: 14px;
  }

  .footer {
    background: rgba(0,0,0,0.2);
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: ${EMAIL_COLORS.textSubtle};
    border-top: 1px solid ${EMAIL_COLORS.border};
  }

  .footer-links {
    margin: 10px 0;
  }

  .footer-link {
    color: ${EMAIL_COLORS.primary};
    text-decoration: none;
    margin: 0 10px;
  }

  .divider {
    border: 0;
    border-top: 1px solid ${EMAIL_COLORS.border};
    margin: 20px 0;
  }

  .donation-items-container {
    margin: 20px 0;
  }

  .donation-item-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 16px;
    margin: 12px 0;
  }

  .donation-item-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .donation-item-index {
    display: inline-block;
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%);
    color: #ffffff;
    border-radius: 50%;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .donation-item-id {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.1);
    padding: 4px 10px;
    border-radius: 6px;
    flex: 1;
    word-break: break-all;
  }

  .donation-item-amount {
    font-weight: 700;
    font-size: 16px;
    color: ${EMAIL_COLORS.success};
    flex-shrink: 0;
  }

  .donation-item-details {
    padding-left: 38px;
  }

  .donation-item-project {
    font-weight: 600;
    color: #ffffff;
    font-size: 15px;
  }

  .donation-item-location {
    color: rgba(255,255,255,0.6);
    font-size: 14px;
    margin-top: 2px;
  }

  .donation-item-quantity {
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    margin-top: 4px;
    font-style: italic;
  }

  .order-total {
    background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(5,150,105,0.1) 100%);
    border: 2px solid ${EMAIL_COLORS.success};
    border-radius: 12px;
    padding: 16px 20px;
    margin: 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .order-total-label {
    font-weight: 600;
    color: ${EMAIL_COLORS.success};
    font-size: 16px;
  }

  .order-total-amount {
    font-weight: 700;
    color: ${EMAIL_COLORS.success};
    font-size: 22px;
  }

  @media only screen and (max-width: 600px) {
    .email-wrapper {
      padding: 20px 10px;
    }

    .content {
      padding: 24px 16px;
    }

    .header {
      margin: 16px;
      padding: 20px;
    }

    .header-title {
      font-size: 22px;
    }
  }
`
