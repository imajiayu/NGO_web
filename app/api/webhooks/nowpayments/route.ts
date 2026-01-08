import { NextResponse } from 'next/server'
import { verifyNowPaymentsSignature, NOWPAYMENTS_STATUS } from '@/lib/payment/nowpayments/server'
import type { NowPaymentsWebhookBody } from '@/lib/payment/nowpayments/types'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPaymentSuccessEmail, sendRefundSuccessEmail } from '@/lib/email'
import type { DonationStatus } from '@/types'

/**
 * NOWPayments Webhook Handler (IPN - Instant Payment Notification)
 *
 * Receives payment status notifications from NOWPayments and updates donation records.
 *
 * Status Mapping (from docs/NOWPAYMENTS_INTEGRATION.md):
 * - waiting      → pending (no update needed)
 * - confirming   → processing
 * - confirmed    → processing
 * - sending      → processing
 * - finished     → paid (send email)
 * - partially_paid → failed (requires manual refund)
 * - failed       → failed
 * - expired      → expired
 * - refunded     → refunded (send email)
 * - wrong_asset_confirmed → failed
 * - cancelled    → failed
 *
 * @see https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as NowPaymentsWebhookBody
    const signature = req.headers.get('x-nowpayments-sig') || ''

    const paymentStatus = body.payment_status
    const orderId = body.order_id // This is our order_reference

    console.log(`[NOWPAYMENTS WEBHOOK] Received: ${paymentStatus} for order ${orderId}`)
    console.log(`[NOWPAYMENTS WEBHOOK] Payment ID: ${body.payment_id}, Actually paid: ${body.actually_paid} ${body.pay_currency}`)

    // Verify signature
    if (!signature || !verifyNowPaymentsSignature(body, signature)) {
      console.error('[NOWPAYMENTS WEBHOOK] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Query all donations with this order_reference
    const { data: donations, error: fetchError } = await supabase
      .from('donations')
      .select('donation_status, payment_method')
      .eq('order_reference', orderId)

    if (fetchError) {
      console.error('[NOWPAYMENTS WEBHOOK] Database error:', fetchError.message)
      throw fetchError
    }

    // Case 1: No donations found
    if (!donations || donations.length === 0) {
      console.warn('[NOWPAYMENTS WEBHOOK] Order not found:', orderId)
      return NextResponse.json({ status: 'ok', message: 'Order not found' })
    }

    // Verify this is a NOWPayments donation
    const isNowPaymentsDonation = donations.some(d => d.payment_method === 'NOWPayments')
    if (!isNowPaymentsDonation) {
      console.warn('[NOWPAYMENTS WEBHOOK] Order is not a NOWPayments donation:', orderId)
      return NextResponse.json({ status: 'ok', message: 'Not a NOWPayments order' })
    }

    // Map NOWPayments status to our donation status
    let newStatus: DonationStatus | null = null
    let shouldSendEmail = false

    switch (paymentStatus) {
      case NOWPAYMENTS_STATUS.WAITING:
        // No update needed, donation is already pending
        console.log('[NOWPAYMENTS WEBHOOK] Payment waiting for user to send crypto')
        return NextResponse.json({ status: 'ok' })

      case NOWPAYMENTS_STATUS.CONFIRMING:
      case NOWPAYMENTS_STATUS.CONFIRMED:
      case NOWPAYMENTS_STATUS.SENDING:
        newStatus = 'processing'
        console.log(`[NOWPAYMENTS WEBHOOK] Payment in progress: ${paymentStatus}`)
        break

      case NOWPAYMENTS_STATUS.FINISHED:
        newStatus = 'paid'
        shouldSendEmail = true
        console.log('[NOWPAYMENTS WEBHOOK] Payment finished - funds received')
        break

      case NOWPAYMENTS_STATUS.PARTIALLY_PAID:
        // User paid less than required - still mark as paid for manual reconciliation
        // Admin should compare NOWPayments dashboard with database records
        newStatus = 'paid'
        shouldSendEmail = true
        console.log(`[NOWPAYMENTS WEBHOOK] Partial payment - expected ${body.pay_amount}, received ${body.actually_paid} ${body.pay_currency}`)
        console.log(`[NOWPAYMENTS WEBHOOK] Order ${orderId} requires manual reconciliation`)
        break

      case NOWPAYMENTS_STATUS.FAILED:
        newStatus = 'failed'
        console.log('[NOWPAYMENTS WEBHOOK] Payment failed')
        break

      case NOWPAYMENTS_STATUS.EXPIRED:
        newStatus = 'expired'
        console.log('[NOWPAYMENTS WEBHOOK] Payment expired (7 days without payment)')
        break

      case NOWPAYMENTS_STATUS.REFUNDED:
        newStatus = 'refunded'
        shouldSendEmail = true
        console.log('[NOWPAYMENTS WEBHOOK] Payment refunded')
        break

      case NOWPAYMENTS_STATUS.WRONG_ASSET_CONFIRMED:
        newStatus = 'failed'
        console.log('[NOWPAYMENTS WEBHOOK] Wrong asset/network used')
        break

      case NOWPAYMENTS_STATUS.CANCELLED:
        newStatus = 'failed'
        console.log('[NOWPAYMENTS WEBHOOK] Payment cancelled')
        break

      default:
        console.warn(`[NOWPAYMENTS WEBHOOK] Unknown status: ${paymentStatus}`)
        return NextResponse.json({ status: 'ok', message: 'Unknown status' })
    }

    // Determine which statuses can be updated
    // NOWPayments payments can only be updated from certain states
    const transitionableStatuses: DonationStatus[] = [
      'pending',
      'processing',
      'widget_load_failed',
    ]

    // For refund webhooks, also allow transition from paid states
    if (paymentStatus === NOWPAYMENTS_STATUS.REFUNDED) {
      transitionableStatuses.push('paid', 'confirmed', 'delivering', 'refunding', 'refund_processing')
    }

    // Check if any donations are in a transitionable state
    const updatableDonations = donations.filter(d =>
      transitionableStatuses.includes(d.donation_status as DonationStatus)
    )

    if (updatableDonations.length === 0) {
      console.log('[NOWPAYMENTS WEBHOOK] No donations in transitionable state - skipping update')
      console.log(`[NOWPAYMENTS WEBHOOK] Current statuses: ${donations.map(d => d.donation_status).join(', ')}`)
      return NextResponse.json({ status: 'ok' })
    }

    // Update donations to new status
    if (newStatus) {
      const { data: updatedDonations, error: updateError } = await supabase
        .from('donations')
        .update({ donation_status: newStatus })
        .eq('order_reference', orderId)
        .in('donation_status', transitionableStatuses)
        .select('project_id, donation_public_id, donor_email, donor_name, locale, amount')

      if (updateError) {
        console.error('[NOWPAYMENTS WEBHOOK] Update failed:', updateError.message)
        // Still return OK to prevent NOWPayments retries
        return NextResponse.json({ status: 'ok', message: 'Update failed' })
      }

      console.log(`[NOWPAYMENTS WEBHOOK] Updated ${updatedDonations?.length || 0} donations to ${newStatus}`)

      // Send confirmation email for successful payments
      if (shouldSendEmail && updatedDonations && updatedDonations.length > 0) {
        try {
          const firstDonation = updatedDonations[0]

          // Get unique project IDs from all donations
          const projectIds = [...new Set(updatedDonations.map(d => d.project_id))]

          // Fetch all projects in one query
          const { data: projects } = await supabase
            .from('projects')
            .select('id, project_name_i18n, location_i18n, unit_name_i18n, aggregate_donations')
            .in('id', projectIds)

          if (projects && projects.length > 0) {
            // Create a map for quick project lookup
            const projectMap = new Map(projects.map(p => [p.id, p]))

            if (newStatus === 'paid') {
              // Build donation items array for payment success email
              const donationItems = updatedDonations.map(donation => {
                const project = projectMap.get(donation.project_id)
                return {
                  donationPublicId: donation.donation_public_id,
                  projectNameI18n: (project?.project_name_i18n || { en: '', zh: '', ua: '' }) as { en: string; zh: string; ua: string },
                  locationI18n: (project?.location_i18n || { en: '', zh: '', ua: '' }) as { en: string; zh: string; ua: string },
                  unitNameI18n: (project?.unit_name_i18n || { en: '', zh: '', ua: '' }) as { en: string; zh: string; ua: string },
                  amount: Number(donation.amount),
                  isAggregate: project?.aggregate_donations === true
                }
              })

              // Calculate total from actually_paid (crypto amount converted)
              const totalAmount = updatedDonations.reduce((sum, d) => sum + Number(d.amount), 0)

              await sendPaymentSuccessEmail({
                to: firstDonation.donor_email,
                donorName: firstDonation.donor_name,
                donations: donationItems,
                totalAmount,
                currency: 'USD', // We price in USD
                locale: firstDonation.locale as 'en' | 'zh' | 'ua',
              })

              console.log('[NOWPAYMENTS WEBHOOK] Confirmation email sent to', firstDonation.donor_email)
            } else if (newStatus === 'refunded') {
              // Send refund success email
              const project = projectMap.get(firstDonation.project_id)
              const refundAmount = updatedDonations.reduce((sum, d) => sum + Number(d.amount), 0)

              await sendRefundSuccessEmail({
                to: firstDonation.donor_email,
                donorName: firstDonation.donor_name,
                projectNameI18n: (project?.project_name_i18n || { en: '', zh: '', ua: '' }) as { en: string; zh: string; ua: string },
                donationIds: updatedDonations.map(d => d.donation_public_id),
                refundAmount,
                currency: 'USD',
                locale: firstDonation.locale as 'en' | 'zh' | 'ua',
              })

              console.log('[NOWPAYMENTS WEBHOOK] Refund email sent to', firstDonation.donor_email)
            }
          }
        } catch (emailError) {
          console.error('[NOWPAYMENTS WEBHOOK] Email failed:', emailError)
          // Don't throw - email failure shouldn't fail the webhook
        }
      }
    }

    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('[NOWPAYMENTS WEBHOOK] Unexpected error:', error)
    // Return 200 to prevent NOWPayments retries for server errors
    return NextResponse.json({ status: 'error', message: 'Internal error' })
  }
}
