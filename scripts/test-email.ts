/**
 * Test script for email functionality
 * Run with: npx tsx scripts/test-email.ts
 *
 * This script sends 3 test emails in different languages (en, zh, ua)
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

// Generate random donation ID in format: {project_id}-{6 chars}
function generateDonationId(projectId: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${projectId}-${id}`
}

async function testEmail() {
  // Dynamic import after dotenv is configured
  const { sendDonationConfirmation } = await import('../lib/email/server')
  console.log('🧪 Testing email functionality - Sending 3 emails in different languages\n')
  console.log('='.repeat(60))
  console.log('\n')

  const testEmail = 'majiayu110@gmail.com'

  const testCases = [
    {
      locale: 'en' as const,
      donorName: 'John Smith',
      projectName: 'Clean Water Project',
      projectId: 1,
      quantity: 3,
      unitPrice: 50.00,
      flag: '🇺🇸'
    },
    {
      locale: 'zh' as const,
      donorName: '张伟',
      projectName: '清洁水源项目',
      projectId: 2,
      quantity: 5,
      unitPrice: 30.00,
      flag: '🇨🇳'
    },
    {
      locale: 'ua' as const,
      donorName: 'Олександр Петренко',
      projectName: 'Проект чистої води',
      projectId: 3,
      quantity: 4,
      unitPrice: 40.00,
      flag: '🇺🇦'
    }
  ]

  let successCount = 0

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i]
    const donationIds = Array.from({ length: test.quantity }, () =>
      generateDonationId(test.projectId)
    )
    const totalAmount = test.quantity * test.unitPrice

    console.log(`${test.flag} Test ${i + 1}/3: ${test.locale.toUpperCase()} Email`)
    console.log('-'.repeat(60))

    const params = {
      to: testEmail,
      donorName: test.donorName,
      projectName: test.projectName,
      donationIds,
      totalAmount,
      currency: 'UAH',
      locale: test.locale,
    }

    console.log('📧 Sending email with params:')
    console.log(`   Donor: ${params.donorName}`)
    console.log(`   Project: ${params.projectName}`)
    console.log(`   Amount: ${params.currency} ${params.totalAmount.toFixed(2)}`)
    console.log(`   IDs: ${params.donationIds.join(', ')}`)
    console.log(`   Locale: ${params.locale}`)
    console.log('')

    try {
      const result = await sendDonationConfirmation(params)
      console.log('✅ Email sent successfully!')
      console.log(`📬 Email ID: ${result?.id}`)
      successCount++
    } catch (error) {
      console.error('❌ Failed to send email:')
      console.error(error)
    }

    console.log('\n')

    // Add a small delay between emails
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('='.repeat(60))
  console.log(`\n📊 Results: ${successCount}/${testCases.length} emails sent successfully`)
  console.log(`✨ Check your inbox at: ${testEmail}\n`)

  if (successCount < testCases.length) {
    process.exit(1)
  }
}

// Run the test
testEmail()
