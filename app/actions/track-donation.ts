'use server'

import { z } from 'zod'
import { createAnonClient, createServiceClient } from '@/lib/supabase/server'
import { processWayForPayRefund } from '@/lib/payment/wayforpay/server'
import { sendRefundSuccessEmail } from '@/lib/email'

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

    // First, get the order_reference and payment_method for this donation
    const { data: donationData, error: fetchError } = await serviceSupabase
      .from('donations')
      .select('order_reference, currency, payment_method')
      .eq('donation_public_id', validated.donationPublicId)
      .single()

    if (fetchError || !donationData || !donationData.order_reference) {
      console.error('Error fetching donation data:', fetchError)
      return { error: 'serverError' }
    }

    // Get ALL donations in this order (an order may contain multiple units/donations)
    // Include fields needed for refund email
    const { data: orderDonations, error: orderError } = await serviceSupabase
      .from('donations')
      .select('id, donation_public_id, amount, donation_status, donor_name, donor_email, locale, project_id')
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

    // Filter donations that can be refunded (exclude completed donations)
    const refundableDonations = orderDonations.filter(d =>
      d.donation_status && ['paid', 'confirmed', 'delivering'].includes(d.donation_status)
    )

    // Check if there are any refundable donations
    if (refundableDonations.length === 0) {
      return { error: 'cannotRefundCompleted' }
    }

    // Calculate refundable amount (only paid/confirmed/delivering donations)
    const totalOrderAmount = refundableDonations.reduce((sum, d) => sum + Number(d.amount), 0)

    // 5. Handle refund based on payment method
    const paymentMethod = donationData.payment_method

    // For NOWPayments (crypto): Mark as refunding for manual processing
    // Crypto refunds require manual handling by admin
    if (paymentMethod === 'NOWPayments') {
      const donationIds = refundableDonations.map(d => d.id)

      const { error: updateError } = await serviceSupabase
        .from('donations')
        .update({
          donation_status: 'refunding',
          updated_at: new Date().toISOString()
        })
        .in('id', donationIds)

      if (updateError) {
        console.error('[REFUND] Error updating NOWPayments donation status:', updateError)
        return { error: 'serverError' }
      }

      console.log(`[REFUND] NOWPayments: Marked ${donationIds.length} donations as 'refunding' for manual processing`)

      return {
        success: true,
        status: 'refunding',
        affectedDonations: refundableDonations.length,
        totalAmount: totalOrderAmount,
        message: 'Crypto refund request submitted for manual processing'
      }
    }

    // For WayForPay (card): Call refund API
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
          // Unknown status from WayForPay - mark as refunding so admin knows user wants refund
          console.warn('Unknown WayForPay refund status:', wayforpayResponse.transactionStatus)
          newStatus = 'refunding'
      }

      // 7. Update ONLY refundable donations (paid/confirmed/delivering) to the new status
      // Completed donations are excluded from refund
      const donationIds = refundableDonations.map(d => d.id)

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

      // Send refund success email when API directly returns refunded status
      // (For refund_processing, email will be sent when webhook confirms refund)
      if (newStatus === 'refunded') {
        try {
          const firstDonation = refundableDonations[0]
          const { data: project } = await serviceSupabase
            .from('projects')
            .select('project_name_i18n')
            .eq('id', firstDonation.project_id)
            .single()

          if (project && firstDonation.donor_email) {
            await sendRefundSuccessEmail({
              to: firstDonation.donor_email,
              donorName: firstDonation.donor_name || '',
              projectNameI18n: project.project_name_i18n as { en: string; zh: string; ua: string },
              donationIds: refundableDonations.map(d => d.donation_public_id),
              refundAmount: totalOrderAmount,
              currency: (donationData.currency as string) || 'USD',
              locale: (firstDonation.locale as 'en' | 'zh' | 'ua') || 'en',
            })
            console.log('[REFUND] Refund success email sent to', firstDonation.donor_email)
          }
        } catch (emailError) {
          console.error('[REFUND] Failed to send refund email:', emailError)
          // Don't fail the refund operation if email fails
        }
      }

      return {
        success: true,
        status: newStatus,
        affectedDonations: refundableDonations.length,  // Return how many donations were refunded
        totalAmount: totalOrderAmount
      }

    } catch (wayforpayError: any) {
      console.error('WayForPay refund API error:', wayforpayError)

      // Update status to 'refunding' so admin knows user attempted refund
      // This ensures the refund request is tracked even if API call failed
      const donationIds = refundableDonations.map(d => d.id)

      try {
        await serviceSupabase
          .from('donations')
          .update({
            donation_status: 'refunding',
            updated_at: new Date().toISOString()
          })
          .in('id', donationIds)

        console.log(`[REFUND] Updated ${donationIds.length} donations to 'refunding' after API error`)
      } catch (updateError) {
        console.error('[REFUND] Failed to update status to refunding:', updateError)
      }

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
