import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Webhook handler for incoming emails from Resend
 * Automatically forwards emails to majiayu110@gmail.com
 */
export async function POST(req: NextRequest) {
  try {
    // Parse incoming email data from Resend webhook
    const payload = await req.json()

    console.log('📧 Received inbound email:', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      receivedAt: new Date().toISOString(),
    })

    // Extract email details
    const {
      from,
      to,
      subject,
      html,
      text,
      reply_to,
      cc,
      bcc,
      attachments,
    } = payload

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
              <p style="margin: 4px 0;"><strong>To:</strong> ${to}</p>
              <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject || '(No Subject)'}</p>
              ${reply_to ? `<p style="margin: 4px 0;"><strong>Reply-To:</strong> ${reply_to}</p>` : ''}
              ${cc ? `<p style="margin: 4px 0;"><strong>CC:</strong> ${cc}</p>` : ''}
            </div>
          </div>

          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
            ${html || `<pre style="white-space: pre-wrap; font-family: inherit;">${text || '(No content)'}</pre>`}
          </div>
        </div>
      `,
      text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 FORWARDED EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From: ${from}
To: ${to}
Subject: ${subject || '(No Subject)'}
${reply_to ? `Reply-To: ${reply_to}` : ''}
${cc ? `CC: ${cc}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${text || '(No content)'}
      `.trim(),
      // Forward attachments if any
      ...(attachments && attachments.length > 0
        ? { attachments }
        : {}),
    })

    console.log('✅ Email forwarded successfully:', forwardResult)

    // Return success response to Resend
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

    // Log error but return 200 to prevent Resend from retrying
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}
