/**
 * Donation Completed Email Sender
 */

import { resend, FROM_EMAIL } from '../client'
import { DonationCompletedEmailParams } from '../types'
import { generateDonationCompletedEmail } from '../templates/donation-completed'

/**
 * Send donation completed notification email
 */
export async function sendDonationCompletedEmail(params: DonationCompletedEmailParams) {
  const emailContent = generateDonationCompletedEmail(params)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    if (error) {
      console.error('Error sending donation completed email:', error)
      throw error
    }

    console.log('Donation completed email sent successfully:', data?.id)
    return data
  } catch (error) {
    console.error('Failed to send donation completed email:', error)
    throw error
  }
}
