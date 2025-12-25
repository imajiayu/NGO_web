/**
 * Payment Success Email Sender
 */

import { resend, FROM_EMAIL } from '../client'
import { PaymentSuccessEmailParams } from '../types'
import { generatePaymentSuccessEmail } from '../templates/payment-success'

/**
 * Send payment success confirmation email
 */
export async function sendPaymentSuccessEmail(params: PaymentSuccessEmailParams) {
  const emailContent = generatePaymentSuccessEmail(params)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    if (error) {
      console.error('Error sending payment success email:', error)
      throw error
    }

    console.log('Payment success email sent successfully:', data?.id)
    return data
  } catch (error) {
    console.error('Failed to send payment success email:', error)
    throw error
  }
}
