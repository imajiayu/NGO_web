/**
 * Email System Type Definitions
 */

export type Locale = 'en' | 'zh' | 'ua'

export interface I18nText {
  en: string
  zh: string
  ua: string
}

// Base email parameters
export interface BaseEmailParams {
  to: string
  locale: Locale
}

// Payment success email parameters
export interface PaymentSuccessEmailParams extends BaseEmailParams {
  donorName: string
  projectNameI18n: I18nText
  locationI18n: I18nText
  unitNameI18n: I18nText
  donationIds: string[]
  quantity: number
  unitPrice: number
  totalAmount: number
  currency: string
}

// Donation completed email parameters
export interface DonationCompletedEmailParams extends BaseEmailParams {
  donorName: string
  projectNameI18n: I18nText
  locationI18n: I18nText
  unitNameI18n: I18nText
  donationIds: string[]
  quantity: number
  totalAmount: number
  currency: string
  resultImageUrl?: string
}

// Refund success email parameters
export interface RefundSuccessEmailParams extends BaseEmailParams {
  donorName: string
  projectNameI18n: I18nText
  donationIds: string[]
  refundAmount: number
  currency: string
  refundReason?: string
}

// Email content structure
export interface EmailContent {
  subject: string
  html: string
  text: string
}

// NGO branding
export interface NGOBranding {
  name: I18nText
  logoUrl: string
  websiteUrl: string
  contactEmail: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
  }
}
