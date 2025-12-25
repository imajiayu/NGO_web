/**
 * Test script for donation completed email
 * Run with: npx tsx scripts/test-donation-completed-email.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import { sendDonationCompletedEmail } from '../lib/email'

async function testDonationCompletedEmail() {
  console.log('📧 Testing Donation Completed Email\n')
  console.log('='.repeat(60))

  const params = {
    to: 'majiayu110@gmail.com',
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
    donationIds: ['2-ABC123'],
    quantity: 1,
    totalAmount: 50.00,
    currency: 'UAH',
    locale: 'zh' as const,
    resultImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800' // 示例图片
  }

  console.log('\n📧 发送捐赠完成邮件，参数：')
  console.log(`   收件人: ${params.to}`)
  console.log(`   捐赠人: ${params.donorName}`)
  console.log(`   项目: ${params.projectNameI18n.zh}`)
  console.log(`   地点: ${params.locationI18n.zh}`)
  console.log(`   数量: ${params.quantity} ${params.unitNameI18n.zh}`)
  console.log(`   金额: ${params.currency} ${params.totalAmount.toFixed(2)}`)
  console.log(`   捐赠ID: ${params.donationIds.join(', ')}`)
  console.log(`   语言: ${params.locale}`)
  console.log(`   结果图片: ${params.resultImageUrl}`)
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
    console.log('2. 检查垃圾邮件文件夹')
    console.log('3. 确认邮件内容包含：')
    console.log('   - 祝贺信息')
    console.log('   - 捐赠编号: 2-ABC123')
    console.log('   - 配送确认图片')
    console.log('   - 追踪按钮链接到: http://localhost:3000/zh/track-donation')
    console.log('4. 访问 Resend Dashboard 查看详细送达状态：')
    console.log('   https://resend.com/emails/' + result?.id)
    console.log('\n')
  } catch (error) {
    console.error('❌ 发送失败：')
    console.error(error)
    process.exit(1)
  }
}

testDonationCompletedEmail()
