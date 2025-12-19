'use server'

import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

const trackDonationSchema = z.object({
  email: z.string().email('Invalid email format'),
  donationId: z.string().min(1, 'Donation ID is required'),
})

export async function trackDonations(data: {
  email: string
  donationId: string
}) {
  try {
    // 1. Validate input
    const validated = trackDonationSchema.parse(data)

    // Use Service Role Client to bypass RLS
    // This is safe because we verify email matches donation ID
    const supabase = createServiceClient()

    // 2. Check if the donation ID exists
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('donor_email')
      .eq('donation_public_id', validated.donationId)
      .single()

    if (donationError || !donation) {
      return { error: 'donationNotFound' }
    }

    // 3. Verify email matches
    if (donation.donor_email.toLowerCase() !== validated.email.toLowerCase()) {
      return { error: 'emailMismatch' }
    }

    // 4. If validation passes, get all donations for this email
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('*, projects(id, project_name, project_name_i18n, location, location_i18n, unit_name, unit_name_i18n)')
      .eq('donor_email', validated.email)
      .order('donated_at', { ascending: false })

    if (donationsError || !donations) {
      console.error('Error fetching donations:', donationsError)
      return { error: 'serverError' }
    }

    return { donations }
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

export async function requestRefund(data: {
  donationPublicId: string
  email: string
}) {
  try {
    // 1. Validate input
    const validated = requestRefundSchema.parse(data)

    // Use Service Role Client to bypass RLS
    const supabase = createServiceClient()

    // 2. Get the donation and verify ownership
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('id, donor_email, donation_status')
      .eq('donation_public_id', validated.donationPublicId)
      .single()

    if (donationError || !donation) {
      return { error: 'donationNotFound' }
    }

    // 3. Verify email matches
    if (donation.donor_email.toLowerCase() !== validated.email.toLowerCase()) {
      return { error: 'unauthorized' }
    }

    // 4. Check if donation can be refunded
    // Cannot refund if already completed, refunding, or refunded
    if (donation.donation_status === 'completed') {
      return { error: 'cannotRefundCompleted' }
    }
    if (donation.donation_status === 'refunding' || donation.donation_status === 'refunded') {
      return { error: 'alreadyRefunding' }
    }

    // 5. Update donation status to 'refunding'
    const { error: updateError } = await supabase
      .from('donations')
      .update({ donation_status: 'refunding' })
      .eq('id', donation.id)

    if (updateError) {
      console.error('Error updating donation status:', updateError)
      return { error: 'serverError' }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'validationError' }
    }
    console.error('Error requesting refund:', error)
    return { error: 'serverError' }
  }
}
