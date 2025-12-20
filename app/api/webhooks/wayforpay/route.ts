import { NextResponse } from 'next/server'
import { verifyWayForPaySignature, generateWebhookResponseSignature, WAYFORPAY_STATUS } from '@/lib/wayforpay/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendDonationConfirmation } from '@/lib/email/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const transactionStatus = body.transactionStatus
    const orderReference = body.orderReference

    console.log(`[WEBHOOK] ${transactionStatus}: ${orderReference}`)

    // Verify signature
    if (!body.merchantSignature || !verifyWayForPaySignature(body, body.merchantSignature)) {
      console.error('[WEBHOOK] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Only process approved payments
    if (transactionStatus === WAYFORPAY_STATUS.APPROVED) {
      const supabase = createServiceClient()

      // Query all donations with this order_reference
      const { data: donations, error: fetchError } = await supabase
        .from('donations')
        .select('*')
        .eq('order_reference', orderReference)

      if (fetchError) {
        console.error('[WEBHOOK] Database error:', fetchError.message)
        throw fetchError
      }

      // Case 1: No donations found
      if (!donations || donations.length === 0) {
        console.warn('[WEBHOOK] Order not found')
        const time = Math.floor(Date.now() / 1000)
        const signature = generateWebhookResponseSignature(orderReference, 'accept', time)
        return NextResponse.json({ orderReference, status: 'accept', time, signature })
      }

      // Case 2: Already processed
      const pendingDonations = donations.filter(d => d.donation_status === 'pending')
      if (pendingDonations.length === 0) {
        console.log('[WEBHOOK] Already processed')
        const time = Math.floor(Date.now() / 1000)
        const signature = generateWebhookResponseSignature(orderReference, 'accept', time)
        return NextResponse.json({ orderReference, status: 'accept', time, signature })
      }

      // Update pending donations to paid
      const { data: updatedDonations, error: updateError } = await supabase
        .from('donations')
        .update({ donation_status: 'paid' })
        .eq('order_reference', orderReference)
        .eq('donation_status', 'pending')
        .select()

      if (updateError) {
        console.error('[WEBHOOK] Update failed:', updateError.message)
        throw updateError
      }

      console.log(`[WEBHOOK] Updated ${updatedDonations?.length} to paid`)

      // Send confirmation email
      try {
        const firstDonation = pendingDonations[0]
        const { data: project } = await supabase
          .from('projects')
          .select('project_name')
          .eq('id', firstDonation.project_id)
          .single()

        await sendDonationConfirmation({
          to: firstDonation.donor_email,
          donorName: firstDonation.donor_name,
          projectName: project?.project_name || 'Unknown Project',
          donationIds: updatedDonations?.map(d => d.donation_public_id) || [],
          totalAmount: parseFloat(body.amount),
          currency: body.currency,
          locale: firstDonation.locale as 'en' | 'zh' | 'ua',
        })

        console.log('[WEBHOOK] Email sent')
      } catch (emailError) {
        console.error('[WEBHOOK] Email failed:', emailError)
        // Don't throw - email failure shouldn't fail the webhook
      }
    } else if (transactionStatus === WAYFORPAY_STATUS.PENDING) {
      console.log('[WEBHOOK] Pending - waiting for approval')
    } else if (transactionStatus === WAYFORPAY_STATUS.DECLINED) {
      console.log('[WEBHOOK] Declined - marking donations as failed')

      const supabase = createServiceClient()

      // Update pending donations to failed
      const { data: failedDonations, error: failError } = await supabase
        .from('donations')
        .update({ donation_status: 'failed' })
        .eq('order_reference', orderReference)
        .eq('donation_status', 'pending')
        .select()

      if (failError) {
        console.error('[WEBHOOK] Failed to update declined donations:', failError.message)
        throw failError
      }

      console.log(`[WEBHOOK] Updated ${failedDonations?.length} donations to failed`)
    } else {
      // Handle any other non-approved status
      console.log(`[WEBHOOK] Non-approved status: ${transactionStatus} - marking as failed`)

      const supabase = createServiceClient()

      // Update pending donations to failed
      const { data: failedDonations, error: failError } = await supabase
        .from('donations')
        .update({ donation_status: 'failed' })
        .eq('order_reference', orderReference)
        .eq('donation_status', 'pending')
        .select()

      if (failError) {
        console.error('[WEBHOOK] Failed to update non-approved donations:', failError.message)
        throw failError
      }

      console.log(`[WEBHOOK] Updated ${failedDonations?.length} donations to failed`)
    }

    // Always return success with signature
    const time = Math.floor(Date.now() / 1000)
    const signature = generateWebhookResponseSignature(orderReference, 'accept', time)
    return NextResponse.json({ orderReference, status: 'accept', time, signature })

  } catch (error) {
    console.error('[WEBHOOK] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
