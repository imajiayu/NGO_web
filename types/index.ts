import type { Tables, Json } from './database'

// Re-export database types
export * from './database'

// I18n text type (used for multilingual fields)
export type I18nText = Json

// Application-level types
export type Project = Tables<'projects'>
export type Donation = Tables<'donations'>
export type ProjectStats = Tables<'project_stats'>

// Public donation view with obfuscated email (security-enhanced)
export interface PublicProjectDonation {
  id: number
  donation_public_id: string
  project_id: number
  donor_email_obfuscated: string | null
  amount: number
  currency: string
  donation_status: 'paid' | 'confirmed' | 'delivering' | 'completed'
  donated_at: string
}

// Extended types with computed properties
export interface ProjectWithProgress extends Project {
  progress_percentage: number
  total_raised: number
  donation_count: number
  is_goal_reached: boolean
}

export interface DonationWithProject extends Donation {
  project: Pick<Project, 'id' | 'project_name' | 'location' | 'unit_name'>
}

// Form types for creating/updating
export interface CreateProjectInput {
  project_name: string
  location: string
  start_date: string
  end_date?: string | null
  is_long_term?: boolean
  target_units: number
  unit_name?: string
  status?: 'planned' | 'active'
}

export interface UpdateProjectInput {
  project_name?: string
  location?: string
  start_date?: string
  end_date?: string | null
  is_long_term?: boolean
  target_units?: number
  current_units?: number
  unit_name?: string
  status?: 'planned' | 'active' | 'completed' | 'paused'
}

export interface CreateDonationInput {
  project_id: number
  donor_name: string
  donor_email: string
  donor_phone?: string
  amount: number
  currency?: string
  payment_method?: string
}

// WayForPay-specific types
export interface WayForPayCheckoutMetadata {
  project_id: string
  order_reference: string
  donor_name: string
  donor_email: string
  amount: string
  currency: string
  quantity: number
}

export interface DonationFormData {
  project_id: number
  donor_name: string
  donor_email: string
  donor_phone?: string
  amount: number
  currency: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  page_size: number
  total_count: number
  total_pages: number
}

// Filter and search types
export interface ProjectFilters {
  status?: 'planned' | 'active' | 'completed' | 'paused'
  location?: string
  is_long_term?: boolean
  search?: string
}

export interface DonationFilters {
  project_id?: number
  status?: DonationStatus
  donor_email?: string
  date_from?: string
  date_to?: string
  locale?: 'en' | 'zh' | 'ua'
}

// Email notification types
export interface DonationConfirmationEmail {
  donor_name: string
  donor_email: string
  donation_public_id: string
  project_name: string
  amount: number
  currency: string
  donated_at: string
}

// Constants
export const PROJECT_STATUSES = ['planned', 'active', 'completed', 'paused'] as const

/**
 * Donation Status Values
 *
 * Pre-payment:
 * - pending: Order created, awaiting payment
 * - widget_load_failed: Payment widget failed to load (network issue)
 *
 * Processing:
 * - processing: Payment being processed by gateway (WayForPay inProcessing)
 * - fraud_check: Under anti-fraud verification (WayForPay Pending)
 *
 * Payment Complete:
 * - paid: Payment successful, funds received
 * - confirmed: NGO confirmed the donation
 * - delivering: Items being delivered
 * - completed: Delivery completed
 *
 * Payment Failed:
 * - expired: Payment timeout (WayForPay Expired) - also used when user abandons payment
 * - declined: Bank declined the payment (WayForPay Declined)
 * - failed: Other payment failures
 *
 * Refund:
 * - refunding: Refund requested by donor
 * - refund_processing: Refund being processed (WayForPay RefundInProcessing)
 * - refunded: Refund completed (includes WayForPay Refunded and Voided)
 *
 * Note: user_cancelled was removed - pending donations that are never completed
 * will be marked as 'expired' by WayForPay's authoritative webhook.
 *
 * @see docs/PAYMENT_WORKFLOW.md
 */
export const DONATION_STATUSES = [
  // Pre-payment
  'pending',
  'widget_load_failed',
  // Processing
  'processing',
  'fraud_check',
  // Payment complete
  'paid',
  'confirmed',
  'delivering',
  'completed',
  // Payment failed
  'expired',
  'declined',
  'failed',
  // Refund
  'refunding',
  'refund_processing',
  'refunded',
] as const

export const DONATION_LOCALES = ['en', 'zh', 'ua'] as const
export const CURRENCIES = ['USD', 'UAH', 'EUR'] as const
export const PAYMENT_METHODS = ['WayForPay', 'Bank Transfer'] as const

// Type aliases for better type safety
export type DonationStatus = typeof DONATION_STATUSES[number]
export type DonationLocale = typeof DONATION_LOCALES[number]
export type ProjectStatus = typeof PROJECT_STATUSES[number]
