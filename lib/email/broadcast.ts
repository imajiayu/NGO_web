import { Resend } from 'resend'
import { EmailTemplate, loadTemplateContent, replaceTemplateVariables } from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BroadcastEmailParams {
  template: EmailTemplate
  locale: 'en' | 'zh' | 'ua'
  recipients: string[]
  variables?: Record<string, string>
}

interface BroadcastResult {
  successCount: number
  failureCount: number
  errors: Array<{ email: string; error: string }>
}

/**
 * 群发邮件给指定语言的订阅者
 * @param params - 群发参数
 * @returns 发送结果统计
 */
export async function sendBroadcastEmail(
  params: BroadcastEmailParams
): Promise<BroadcastResult> {
  const { template, locale, recipients, variables = {} } = params

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // 加载邮件内容
  const content = loadTemplateContent(template.contentFile)
  if (!content) {
    throw new Error(`Failed to load template content: ${template.contentFile}`)
  }

  // 获取对应语言的主题和内容
  const subject = template.subject[locale]
  let htmlContent = content[locale]

  // 默认变量（如果未提供）
  const defaultVariables: Record<string, string> = {
    donate_url: `${appUrl}/${locale}/donate`,
    app_url: appUrl,
    ...variables,
  }

  let successCount = 0
  let failureCount = 0
  const errors: Array<{ email: string; error: string }> = []

  // 批量发送邮件（每批最多 50 个收件人）
  const batches: string[][] = []
  for (let i = 0; i < recipients.length; i += 50) {
    batches.push(recipients.slice(i, i + 50))
  }

  for (const batch of batches) {
    const results = await Promise.allSettled(
      batch.map(async (email) => {
        // 为每个收件人生成唯一的取消订阅链接
        const unsubscribeUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&locale=${locale}`

        // 替换模板变量
        const personalizedVariables = {
          ...defaultVariables,
          unsubscribe_url: unsubscribeUrl,
        }
        const personalizedHtml = replaceTemplateVariables(htmlContent, personalizedVariables)

        // 发送邮件
        return resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: email,
          subject: subject,
          html: personalizedHtml,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
      })
    )

    // 统计结果
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++
      } else {
        failureCount++
        errors.push({
          email: batch[index],
          error: result.reason?.message || 'Unknown error',
        })
      }
    })
  }

  // 打印错误日志（如果有）
  if (errors.length > 0) {
    console.error('Broadcast email errors:', errors)
  }

  return {
    successCount,
    failureCount,
    errors,
  }
}

/**
 * 测试邮件发送（发送到单个测试邮箱）
 * @param templateFileName - 模板文件名
 * @param testEmail - 测试邮箱
 * @param locale - 语言
 */
export async function sendTestEmail(
  templateFileName: string,
  testEmail: string,
  locale: 'en' | 'zh' | 'ua' = 'en'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getEmailTemplate } = require('./templates')
    const template = getEmailTemplate(templateFileName)

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    const result = await sendBroadcastEmail({
      template,
      locale,
      recipients: [testEmail],
    })

    return {
      success: result.successCount > 0,
      error: result.errors[0]?.error,
    }
  } catch (err) {
    console.error('Test email error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
