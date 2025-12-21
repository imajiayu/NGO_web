'use server'

import { z } from 'zod'
import { createAnonClient } from '@/lib/supabase/server'

const trackDonationSchema = z.object({
  email: z.string().email('Invalid email format'),
  donationId: z.string().min(1, 'Donation ID is required'),
})

/**
 * Track Donations - Secure Implementation
 *
 * Security Improvements:
 * - Uses anonymous client (RLS enforced via database function)
 * - Database function verifies email + donation ID ownership
 * - Prevents enumeration attacks (need both email AND valid donation ID)
 * - No service role needed
 */
export async function trackDonations(data: {
  email: string
  donationId: string
}) {
  try {
    // 1. Validate input
    const validated = trackDonationSchema.parse(data)

    // SECURITY: Use anonymous client - verification handled by database function
    const supabase = createAnonClient()

    // 2. Call secure database function
    // Function will:
    //   - Verify donation ID belongs to this email
    //   - Return all donations for this email if verified
    //   - Return empty result if verification fails
    const { data: donations, error } = await supabase.rpc(
      'get_donations_by_email_verified',
      {
        p_email: validated.email,
        p_donation_id: validated.donationId,
      }
    )

    if (error) {
      console.error('Error calling get_donations_by_email_verified:', error)
      return { error: 'serverError' }
    }

    // 3. Check if verification passed (empty result means verification failed)
    if (!donations || donations.length === 0) {
      // Don't reveal if it's wrong email or wrong donation ID (security)
      return { error: 'donationNotFound' }
    }

    // 4. Transform data to match expected format
    const transformedDonations = donations.map((d: any) => ({
      ...d,
      projects: {
        id: d.project_id,
        project_name: d.project_name,
        project_name_i18n: d.project_name_i18n,
        location: d.location,
        location_i18n: d.location_i18n,
        unit_name: d.unit_name,
        unit_name_i18n: d.unit_name_i18n,
      },
    }))

    return { donations: transformedDonations }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'validationError' }
    }
    console.error('Error tracking donations:', error)
    return { error: 'serverError' }
  }
}

const requestRefundSchema = z.object({
  donationPublicId: z.string().min(1, 'Donation ID is required'),
  email: z.string().email('Invalid email format'),
})

/**
 * Request Refund - Secure Implementation
 *
 * Security Improvements:
 * - Uses anonymous client (RLS enforced via database function)
 * - Database function verifies email ownership
 * - Function validates refund eligibility
 * - No service role needed
 */
export async function requestRefund(data: {
  donationPublicId: string
  email: string
}) {
  try {
    // 1. Validate input
    const validated = requestRefundSchema.parse(data)

    // SECURITY: Use anonymous client - verification handled by database function
    const supabase = createAnonClient()

    // 2. Call secure database function
    // Function will:
    //   - Verify donation ID belongs to this email
    //   - Validate refund eligibility (status checks)
    //   - Update status to 'refunding' if eligible
    //   - Return success/error JSON
    const { data: result, error } = await supabase.rpc(
      'request_donation_refund',
      {
        p_donation_public_id: validated.donationPublicId,
        p_email: validated.email,
      }
    )

    if (error) {
      console.error('Error calling request_donation_refund:', error)
      return { error: 'serverError' }
    }

    // 3. Parse the JSON result from the function
    const jsonResult = result as { success?: boolean; error?: string; message?: string }

    // 4. Return based on function result
    if (jsonResult.error) {
      return { error: jsonResult.error }
    }

    if (jsonResult.success) {
      return { success: true }
    }

    // Fallback error
    return { error: 'serverError' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'validationError' }
    }
    console.error('Error requesting refund:', error)
    return { error: 'serverError' }
  }
}
