/**
 * Test script for donation completed email WITHOUT image (fallback test)
 * Run with: npx tsx scripts/test-donation-completed-no-image.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import { sendDonationCompletedEmail } from '../lib/email'

async function testDonationCompletedEmailNoImage() {
  console.log('📧 Testing Donation Completed Email (NO IMAGE - Fallback)\n')
  console.log('='.repeat(60))

  const params = {
    to: 'majiayu110@gmail.com',
    donorName: '李明',
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
    donationIds: ['3-XYZ789'],
    quantity: 2,
    totalAmount: 100.00,
    currency: 'UAH',
    locale: 'zh' as const,
    // resultImageUrl: undefined  // 故意不传图片，测试兜底逻辑
  }

  console.log('\n📧 发送捐赠完成邮件（无图片），参数：')
  console.log(`   收件人: ${params.to}`)
  console.log(`   捐赠人: ${params.donorName}`)
  console.log(`   项目: ${params.projectNameI18n.zh}`)
  console.log(`   地点: ${params.locationI18n.zh}`)
  console.log(`   数量: ${params.quantity} ${params.unitNameI18n.zh}`)
  console.log(`   金额: ${params.currency} ${params.totalAmount.toFixed(2)}`)
  console.log(`   捐赠ID: ${params.donationIds.join(', ')}`)
  console.log(`   语言: ${params.locale}`)
  console.log(`   结果图片: [无] ← 测试兜底逻辑`)
  console.log('')

  try {
    console.log('⏳ 正在发送...\n')
    const result = await sendDonationCompletedEmail(params)

    console.log('✅ 邮件发送成功！')
    console.log(`📬 Resend Email ID: ${result?.id}`)
    console.log('\n📊 详细信息：')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n' + '='.repeat(60))
    console.log('\n💡 请执行以下步骤：')
    console.log('1. 检查收件箱: majiayu110@gmail.com')
    console.log('2. 确认邮件内容：')
    console.log('   ✅ 应该有：捐赠编号、项目信息')
    console.log('   ✅ 应该有："查看完整详情"按钮')
    console.log('   ❌ 不应该有："这是确认您的捐赠成功送达的照片："')
    console.log('   ❌ 不应该有：图片')
    console.log('3. 访问 Resend Dashboard 查看详细送达状态：')
    console.log('   https://resend.com/emails/' + result?.id)
    console.log('\n')
  } catch (error) {
    console.error('❌ 发送失败：')
    console.error(error)
    process.exit(1)
  }
}

testDonationCompletedEmailNoImage()
