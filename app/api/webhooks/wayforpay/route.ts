import { NextResponse } from 'next/server'
import { verifyWayForPaySignature, generateWebhookResponseSignature, WAYFORPAY_STATUS } from '@/lib/wayforpay/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPaymentSuccessEmail, sendRefundSuccessEmail } from '@/lib/email'
import type { DonationStatus } from '@/types'

/**
 * WayForPay Webhook Handler
 *
 * Receives payment status notifications from WayForPay and updates donation records.
 * Implements enhanced status handling from docs/PAYMENT_WORKFLOW.md
 *
 * @see https://wiki.wayforpay.com/en/view/852102
 * @see docs/PAYMENT_WORKFLOW.md
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const transactionStatus = body.transactionStatus
    const orderReference = body.orderReference

    console.log(`[WEBHOOK] Received: ${transactionStatus} for order ${orderReference}`)

    // Verify signature
    if (!body.merchantSignature || !verifyWayForPaySignature(body, body.merchantSignature)) {
      console.error('[WEBHOOK] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Query all donations with this order_reference
    // P1 优化: 只选择状态检查所需字段
    const { data: donations, error: fetchError } = await supabase
      .from('donations')
      .select('donation_status')
      .eq('order_reference', orderReference)

    if (fetchError) {
      console.error('[WEBHOOK] Database error:', fetchError.message)
      throw fetchError
    }

    // Case 1: No donations found
    if (!donations || donations.length === 0) {
      console.warn('[WEBHOOK] Order not found:', orderReference)
      return respondWithAccept(orderReference)
    }

    // Map WayForPay status to our donation status
    let newStatus: DonationStatus | null = null
    let shouldSendEmail = false

    switch (transactionStatus) {
      case WAYFORPAY_STATUS.APPROVED:
        newStatus = 'paid'
        shouldSendEmail = true
        console.log('[WEBHOOK] Payment approved - funds received')
        break

      case WAYFORPAY_STATUS.PENDING:
        newStatus = 'fraud_check'
        console.log('[WEBHOOK] Payment under anti-fraud verification')
        break

      case WAYFORPAY_STATUS.IN_PROCESSING:
        newStatus = 'processing'
        console.log('[WEBHOOK] Payment being processed by gateway')
        break

      case WAYFORPAY_STATUS.WAITING_AUTH_COMPLETE:
        newStatus = 'paid'
        shouldSendEmail = true
        console.log('[WEBHOOK] Pre-authorization successful - funds reserved, treating as paid')
        break

      case WAYFORPAY_STATUS.DECLINED:
        // CRITICAL: Distinguish between payment declined and refund declined
        // Check current donation statuses to determine context
        const currentStatuses = donations.map(d => d.donation_status)
        const isRefundDeclined = currentStatuses.some(s =>
          ['paid', 'confirmed', 'delivering', 'refund_processing'].includes(s as string)
        )

        if (isRefundDeclined) {
          // Refund was declined - keep original status (user still has paid donation)
          console.log('[WEBHOOK] Refund declined by payment provider - keeping original donation status')
          return respondWithAccept(orderReference)
        } else {
          // Payment was declined by bank
          newStatus = 'declined'
          console.log('[WEBHOOK] Payment declined by bank')
        }
        break

      case WAYFORPAY_STATUS.EXPIRED:
        newStatus = 'expired'
        console.log('[WEBHOOK] Payment timeout - user did not complete in time')
        break

      case WAYFORPAY_STATUS.REFUNDED:
      case WAYFORPAY_STATUS.VOIDED:
        // Unified handling: both mean money is returned to user
        // Voided = pre-auth cancellation (fast, no fees)
        // Refunded = actual refund (slower, after settlement)
        // See docs/PAYMENT_WORKFLOW.md for rationale
        newStatus = 'refunded'
        console.log(`[WEBHOOK] Payment cancelled (${transactionStatus}) - funds returned`)
        break

      case WAYFORPAY_STATUS.REFUND_IN_PROCESSING:
        newStatus = 'refund_processing'
        console.log('[WEBHOOK] Refund being processed')
        break

      default:
        // Unknown status - mark as failed
        newStatus = 'failed'
        console.warn(`[WEBHOOK] Unknown status: ${transactionStatus} - marking as failed`)
    }

    // Determine which statuses can be updated based on webhook type
    // Payment webhooks can only update from initial payment states
    // Refund webhooks can update from paid/confirmed/delivering/refunding/refund_processing states
    const isRefundWebhook = [
      WAYFORPAY_STATUS.REFUNDED,
      WAYFORPAY_STATUS.REFUND_IN_PROCESSING,
      WAYFORPAY_STATUS.VOIDED
    ].includes(transactionStatus)

    const transitionableStatuses: DonationStatus[] = isRefundWebhook
      ? ['paid', 'confirmed', 'delivering', 'refunding', 'refund_processing'] // Refund webhooks - include 'refunding' for failed API cases
      : ['pending', 'processing', 'fraud_check', 'widget_load_failed']  // Payment webhooks - include widget_load_failed to handle script errors

    // Check if any donations are in a transitionable state
    const updatableDonations = donations.filter(d =>
      transitionableStatuses.includes(d.donation_status as DonationStatus)
    )

    if (updatableDonations.length === 0) {
      console.log('[WEBHOOK] No donations in transitionable state - skipping update')
      console.log(`[WEBHOOK] Current statuses: ${donations.map(d => d.donation_status).join(', ')}`)
      return respondWithAccept(orderReference)
    }

    // Update donations to new status
    if (newStatus) {
      // P1 优化: 只选择邮件所需字段
      const { data: updatedDonations, error: updateError } = await supabase
        .from('donations')
        .update({ donation_status: newStatus })
        .eq('order_reference', orderReference)
        .in('donation_status', transitionableStatuses)
        .select('project_id, donation_public_id, donor_email, donor_name, locale, amount')

      if (updateError) {
        // Log error but still return accept to stop WayForPay retries
        // The payment/refund has already been processed by WayForPay
        // Database inconsistency should be fixed manually or by recalculation
        console.error('[WEBHOOK] Update failed:', updateError.message, updateError.details)
        console.error('[WEBHOOK] Manual intervention may be required for order:', orderReference)
        return respondWithAccept(orderReference)
      }

      console.log(`[WEBHOOK] Updated ${updatedDonations?.length || 0} donations: ${updatableDonations.map(d => d.donation_status).join(', ')} → ${newStatus}`)

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

            // Build donation items array
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

            await sendPaymentSuccessEmail({
              to: firstDonation.donor_email,
              donorName: firstDonation.donor_name,
              donations: donationItems,
              totalAmount: parseFloat(body.amount),
              currency: body.currency,
              locale: firstDonation.locale as 'en' | 'zh' | 'ua',
            })

            console.log('[WEBHOOK] Confirmation email sent to', firstDonation.donor_email)
          }
        } catch (emailError) {
          console.error('[WEBHOOK] Email failed:', emailError)
          // Don't throw - email failure shouldn't fail the webhook
        }
      }

      // Send refund success email when status becomes refunded
      if (newStatus === 'refunded' && updatedDonations && updatedDonations.length > 0) {
        try {
          const firstDonation = updatedDonations[0]
          const { data: project } = await supabase
            .from('projects')
            .select('project_name_i18n')
            .eq('id', firstDonation.project_id)
            .single()

          if (project) {
            // Calculate total refund amount from updated donations
            const refundAmount = updatedDonations.reduce((sum, d) => sum + Number(d.amount), 0)

            await sendRefundSuccessEmail({
              to: firstDonation.donor_email,
              donorName: firstDonation.donor_name,
              projectNameI18n: project.project_name_i18n as { en: string; zh: string; ua: string },
              donationIds: updatedDonations.map(d => d.donation_public_id),
              refundAmount,
              currency: body.currency || 'USD',
              locale: firstDonation.locale as 'en' | 'zh' | 'ua',
              refundReason: body.reason || undefined,
            })

            console.log('[WEBHOOK] Refund success email sent to', firstDonation.donor_email)
          }
        } catch (emailError) {
          console.error('[WEBHOOK] Refund email failed:', emailError)
          // Don't throw - email failure shouldn't fail the webhook
        }
      }
    }

    return respondWithAccept(orderReference)

  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Helper function to generate accept response for WayForPay
 */
function respondWithAccept(orderReference: string) {
  const time = Math.floor(Date.now() / 1000)
  const signature = generateWebhookResponseSignature(orderReference, 'accept', time)
  return NextResponse.json({ orderReference, status: 'accept', time, signature })
}
