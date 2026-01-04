'use server'

import { z } from 'zod'
import { createAnonClient, createServiceClient } from '@/lib/supabase/server'
import { processWayForPayRefund } from '@/lib/wayforpay/server'

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
        aggregate_donations: d.aggregate_donations,
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
 * Request Refund - Integrated with WayForPay API
 *
 * Flow:
 * 1. Verify donation ownership (anonymous client + database function)
 * 2. Call WayForPay refund API
 * 3. Update donation status based on WayForPay response
 *
 * Status Transitions:
 * - WayForPay "Refunded" → donation status "refunded"
 * - WayForPay "RefundInProcessing" → donation status "refund_processing"
 * - WayForPay "Declined" → return error, keep original status
 */
export async function requestRefund(data: {
  donationPublicId: string
  email: string
}) {
  try {
    // 1. Validate input
    const validated = requestRefundSchema.parse(data)

    // 2. Get donation details (verify ownership and eligibility)
    const anonSupabase = createAnonClient()

    // First verify ownership using database function
    const { data: donations, error: verifyError } = await anonSupabase.rpc(
      'get_donations_by_email_verified',
      {
        p_email: validated.email,
        p_donation_id: validated.donationPublicId,
      }
    )

    if (verifyError || !donations || donations.length === 0) {
      return { error: 'donationNotFound' }
    }

    // Find the specific donation
    const donation = donations.find((d: any) => d.donation_public_id === validated.donationPublicId)

    if (!donation) {
      return { error: 'donationNotFound' }
    }

    // 3. Validate refund eligibility
    const status = donation.donation_status as string

    if (status === 'completed') {
      return { error: 'cannotRefundCompleted' }
    }

    if (status === 'refunding' || status === 'refund_processing' || status === 'refunded') {
      return { error: 'alreadyRefunding' }
    }

    if (status === 'pending' || status === 'failed' || status === 'expired' || status === 'declined') {
      return { error: 'cannotRefundPending' }
    }

    // Only paid, confirmed, and delivering donations can be refunded
    if (!['paid', 'confirmed', 'delivering'].includes(status)) {
      return { error: 'invalidStatus' }
    }

    // 4. Get order reference and all donations in this order
    const serviceSupabase = createServiceClient()

    // First, get the order_reference for this donation
    const { data: donationData, error: fetchError } = await serviceSupabase
      .from('donations')
      .select('order_reference, currency')
      .eq('donation_public_id', validated.donationPublicId)
      .single()

    if (fetchError || !donationData || !donationData.order_reference) {
      console.error('Error fetching donation data:', fetchError)
      return { error: 'serverError' }
    }

    // Get ALL donations in this order (an order may contain multiple units/donations)
    const { data: orderDonations, error: orderError } = await serviceSupabase
      .from('donations')
      .select('id, donation_public_id, amount, donation_status')
      .eq('order_reference', donationData.order_reference)

    if (orderError || !orderDonations || orderDonations.length === 0) {
      console.error('Error fetching order donations:', orderError)
      return { error: 'serverError' }
    }

    // Check if any donation in this order is already refunded/refunding
    const hasRefundInProgress = orderDonations.some(d =>
      d.donation_status && ['refunding', 'refund_processing', 'refunded'].includes(d.donation_status)
    )

    if (hasRefundInProgress) {
      return { error: 'alreadyRefunding' }
    }

    // Calculate total order amount (sum of all donations in this order)
    const totalOrderAmount = orderDonations.reduce((sum, d) => sum + Number(d.amount), 0)

    // 5. Call WayForPay refund API for the ENTIRE order
    try {
      const wayforpayResponse = await processWayForPayRefund({
        orderReference: donationData.order_reference,
        amount: totalOrderAmount,  // ← Full order amount, not just one donation!
        currency: (donationData.currency as 'UAH' | 'USD' | 'EUR') || 'USD',
        comment: `Full order refund requested by user (donation ID: ${validated.donationPublicId}, order: ${donationData.order_reference})`,
      })

      // 6. Map WayForPay status to our donation status
      let newStatus: string

      switch (wayforpayResponse.transactionStatus) {
        case 'Refunded':
          newStatus = 'refunded'
          break
        case 'RefundInProcessing':
          newStatus = 'refund_processing'
          break
        case 'Voided':
          newStatus = 'refunded'  // Voided means pre-auth was cancelled, treat as refunded
          break
        case 'Declined':
          return { error: 'refundDeclined', message: wayforpayResponse.reason }
        default:
          newStatus = 'refund_processing'
      }

      // 7. Update ALL donations in this order to the same status
      // This is important because WayForPay refunds the entire order, not individual donations
      const donationIds = orderDonations.map(d => d.id)

      const { error: updateError } = await serviceSupabase
        .from('donations')
        .update({
          donation_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', donationIds)

      if (updateError) {
        console.error('Error updating donation status:', updateError)
        return { error: 'serverError' }
      }

      return {
        success: true,
        status: newStatus,
        affectedDonations: orderDonations.length,  // Return how many donations were refunded
        totalAmount: totalOrderAmount
      }

    } catch (wayforpayError: any) {
      console.error('WayForPay refund API error:', wayforpayError)
      return {
        error: 'refundApiError',
        message: wayforpayError.message || 'Failed to process refund with payment provider'
      }
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'validationError' }
    }
    console.error('Error requesting refund:', error)
    return { error: 'serverError' }
  }
}
