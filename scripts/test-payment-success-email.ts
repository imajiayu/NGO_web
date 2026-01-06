/**
 * 测试支付确认邮件（多捐赠项目）
 * 运行: npx tsx scripts/test-payment-success-email.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { sendPaymentSuccessEmail, type DonationItem } from '../lib/email'

async function testPaymentSuccessEmail() {
  console.log('📧 Testing Payment Success Email with Multiple Donations...\n')

  // Mock 3个非聚合项目（物资捐赠，每个15.4美元）
  const unitDonations: DonationItem[] = [
    {
      donationPublicId: 'DN-2026-TEST-001',
      projectNameI18n: {
        en: 'Rehabilitation Center for War Victims',
        zh: '康复中心免费康复战争受害者',
        ua: 'Реабілітаційний центр для постраждалих від війни'
      },
      locationI18n: {
        en: 'Dnipro, Ukraine',
        zh: '乌克兰 第聂伯罗',
        ua: 'Дніпро, Україна'
      },
      unitNameI18n: {
        en: 'rehabilitation session',
        zh: '康复疗程',
        ua: 'реабілітаційний сеанс'
      },
      amount: 15.40,
      isAggregate: false
    },
    {
      donationPublicId: 'DN-2026-TEST-002',
      projectNameI18n: {
        en: 'Rehabilitation Center for War Victims',
        zh: '康复中心免费康复战争受害者',
        ua: 'Реабілітаційний центр для постраждалих від війни'
      },
      locationI18n: {
        en: 'Dnipro, Ukraine',
        zh: '乌克兰 第聂伯罗',
        ua: 'Дніпро, Україна'
      },
      unitNameI18n: {
        en: 'rehabilitation session',
        zh: '康复疗程',
        ua: 'реабілітаційний сеанс'
      },
      amount: 15.40,
      isAggregate: false
    },
    {
      donationPublicId: 'DN-2026-TEST-003',
      projectNameI18n: {
        en: 'Food Supply for Frontline Soldiers',
        zh: '前线士兵食品供应',
        ua: 'Продовольче забезпечення для солдатів на передовій'
      },
      locationI18n: {
        en: 'Kharkiv, Ukraine',
        zh: '乌克兰 哈尔科夫',
        ua: 'Харків, Україна'
      },
      unitNameI18n: {
        en: 'food package',
        zh: '食品包',
        ua: 'продуктовий набір'
      },
      amount: 15.40,
      isAggregate: false
    }
  ]

  // Mock 1个聚合项目（金额捐赠，100美元）
  const aggregateDonation: DonationItem = {
    donationPublicId: 'DN-2026-TEST-004',
    projectNameI18n: {
      en: 'General Support Fund',
      zh: '通用支持基金',
      ua: 'Фонд загальної підтримки'
    },
    locationI18n: {
      en: 'Kyiv, Ukraine',
      zh: '乌克兰 基辅',
      ua: 'Київ, Україна'
    },
    unitNameI18n: {
      en: 'donation',
      zh: '捐赠',
      ua: 'пожертвування'
    },
    amount: 100.00,
    isAggregate: true  // 聚合模式，不显示单位名称
  }

  // 组合所有捐赠
  const allDonations = [...unitDonations, aggregateDonation]

  // 计算总金额
  const totalAmount = allDonations.reduce((sum, d) => sum + d.amount, 0)

  console.log('📋 Test Data:')
  console.log(`   - 3 unit donations @ $15.40 each = $${(15.40 * 3).toFixed(2)}`)
  console.log(`   - 1 aggregate donation = $100.00`)
  console.log(`   - Total: $${totalAmount.toFixed(2)}`)
  console.log('')

  try {
    console.log('📤 Sending email to majiayu110@gmail.com...')

    const result = await sendPaymentSuccessEmail({
      to: 'majiayu110@gmail.com',
      locale: 'zh',  // 使用中文
      donorName: '测试用户',
      donations: allDonations,
      totalAmount: totalAmount,
      currency: 'USD'
    })

    console.log('✅ Email sent successfully!')
    console.log(`   Email ID: ${result?.id}`)
    console.log('')
    console.log('📬 Please check majiayu110@gmail.com for the test email.')

  } catch (error) {
    console.error('❌ Failed to send email:', error)
    process.exit(1)
  }
}

// 运行测试
testPaymentSuccessEmail()
