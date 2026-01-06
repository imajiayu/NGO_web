/**
 * Base Email Styles
 */

import { EMAIL_COLORS } from '../../config'

export const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: ${EMAIL_COLORS.text};
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
  }

  .email-container {
    background-color: ${EMAIL_COLORS.background};
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header {
    background: #e0f2fe;
    color: #0c4a6e;
    padding: 30px 20px;
    text-align: center;
    border-bottom: 3px solid #0ea5e9;
  }

  .header-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  .content {
    padding: 30px;
  }

  .greeting {
    font-size: 16px;
    margin-bottom: 15px;
  }

  .section {
    margin: 20px 0;
  }

  .detail-box {
    background: ${EMAIL_COLORS.backgroundLight};
    border-left: 4px solid ${EMAIL_COLORS.primary};
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .detail-row {
    margin: 10px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .label {
    font-weight: 600;
    color: #4a5568;
  }

  .value {
    color: #1a202c;
  }

  .donation-ids {
    list-style: none;
    padding: 0;
    margin: 10px 0;
  }

  .donation-ids li {
    background: #edf2f7;
    padding: 8px 12px;
    margin: 5px 0;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
  }

  .info-box {
    background: #fef3c7;
    border-left: 4px solid ${EMAIL_COLORS.warning};
    padding: 12px;
    margin: 15px 0;
    font-size: 14px;
    border-radius: 4px;
  }

  .success-box {
    background: #d1fae5;
    border-left: 4px solid ${EMAIL_COLORS.success};
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .action-box {
    background: #e0f2fe;
    border-left: 4px solid ${EMAIL_COLORS.info};
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .button {
    display: inline-block;
    background: #0ea5e9;
    color: #ffffff !important;
    padding: 12px 30px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 10px 0;
  }

  .button:hover {
    background: #0284c7;
  }

  .image-container {
    margin: 20px 0;
    text-align: center;
  }

  .result-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
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
    background: ${EMAIL_COLORS.backgroundLight};
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: ${EMAIL_COLORS.textLight};
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

  .footer-link:hover {
    text-decoration: underline;
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
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 10px 0;
  }

  .donation-item-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .donation-item-index {
    display: inline-block;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    background: #fef3c7;
    color: #b45309;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .donation-item-id {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #374151;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
    flex: 1;
    word-break: break-all;
  }

  .donation-item-amount {
    font-weight: 700;
    font-size: 16px;
    color: #059669;
    flex-shrink: 0;
  }

  .donation-item-details {
    padding-left: 34px;
  }

  .donation-item-project {
    font-weight: 600;
    color: #1f2937;
    font-size: 15px;
  }

  .donation-item-location {
    color: #6b7280;
    font-size: 14px;
    margin-top: 2px;
  }

  .donation-item-quantity {
    color: #4b5563;
    font-size: 13px;
    margin-top: 4px;
    font-style: italic;
  }

  .order-total {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 2px solid #10b981;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .order-total-label {
    font-weight: 600;
    color: #065f46;
    font-size: 16px;
  }

  .order-total-amount {
    font-weight: 700;
    color: #047857;
    font-size: 22px;
  }

  @media only screen and (max-width: 600px) {
    body {
      padding: 10px;
    }

    .content {
      padding: 20px;
    }

    .header {
      padding: 20px 15px;
    }

    .header-title {
      font-size: 20px;
    }
  }
`
