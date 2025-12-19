'use server'

import { createWayForPayPayment } from '@/lib/wayforpay/server'
import { getProjectById } from '@/lib/supabase/queries'
import { donationFormSchema } from '@/lib/validations'
import { createServiceClient } from '@/lib/supabase/server'
import type { DonationStatus } from '@/types/database'
import { getProjectName, getUnitName, type SupportedLocale } from '@/lib/i18n-utils'
import { sendDonationConfirmation } from '@/lib/email/server'

type WayForPayPaymentResult =
  | { success: true; paymentParams: any; amount: number; orderReference: string; skipPayment?: false }
  | { success: true; skipPayment: true; amount: number; orderReference: string }
  | { success: false; error: 'quantity_exceeded'; remainingUnits: number; unitName: string }
  | { success: false; error: 'project_not_found' | 'project_not_active' | 'server_error' }

/**
 * Create WayForPay payment for donation
 */
export async function createWayForPayDonation(data: {
  project_id: number
  quantity: number
  donor_name: string
  donor_email: string
  donor_message?: string
  contact_telegram?: string
  contact_whatsapp?: string
  locale: 'en' | 'zh' | 'ua'
}): Promise<WayForPayPaymentResult> {
  try {
    // Validate input
    const validated = donationFormSchema.parse(data)

    // Get project details
    const project = await getProjectById(validated.project_id)

    if (!project) {
      return {
        success: false,
        error: 'project_not_found',
      }
    }

    if (project.status !== 'active') {
      return {
        success: false,
        error: 'project_not_active',
      }
    }

    // Get localized unit name for error messages
    const unitName = getUnitName(
      project.unit_name_i18n,
      project.unit_name,
      validated.locale as SupportedLocale
    )

    // Check quantity limits for non-long-term projects
    if (!project.is_long_term) {
      const remainingUnits = project.target_units - project.current_units
      if (validated.quantity > remainingUnits) {
        return {
          success: false,
          error: 'quantity_exceeded',
          remainingUnits,
          unitName,
        }
      }
    }

    // Calculate amount
    const unitPrice = project.unit_price
    const totalAmount = unitPrice * validated.quantity

    // Generate unique order reference with random suffix to prevent duplicates
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const orderReference = `DONATE-${project.id}-${timestamp}-${randomSuffix}`

    // Split donor name into first and last name
    const nameParts = validated.donor_name.trim().split(/\s+/)
    const clientFirstName = nameParts[0] || 'Donor'
    const clientLastName = nameParts.slice(1).join(' ') || 'Anonymous'

    // Determine language
    let language: 'UA' | 'EN' | 'RU' = 'UA'
    if (validated.locale === 'en') language = 'EN'
    else if (validated.locale === 'zh') language = 'EN' // Use EN for Chinese users
    else if (validated.locale === 'ua') language = 'UA'

    // Prepare return and callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/${validated.locale}/donate/success?order=${orderReference}`
    const serviceUrl = `${baseUrl}/api/webhooks/wayforpay`

    // Get localized project name for payment
    const projectName = getProjectName(
      project.project_name_i18n,
      project.project_name,
      validated.locale as SupportedLocale
    )

    // Create WayForPay payment parameters
    const paymentParams = createWayForPayPayment({
      orderReference,
      amount: totalAmount,
      currency: 'USD', // Using USD for international donations
      productName: [projectName],
      productPrice: [unitPrice],
      productCount: [validated.quantity],
      clientFirstName,
      clientLastName,
      clientEmail: validated.donor_email,
      clientPhone: validated.contact_whatsapp || validated.contact_telegram,
      language,
      returnUrl,
      serviceUrl,
    })

    // Create pending donation records (one per unit)
    // These will be updated to 'paid' status when webhook receives payment confirmation
    const supabase = createServiceClient()
    const donationRecords = []

    for (let i = 0; i < validated.quantity; i++) {
      // Generate donation public ID
      const { data: donationPublicId, error: idError } = await supabase.rpc(
        'generate_donation_public_id',
        { project_id_input: validated.project_id }
      )

      if (idError || !donationPublicId) {
        console.error(`Error generating donation ID:`, idError)
        throw idError || new Error('Failed to generate donation ID')
      }

      donationRecords.push({
        donation_public_id: donationPublicId,
        order_reference: orderReference,
        project_id: validated.project_id,
        donor_name: validated.donor_name,
        donor_email: validated.donor_email,
        donor_message: validated.donor_message || null,
        contact_telegram: validated.contact_telegram || null,
        contact_whatsapp: validated.contact_whatsapp || null,
        amount: unitPrice,
        currency: 'USD',
        payment_method: 'WayForPay',
        donation_status: 'pending' as DonationStatus, // Will be updated to 'paid' by webhook
        locale: validated.locale,
      })
    }

    // Batch insert all pending donation records
    const { error: dbError } = await supabase
      .from('donations')
      .insert(donationRecords)

    if (dbError) {
      console.error('Error creating pending donations:', dbError)
      throw new Error('Failed to create pending donations')
    }

    console.log(`Created ${validated.quantity} pending donation records for order: ${orderReference}`)

    // TEST MODE: Skip payment and simulate success
    if (process.env.NEXT_PUBLIC_TEST_MODE_SKIP_PAYMENT === 'true') {
      console.log('🧪 TEST MODE: Skipping payment, simulating success')

      // Update donations to 'paid' status (simulating webhook)
      const { data: updatedDonations, error: updateError } = await supabase
        .from('donations')
        .update({ donation_status: 'paid' })
        .eq('order_reference', orderReference)
        .select()

      if (updateError) {
        console.error('Error updating test donations:', updateError)
      } else {
        console.log('✅ Test donations updated to paid status')
      }

      // Send confirmation email (simulating webhook behavior)
      try {
        const donationIds = updatedDonations?.map(d => d.donation_public_id) || []

        await sendDonationConfirmation({
          to: validated.donor_email,
          donorName: validated.donor_name,
          projectName: projectName,
          donationIds,
          totalAmount,
          currency: 'USD',
          locale: validated.locale as 'en' | 'zh' | 'ua',
        })

        console.log(`✅ TEST MODE: Confirmation email sent to ${validated.donor_email}`)
      } catch (emailError) {
        console.error('❌ TEST MODE: Failed to send confirmation email:', emailError)
        // Don't fail the test, just log the error
      }

      // Return success with skipPayment flag
      return {
        success: true,
        skipPayment: true,
        amount: totalAmount,
        orderReference,
      }
    }

    // Return payment parameters to client
    return {
      success: true,
      paymentParams: {
        ...paymentParams,
        // Add metadata that will be sent to widget but not used in signature
        metadata: {
          project_id: validated.project_id,
          project_name: projectName,
          quantity: validated.quantity,
          unit_price: unitPrice,
          unit_name: unitName,
          donor_name: validated.donor_name,
          donor_email: validated.donor_email,
          donor_message: validated.donor_message || '',
          contact_telegram: validated.contact_telegram || '',
          contact_whatsapp: validated.contact_whatsapp || '',
          locale: validated.locale,
        },
      },
      amount: totalAmount,
      orderReference,
    }
  } catch (error) {
    console.error('Error creating WayForPay payment:', error)
    return {
      success: false,
      error: 'server_error',
    }
  }
}
