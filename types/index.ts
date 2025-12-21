import type { Tables, Views } from './database'

// Re-export database types
export * from './database'

// Application-level types
export type Project = Tables<'projects'>
export type Donation = Tables<'donations'>
export type ProjectStats = Views<'project_stats'>

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
  status?: 'pending' | 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded' | 'failed'
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
export const DONATION_STATUSES = ['pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded', 'failed'] as const
export const DONATION_LOCALES = ['en', 'zh', 'ua'] as const
export const CURRENCIES = ['USD', 'UAH', 'EUR'] as const
export const PAYMENT_METHODS = ['WayForPay', 'Bank Transfer'] as const

// Type aliases for better type safety
export type DonationStatus = typeof DONATION_STATUSES[number]
export type DonationLocale = typeof DONATION_LOCALES[number]
export type ProjectStatus = typeof PROJECT_STATUSES[number]
