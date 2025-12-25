/**
 * Donation Completed Email Content
 */

import { Locale } from '../../types'

export interface DonationCompletedContent {
  subject: string
  title: string
  greeting: (name: string) => string
  congratulations: string
  completed: string
  impact: string
  projectLabel: string
  locationLabel: string
  quantityLabel: string
  totalAmountLabel: string
  donationIdsLabel: string
  resultTitle: string
  resultDescription: string
  trackingButton: string
  trackingHint: string
  gratitude: string
  shareTitle: string
  shareContent: string
  contact: string
}

export const donationCompletedContent: Record<Locale, DonationCompletedContent> = {
  en: {
    subject: 'Your Donation Has Been Delivered!',
    title: 'Your Donation Has Been Delivered!',
    greeting: (name: string) => `Dear ${name},`,
    congratulations: '🎉 Congratulations!',
    completed: 'We are excited to inform you that your donation has been successfully delivered and is now making a real difference!',
    impact: 'Your generosity has directly contributed to our mission and helped those in need.',
    projectLabel: 'Project:',
    locationLabel: 'Location:',
    quantityLabel: 'Quantity Delivered:',
    totalAmountLabel: 'Your Contribution:',
    donationIdsLabel: 'Donation IDs:',
    resultTitle: 'Delivery Confirmation',
    resultDescription: 'Here is a photo confirming the successful delivery of your donation:',
    trackingButton: 'View Full Details',
    trackingHint: 'Click to view all your donation details, photos and videos',
    gratitude: 'We are deeply grateful for your support. Your contribution is helping us build a better future.',
    shareTitle: 'Share Your Impact',
    shareContent: 'We encourage you to share your contribution with friends and family to inspire others to join our cause.',
    contact: 'Thank you once again for your generous support. If you have any questions, please feel free to contact us.'
  },
  zh: {
    subject: '您的捐赠已送达！',
    title: '您的捐赠已送达！',
    greeting: (name: string) => `尊敬的 ${name}：`,
    congratulations: '🎉 恭喜！',
    completed: '我们很高兴地通知您，您的捐赠已成功送达，现在正在发挥实际作用！',
    impact: '您的慷慨直接促进了我们的使命，帮助了有需要的人。',
    projectLabel: '项目：',
    locationLabel: '地点：',
    quantityLabel: '已送达数量：',
    totalAmountLabel: '您的贡献：',
    donationIdsLabel: '捐赠编号：',
    resultTitle: '配送确认',
    resultDescription: '这是确认您的捐赠成功送达的照片：',
    trackingButton: '查看完整详情',
    trackingHint: '点击查看您的所有捐赠详情、照片和视频',
    gratitude: '我们深深感谢您的支持。您的贡献正在帮助我们建设更美好的未来。',
    shareTitle: '分享您的影响',
    shareContent: '我们鼓励您与朋友和家人分享您的贡献，以激励其他人加入我们的事业。',
    contact: '再次感谢您的慷慨支持。如有任何疑问，请随时与我们联系。'
  },
  ua: {
    subject: 'Ваше пожертвування доставлено!',
    title: 'Ваше пожертвування доставлено!',
    greeting: (name: string) => `Шановний(а) ${name},`,
    congratulations: '🎉 Вітаємо!',
    completed: 'Ми раді повідомити вам, що ваше пожертвування було успішно доставлено і тепер робить реальний внесок!',
    impact: 'Ваша щедрість безпосередньо сприяла нашій місії та допомогла тим, хто потребує.',
    projectLabel: 'Проект:',
    locationLabel: 'Місцезнаходження:',
    quantityLabel: 'Доставлено кількість:',
    totalAmountLabel: 'Ваш внесок:',
    donationIdsLabel: 'ID пожертвувань:',
    resultTitle: 'Підтвердження доставки',
    resultDescription: 'Ось фотографія, що підтверджує успішну доставку вашого пожертвування:',
    trackingButton: 'Переглянути повну інформацію',
    trackingHint: 'Натисніть, щоб переглянути всі деталі вашого пожертвування, фотографії та відео',
    gratitude: 'Ми глибоко вдячні за вашу підтримку. Ваш внесок допомагає нам будувати краще майбутнє.',
    shareTitle: 'Поділіться своїм впливом',
    shareContent: 'Ми заохочуємо вас поділитися своїм внеском з друзями та родиною, щоб надихнути інших приєднатися до нашої справи.',
    contact: 'Ще раз дякуємо за вашу щедру підтримку. Якщо у вас виникнуть запитання, будь ласка, зв\'яжіться з нами.'
  }
}
