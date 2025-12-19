import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email sending utility
interface SendDonationConfirmationParams {
  to: string
  donorName: string
  projectName: string
  donationIds: string[]
  totalAmount: number
  currency: string
  locale: 'en' | 'zh' | 'ua'
}

export async function sendDonationConfirmation({
  to,
  donorName,
  projectName,
  donationIds,
  totalAmount,
  currency,
  locale
}: SendDonationConfirmationParams) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@send.waytofutureua.org.ua'

  // Get localized email content
  const emailContent = getEmailContent(locale, {
    donorName,
    projectName,
    donationIds,
    totalAmount,
    currency
  })

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    console.log('Email sent successfully:', data?.id)
    return data
  } catch (error) {
    console.error('Failed to send donation confirmation email:', error)
    throw error
  }
}

// Email content generator
interface EmailContentParams {
  donorName: string
  projectName: string
  donationIds: string[]
  totalAmount: number
  currency: string
}

function getEmailContent(
  locale: 'en' | 'zh' | 'ua',
  params: EmailContentParams
) {
  const { donorName, projectName, donationIds, totalAmount, currency } = params

  const templates = {
    en: {
      subject: `Thank You for Your Donation - ${projectName}`,
      greeting: `Dear ${donorName},`,
      thankYou: 'Thank you for your generous donation!',
      confirmation: `Your payment has been successfully processed. Here are your donation details:`,
      projectLabel: 'Project:',
      amountLabel: 'Total Amount:',
      donationIdsLabel: 'Donation IDs:',
      donationIdsNote: 'Please save these IDs for your records. You can use them to track your donation status.',
      nextSteps: 'What happens next?',
      nextStepsContent: 'We will confirm your donation and begin processing it. You will receive updates as your donation progresses through delivery.',
      contact: 'If you have any questions, please don\'t hesitate to contact us.',
      signature: 'With gratitude,<br>The NGO Team',
      footer: 'This is an automated confirmation email. Please do not reply to this email.'
    },
    zh: {
      subject: `感谢您的捐赠 - ${projectName}`,
      greeting: `尊敬的 ${donorName}：`,
      thankYou: '感谢您的慷慨捐赠！',
      confirmation: '您的支付已成功处理。以下是您的捐赠详情：',
      projectLabel: '项目：',
      amountLabel: '总金额：',
      donationIdsLabel: '捐赠编号：',
      donationIdsNote: '请保存这些编号以便查询。您可以使用这些编号追踪您的捐赠状态。',
      nextSteps: '后续流程',
      nextStepsContent: '我们将确认您的捐赠并开始处理。随着捐赠进展，您将收到更新通知。',
      contact: '如有任何疑问，请随时联系我们。',
      signature: '致以诚挚的感谢，<br>NGO 团队',
      footer: '这是一封自动确认邮件，请勿回复。'
    },
    ua: {
      subject: `Дякуємо за ваше пожертвування - ${projectName}`,
      greeting: `Шановний(а) ${donorName},`,
      thankYou: 'Дякуємо за ваше щедре пожертвування!',
      confirmation: 'Ваш платіж успішно оброблено. Ось деталі вашого пожертвування:',
      projectLabel: 'Проект:',
      amountLabel: 'Загальна сума:',
      donationIdsLabel: 'ID пожертвувань:',
      donationIdsNote: 'Будь ласка, збережіть ці ідентифікатори для ваших записів. Ви можете використовувати їх для відстеження статусу вашого пожертвування.',
      nextSteps: 'Що далі?',
      nextStepsContent: 'Ми підтвердимо ваше пожертвування та почнемо його обробку. Ви отримуватимете оновлення про статус доставки.',
      contact: 'Якщо у вас виникнуть запитання, будь ласка, не соромтеся звертатися до нас.',
      signature: 'З вдячністю,<br>Команда NGO',
      footer: 'Це автоматичне підтвердження. Будь ласка, не відповідайте на цей лист.'
    }
  }

  const t = templates[locale]

  // Format donation IDs as a list
  const donationIdsList = donationIds.map(id => `<li><strong>${id}</strong></li>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .detail-box {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .detail-row {
      margin: 10px 0;
    }
    .label {
      font-weight: 600;
      color: #4a5568;
    }
    .value {
      color: #1a202c;
    }
    .donation-ids {
      list-style: none;
      padding: 0;
      margin: 10px 0;
    }
    .donation-ids li {
      background: #edf2f7;
      padding: 8px 12px;
      margin: 5px 0;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 15px 0;
      font-size: 14px;
    }
    .next-steps {
      background: #e0f2fe;
      border-left: 4px solid #0ea5e9;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .signature {
      margin-top: 30px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">${t.thankYou}</h1>
  </div>

  <div class="content">
    <p>${t.greeting}</p>
    <p>${t.confirmation}</p>

    <div class="detail-box">
      <div class="detail-row">
        <span class="label">${t.projectLabel}</span>
        <span class="value">${projectName}</span>
      </div>
      <div class="detail-row">
        <span class="label">${t.amountLabel}</span>
        <span class="value">${currency} ${totalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="detail-box">
      <div class="detail-row">
        <span class="label">${t.donationIdsLabel}</span>
      </div>
      <ul class="donation-ids">
        ${donationIdsList}
      </ul>
    </div>

    <div class="note">
      ${t.donationIdsNote}
    </div>

    <div class="next-steps">
      <strong>${t.nextSteps}</strong>
      <p style="margin: 10px 0 0 0;">${t.nextStepsContent}</p>
    </div>

    <p>${t.contact}</p>

    <div class="signature">
      ${t.signature}
    </div>
  </div>

  <div class="footer">
    ${t.footer}
  </div>
</body>
</html>
  `.trim()

  // Plain text version
  const text = `
${t.greeting}

${t.thankYou}

${t.confirmation}

${t.projectLabel} ${projectName}
${t.amountLabel} ${currency} ${totalAmount.toFixed(2)}

${t.donationIdsLabel}
${donationIds.map(id => `- ${id}`).join('\n')}

${t.donationIdsNote}

${t.nextSteps}
${t.nextStepsContent}

${t.contact}

${t.signature.replace('<br>', '\n')}

---
${t.footer}
  `.trim()

  return {
    subject: t.subject,
    html,
    text
  }
}
