/**
 * Refund Success Email Sender
 */

import { resend, FROM_EMAIL } from '../client'
import { RefundSuccessEmailParams } from '../types'
import { generateRefundSuccessEmail } from '../templates/refund-success'

/**
 * Send refund success notification email
 */
export async function sendRefundSuccessEmail(params: RefundSuccessEmailParams) {
  const emailContent = generateRefundSuccessEmail(params)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    if (error) {
      console.error('Error sending refund success email:', error)
      throw error
    }

    console.log('Refund success email sent successfully:', data?.id)
    return data
  } catch (error) {
    console.error('Failed to send refund success email:', error)
    throw error
  }
}
