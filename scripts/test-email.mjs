#!/usr/bin/env node

/**
 * Test Email Sending Script
 * Tests Resend email configuration
 */

import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, '../.env.local')

dotenv.config({ path: envPath })

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env.local')
  process.exit(1)
}

const resend = new Resend(RESEND_API_KEY)

async function testEmail() {
  console.log('🧪 Testing Resend Email Configuration\n')
  console.log(`API Key: ${RESEND_API_KEY.substring(0, 10)}...`)
  console.log(`From Email: ${FROM_EMAIL}\n`)

  // Get recipient email from command line or use default
  const toEmail = process.argv[2] || 'test@example.com'

  console.log(`Sending test email to: ${toEmail}\n`)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: '🧪 Test Email - NGO Platform',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">🧪 Test Email</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0;">
            <p><strong>This is a test email from your NGO platform.</strong></p>
            <p>If you're seeing this, your Resend configuration is working correctly!</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              <strong>Configuration:</strong><br>
              From: ${FROM_EMAIL}<br>
              To: ${toEmail}<br>
              Time: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
      text: `
🧪 Test Email

This is a test email from your NGO platform.
If you're seeing this, your Resend configuration is working correctly!

Configuration:
From: ${FROM_EMAIL}
To: ${toEmail}
Time: ${new Date().toLocaleString()}
      `
    })

    if (error) {
      console.error('❌ Error sending email:', error)
      process.exit(1)
    }

    console.log('✅ Email sent successfully!')
    console.log(`Email ID: ${data?.id}\n`)
    console.log('📧 Check your inbox (and spam folder) for the test email.')
    console.log('📊 You can also check the Resend dashboard: https://resend.com/emails\n')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testEmail()
