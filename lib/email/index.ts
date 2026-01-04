/**
 * Email System - Main Entry Point
 *
 * This module provides a unified email system with:
 * - Templated emails for different scenarios (payment success, donation completed, refund)
 * - Multi-language support (en, zh, ua)
 * - Consistent branding and styling
 * - Type-safe parameters
 */

// Export types
export type {
  Locale,
  I18nText,
  BaseEmailParams,
  PaymentSuccessEmailParams,
  DonationCompletedEmailParams,
  RefundSuccessEmailParams,
  EmailContent,
  NGOBranding
} from './types'

// Export client
export { resend, FROM_EMAIL } from './client'

// Export configuration
export { NGO_BRANDING, EMAIL_COLORS } from './config'

// Export utilities
export {
  getLocalizedText,
  formatCurrency,
  formatDonationIdsHTML,
  formatDonationIdsText,
  escapeHtml,
  getTrackingUrl
} from './utils'

// Export email senders (main API)
export { sendPaymentSuccessEmail } from './senders/payment-success'
export { sendDonationCompletedEmail } from './senders/donation-completed'
export { sendRefundSuccessEmail } from './senders/refund-success'

// Export template generators (for advanced usage)
export { generatePaymentSuccessEmail } from './templates/transactional/payment-success'
export { generateDonationCompletedEmail } from './templates/transactional/donation-completed'
export { generateRefundSuccessEmail } from './templates/transactional/refund-success'
