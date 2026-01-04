import { EmailTemplate } from '../index'

/**
 * 新项目通知邮件模板
 * 用于向订阅者群发新项目上线通知
 */
const template: EmailTemplate = {
  name: 'New Project Announcement',
  fileName: 'new-project',
  subject: {
    en: 'New Project Available - Help Make a Difference',
    zh: '新项目上线 - 帮助改变世界',
    ua: 'Новий проект доступний - Допоможіть змінити світ',
  },
  // 内容文件存储在 lib/email/templates/content/ 目录
  // 实际文件: new-project.en.html, new-project.zh.html, new-project.ua.html
  contentFile: 'new-project',
}

export default template
