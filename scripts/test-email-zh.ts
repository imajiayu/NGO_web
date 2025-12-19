/**
 * Test script for Chinese email only
 * Run with: npm run test:email:zh
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

// Generate random donation ID
function generateDonationId(projectId: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${projectId}-${id}`
}

async function testChineseEmail() {
  const { sendDonationConfirmation } = await import('../lib/email/server')

  console.log('🇨🇳 Testing Chinese Email Only\n')
  console.log('='.repeat(60))

  const donationIds = [
    generateDonationId(2),
    generateDonationId(2),
    generateDonationId(2),
  ]

  const params = {
    to: 'majiayu110@gmail.com',
    donorName: '张伟',
    projectName: '清洁水源项目',
    donationIds,
    totalAmount: 150.00,
    currency: 'UAH',
    locale: 'zh' as const,
  }

  console.log('\n📧 发送中文邮件，参数：')
  console.log(`   收件人: ${params.to}`)
  console.log(`   捐赠人: ${params.donorName}`)
  console.log(`   项目名称: ${params.projectName}`)
  console.log(`   金额: ${params.currency} ${params.totalAmount.toFixed(2)}`)
  console.log(`   捐赠ID: ${params.donationIds.join(', ')}`)
  console.log(`   语言: ${params.locale}`)
  console.log('')

  try {
    console.log('⏳ 正在发送...\n')
    const result = await sendDonationConfirmation(params)

    console.log('✅ 邮件发送成功！')
    console.log(`📬 Resend Email ID: ${result?.id}`)
    console.log('\n📊 详细信息：')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n' + '='.repeat(60))
    console.log('\n💡 请执行以下步骤：')
    console.log('1. 检查收件箱: majiayu110@gmail.com')
    console.log('2. 检查垃圾邮件文件夹')
    console.log('3. 访问 Resend Dashboard 查看详细送达状态：')
    console.log('   https://resend.com/emails/' + result?.id)
    console.log('\n')
  } catch (error) {
    console.error('❌ 发送失败：')
    console.error(error)
    process.exit(1)
  }
}

testChineseEmail()
