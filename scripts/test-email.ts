/**
 * Test script for email functionality - All Languages
 * Run with: npx tsx scripts/test-email.ts
 *
 * This script sends test emails in all 3 languages using the new email system
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import { sendPaymentSuccessEmail } from '../lib/email'
import type { Locale } from '../lib/email'

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
  console.log('🧪 Testing email functionality - Sending 3 emails in different languages\n')
  console.log('='.repeat(60))
  console.log('\n')

  const testEmail = 'majiayu110@gmail.com'

  const testCases = [
    {
      locale: 'en' as Locale,
      donorName: 'John Smith',
      projectNameI18n: {
        en: 'Clean Water Project',
        zh: '清洁水源项目',
        ua: 'Проект чистої води'
      },
      locationI18n: {
        en: 'Kyiv, Ukraine',
        zh: '乌克兰基辅',
        ua: 'Київ, Україна'
      },
      unitNameI18n: {
        en: 'water filter',
        zh: '净水器',
        ua: 'фільтр для води'
      },
      projectId: 1,
      quantity: 3,
      unitPrice: 50.00,
      flag: '🇺🇸'
    },
    {
      locale: 'zh' as Locale,
      donorName: '张伟',
      projectNameI18n: {
        en: 'Medical Supplies Project',
        zh: '医疗物资项目',
        ua: 'Проект медичних товарів'
      },
      locationI18n: {
        en: 'Lviv, Ukraine',
        zh: '乌克兰利沃夫',
        ua: 'Львів, Україна'
      },
      unitNameI18n: {
        en: 'medical kit',
        zh: '医疗包',
        ua: 'медичний набір'
      },
      projectId: 2,
      quantity: 5,
      unitPrice: 30.00,
      flag: '🇨🇳'
    },
    {
      locale: 'ua' as Locale,
      donorName: 'Олександр Петренко',
      projectNameI18n: {
        en: 'Food Assistance Project',
        zh: '食品援助项目',
        ua: 'Проект продовольчої допомоги'
      },
      locationI18n: {
        en: 'Kharkiv, Ukraine',
        zh: '乌克兰哈尔科夫',
        ua: 'Харків, Україна'
      },
      unitNameI18n: {
        en: 'food package',
        zh: '食品包',
        ua: 'продуктовий пакет'
      },
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
      projectNameI18n: test.projectNameI18n,
      locationI18n: test.locationI18n,
      unitNameI18n: test.unitNameI18n,
      donationIds,
      quantity: test.quantity,
      unitPrice: test.unitPrice,
      totalAmount,
      currency: 'UAH',
      locale: test.locale,
    }

    console.log('📧 Sending email with params:')
    console.log(`   Donor: ${params.donorName}`)
    console.log(`   Project: ${params.projectNameI18n[params.locale]}`)
    console.log(`   Location: ${params.locationI18n[params.locale]}`)
    console.log(`   Quantity: ${params.quantity} ${params.unitNameI18n[params.locale]}`)
    console.log(`   Amount: ${params.currency} ${params.totalAmount.toFixed(2)}`)
    console.log(`   IDs: ${params.donationIds.join(', ')}`)
    console.log(`   Locale: ${params.locale}`)
    console.log('')

    try {
      const result = await sendPaymentSuccessEmail(params)
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
