import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyWayForPaySignature, WAYFORPAY_STATUS } from '@/lib/wayforpay/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendDonationConfirmation } from '@/lib/email/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('WayForPay webhook received:', JSON.stringify(body, null, 2))

    // Verify signature
    const receivedSignature = body.merchantSignature
    if (!receivedSignature) {
      console.error('No signature provided')
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    const isValid = verifyWayForPaySignature(body, receivedSignature)
    if (!isValid) {
      console.error('Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle payment status
    const transactionStatus = body.transactionStatus
    const orderReference = body.orderReference

    console.log(`Processing order ${orderReference} with status: ${transactionStatus}`)

    // Only process approved payments
    if (transactionStatus === WAYFORPAY_STATUS.APPROVED) {
      try {
        // Extract metadata from orderReference
        // Format: DONATE-{project_id}-{timestamp}
        const parts = orderReference.split('-')
        if (parts.length !== 3 || parts[0] !== 'DONATE') {
          throw new Error(`Invalid orderReference format: ${orderReference}`)
        }

        const projectId = parseInt(parts[1])
        const timestamp = parseInt(parts[2])

        // We need to get the donation metadata
        // Since WayForPay doesn't support metadata, we need to store it somewhere
        // Option 1: Store in database temporarily when creating payment
        // Option 2: Include in orderReference (limited space)
        // Option 3: Query from URL parameters passed to returnUrl

        // For now, we'll need to query the payment details from our database
        // or we need to store the metadata when creating the payment
        // Let's assume we stored it in a pending_donations table or similar

        // TODO: Implement metadata retrieval
        // For demonstration, I'll show the webhook structure

        const supabase = createServiceClient()

        // Extract payment details from WayForPay callback
        const amount = parseFloat(body.amount)
        const currency = body.currency

        // Get pending donation records from database
        const { data: pendingDonations, error: fetchError } = await supabase
          .from('donations')
          .select('*')
          .eq('order_reference', orderReference)
          .eq('donation_status', 'pending')

        if (fetchError || !pendingDonations || pendingDonations.length === 0) {
          console.error('Pending donations not found:', orderReference, fetchError)
          throw new Error(`Pending donations not found: ${orderReference}`)
        }

        console.log('Payment approved:', {
          orderReference,
          projectId: pendingDonations[0].project_id,
          amount,
          currency,
          quantity: pendingDonations.length,
        })

        // Update all pending donations to 'paid' status
        const { data: updatedDonations, error: updateError } = await supabase
          .from('donations')
          .update({
            donation_status: 'paid',
          })
          .eq('order_reference', orderReference)
          .eq('donation_status', 'pending')
          .select()

        if (updateError) {
          console.error(`Error updating donations to paid:`, updateError)
          throw updateError
        }

        console.log(`Successfully updated ${updatedDonations?.length} donations to 'paid':`, updatedDonations?.map(d => d.donation_public_id).join(', '))

        // Send confirmation email to donor
        try {
          const donationIds = updatedDonations?.map(d => d.donation_public_id) || []
          const firstDonation = pendingDonations[0]

          // Get project name from donations table
          const { data: project } = await supabase
            .from('projects')
            .select('project_name')
            .eq('id', firstDonation.project_id)
            .single()

          await sendDonationConfirmation({
            to: firstDonation.donor_email,
            donorName: firstDonation.donor_name,
            projectName: project?.project_name || 'Unknown Project',
            donationIds,
            totalAmount: amount,
            currency: currency,
            locale: firstDonation.locale as 'en' | 'zh' | 'ua',
          })

          console.log(`Confirmation email sent to ${firstDonation.donor_email}`)
        } catch (emailError) {
          // Log email error but don't fail the webhook
          console.error('Failed to send confirmation email:', emailError)
        }

        console.log('Webhook processed successfully - donations updated to paid and email sent')

        // Return success response to WayForPay
        return NextResponse.json({
          orderReference,
          status: 'accept',
          time: Math.floor(Date.now() / 1000),
        })
      } catch (error) {
        console.error('Error processing approved payment:', error)
        return NextResponse.json(
          { error: 'Error processing payment' },
          { status: 500 }
        )
      }
    } else if (transactionStatus === WAYFORPAY_STATUS.DECLINED) {
      console.log('Payment declined:', orderReference)
    } else if (transactionStatus === WAYFORPAY_STATUS.REFUNDED) {
      console.log('Payment refunded:', orderReference)
      // TODO: Update donation status to refunded
    }

    // Return success for all statuses
    return NextResponse.json({
      orderReference,
      status: 'accept',
      time: Math.floor(Date.now() / 1000),
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
