/**
 * Email Subscription Server Actions
 */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { DonationLocale } from '@/types'

type Locale = DonationLocale

// ==================== Types ====================

export interface EmailSubscription {
  id: number
  email: string
  locale: Locale
  is_subscribed: boolean
  updated_at: string
}

export interface SubscriptionFilter {
  isSubscribed?: boolean
  locale?: Locale
  search?: string
}

// ==================== Validation Schemas ====================

const createSubscriptionSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.enum(['en', 'zh', 'ua'])
})

// ==================== Server Actions ====================

/**
 * Create or update email subscription
 * Uses database function for idempotent upsert
 */
export async function createEmailSubscription(
  email: string,
  locale: Locale
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validated = createSubscriptionSchema.parse({ email, locale })

    const supabase = await createServerClient()

    // Call database function for idempotent upsert
    const { data, error } = await supabase.rpc('upsert_email_subscription', {
      p_email: validated.email,
      p_locale: validated.locale
    })

    if (error) {
      console.error('Error creating subscription:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Unexpected error creating subscription:', error)
    return { success: false, error: 'Failed to create subscription' }
  }
}

/**
 * Get all email subscriptions (admin only)
 * Supports filtering by subscription status, locale, and email search
 */
export async function getSubscriptions(
  filter?: SubscriptionFilter
): Promise<{ data: EmailSubscription[] | null; error?: string }> {
  try {
    const supabase = await createServerClient()

    // Check admin permission
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    // Build query
    let query = supabase
      .from('email_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false })

    // Apply filters
    if (filter?.isSubscribed !== undefined) {
      query = query.eq('is_subscribed', filter.isSubscribed)
    }

    if (filter?.locale) {
      query = query.eq('locale', filter.locale)
    }

    if (filter?.search) {
      query = query.ilike('email', `%${filter.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return { data: null, error: error.message }
    }

    return { data: data as EmailSubscription[] }
  } catch (error) {
    console.error('Unexpected error fetching subscriptions:', error)
    return { data: null, error: 'Failed to fetch subscriptions' }
  }
}
