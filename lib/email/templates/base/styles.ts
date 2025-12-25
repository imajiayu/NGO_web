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
