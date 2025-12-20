import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Webhook handler for incoming emails from Resend
 * Automatically forwards emails to majiayu110@gmail.com
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Extract email data from webhook payload
    const { email_id, from, to, subject, cc, bcc } = payload.data

    console.log('📧 Received inbound email webhook:', {
      email_id,
      from,
      to: to[0],
      subject,
    })

    // Fetch full email content using Resend Inbound API
    // Note: TypeScript might not recognize 'receiving' yet, using type assertion
    const { data: emailContent, error: fetchError } = await (
      resend.emails as any
    ).receiving.get(email_id)

    if (fetchError || !emailContent) {
      throw new Error(
        `Failed to fetch email content: ${fetchError?.message || 'Unknown error'}`
      )
    }

    const htmlBody = emailContent.html || ''
    const textBody = emailContent.text || ''

    // Format recipient addresses
    const toAddresses = Array.isArray(to) ? to.join(', ') : to
    const ccAddresses = cc && cc.length > 0 ? cc.join(', ') : null
    const bccAddresses = bcc && bcc.length > 0 ? bcc.join(', ') : null

    // Forward the email to majiayu110@gmail.com
    const forwardResult = await resend.emails.send({
      from: 'contact@waytofutureua.org.ua',
      to: 'majiayu110@gmail.com',
      subject: `[Forwarded] ${subject || '(No Subject)'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; color: #374151;">📨 Forwarded Email</h3>
            <div style="font-size: 14px; color: #6b7280;">
              <p style="margin: 4px 0;"><strong>From:</strong> ${from}</p>
              <p style="margin: 4px 0;"><strong>To:</strong> ${toAddresses}</p>
              <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject || '(No Subject)'}</p>
              ${ccAddresses ? `<p style="margin: 4px 0;"><strong>CC:</strong> ${ccAddresses}</p>` : ''}
            </div>
          </div>

          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
            ${htmlBody || `<pre style="white-space: pre-wrap; font-family: inherit;">${textBody || '(No content)'}</pre>`}
          </div>
        </div>
      `,
      text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 FORWARDED EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From: ${from}
To: ${toAddresses}
Subject: ${subject || '(No Subject)'}
${ccAddresses ? `CC: ${ccAddresses}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${textBody || '(No content)'}
      `.trim(),
    })

    console.log('✅ Email forwarded successfully:', {
      messageId: forwardResult.data?.id,
      forwardedTo: 'majiayu110@gmail.com',
    })

    return NextResponse.json(
      {
        success: true,
        messageId: forwardResult.data?.id,
        forwardedTo: 'majiayu110@gmail.com',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error forwarding email:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}
