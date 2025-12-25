/**
 * Refund Success Email Content
 */

import { Locale } from '../../types'

export interface RefundSuccessContent {
  subject: string
  title: string
  greeting: (name: string) => string
  confirmation: string
  processed: string
  refundAmountLabel: string
  donationIdsLabel: string
  reasonLabel: string
  processingTime: string
  gratitude: string
  hopeToContinue: string
  contact: string
}

export const refundSuccessContent: Record<Locale, RefundSuccessContent> = {
  en: {
    subject: 'Your Refund Has Been Processed',
    title: 'Refund Processed',
    greeting: (name: string) => `Dear ${name},`,
    confirmation: 'Your refund request has been approved and processed.',
    processed: 'We have processed your refund for the following donation(s):',
    refundAmountLabel: 'Refund Amount:',
    donationIdsLabel: 'Donation IDs:',
    reasonLabel: 'Reason:',
    processingTime: 'The refunded amount will be returned to your original payment method within 5-10 business days.',
    gratitude: 'We appreciate your understanding and are sorry we could not fulfill your donation at this time.',
    hopeToContinue: 'We hope you will consider supporting our mission again in the future. Your support means a lot to us.',
    contact: 'If you have any questions about this refund, please don\'t hesitate to contact us.'
  },
  zh: {
    subject: '您的退款已处理',
    title: '退款已处理',
    greeting: (name: string) => `尊敬的 ${name}：`,
    confirmation: '您的退款申请已获批准并处理。',
    processed: '我们已为以下捐赠处理了退款：',
    refundAmountLabel: '退款金额：',
    donationIdsLabel: '捐赠编号：',
    reasonLabel: '原因：',
    processingTime: '退款金额将在 5-10 个工作日内退还至您的原支付方式。',
    gratitude: '感谢您的理解，很抱歉我们目前无法完成您的捐赠。',
    hopeToContinue: '我们希望您将来会考虑再次支持我们的使命。您的支持对我们意义重大。',
    contact: '如果您对此退款有任何疑问，请随时与我们联系。'
  },
  ua: {
    subject: 'Ваше повернення коштів оброблено',
    title: 'Повернення коштів оброблено',
    greeting: (name: string) => `Шановний(а) ${name},`,
    confirmation: 'Ваш запит на повернення коштів було схвалено та оброблено.',
    processed: 'Ми обробили ваше повернення коштів для наступних пожертвувань:',
    refundAmountLabel: 'Сума повернення:',
    donationIdsLabel: 'ID пожертвувань:',
    reasonLabel: 'Причина:',
    processingTime: 'Повернута сума буде зарахована на ваш оригінальний спосіб оплати протягом 5-10 робочих днів.',
    gratitude: 'Ми цінуємо ваше розуміння і шкодуємо, що не змогли виконати ваше пожертвування на цей час.',
    hopeToContinue: 'Ми сподіваємося, що ви розглянете можливість підтримати нашу місію знову в майбутньому. Ваша підтримка дуже важлива для нас.',
    contact: 'Якщо у вас виникнуть запитання щодо цього повернення, будь ласка, зв\'яжіться з нами.'
  }
}
