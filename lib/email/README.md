# Email System Documentation

> 统一的、可维护的、多语言邮件系统

## 📋 目录

- [概述](#概述)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [邮件类型](#邮件类型)
- [使用方法](#使用方法)
- [添加新邮件类型](#添加新邮件类型)
- [配置](#配置)
- [测试](#测试)

---

## 概述

这是一个为 NGO 平台设计的邮件系统，具有以下特性：

✅ **统一的设计系统**
- 统一的品牌元素（Logo、颜色、字体）
- 可复用的组件（Header、Footer、按钮等）
- 一致的布局和样式

✅ **多语言支持**
- 支持 3 种语言（英文、中文、乌克兰语）
- 使用项目的 i18n 字段（`project_name_i18n` 等）
- 自动根据用户语言选择内容

✅ **类型安全**
- TypeScript 严格类型检查
- 明确的参数接口
- 编译时错误检测

✅ **易于扩展**
- 模块化设计
- 清晰的目录结构
- 简单的模板创建流程

---

## 目录结构

```
lib/email/
├── index.ts                       # 主入口 - 导出所有 API
├── client.ts                      # Resend 客户端初始化
├── config.ts                      # 配置（品牌、颜色等）
├── types.ts                       # TypeScript 类型定义
├── utils.ts                       # 工具函数
├── server.old.ts                  # 旧邮件系统（备份）
│
├── templates/                     # 邮件模板
│   ├── base/                      # 基础模板
│   │   ├── layout.ts              # HTML 布局
│   │   ├── styles.ts              # CSS 样式
│   │   └── components.ts          # 可复用组件
│   │
│   ├── payment-success/           # 支付成功邮件
│   │   ├── index.ts               # 模板生成器
│   │   └── content.ts             # 多语言内容
│   │
│   ├── donation-completed/        # 捐赠完成邮件
│   │   ├── index.ts
│   │   └── content.ts
│   │
│   └── refund-success/            # 退款成功邮件
│       ├── index.ts
│       └── content.ts
│
└── senders/                       # 邮件发送函数
    ├── payment-success.ts         # 发送支付成功邮件
    ├── donation-completed.ts      # 发送捐赠完成邮件
    └── refund-success.ts          # 发送退款成功邮件
```

---

## 快速开始

### 1. 导入邮件发送函数

```typescript
import { sendPaymentSuccessEmail } from '@/lib/email'
```

### 2. 准备参数

```typescript
const emailParams = {
  to: 'donor@example.com',
  donorName: 'John Doe',
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
  donationIds: ['1-ABC123', '1-DEF456'],
  quantity: 2,
  unitPrice: 50.00,
  totalAmount: 100.00,
  currency: 'UAH',
  locale: 'en'
}
```

### 3. 发送邮件

```typescript
try {
  const result = await sendPaymentSuccessEmail(emailParams)
  console.log('Email sent:', result?.id)
} catch (error) {
  console.error('Failed to send email:', error)
}
```

---

## 邮件类型

### 1. 支付成功邮件

**用途**: 用户完成支付后立即发送

**触发时机**: WayForPay Webhook 收到 `Approved` 状态

**内容**:
- 感谢信息
- 捐赠详情（项目、地点、数量、金额）
- 捐赠 ID 列表
- 追踪链接
- 后续流程说明

**发送函数**:
```typescript
import { sendPaymentSuccessEmail } from '@/lib/email'

await sendPaymentSuccessEmail({
  to: string
  donorName: string
  projectNameI18n: I18nText
  locationI18n: I18nText
  unitNameI18n: I18nText
  donationIds: string[]
  quantity: number
  unitPrice: number
  totalAmount: number
  currency: string
  locale: 'en' | 'zh' | 'ua'
})
```

---

### 2. 捐赠完成邮件

**用途**: 捐赠配送完成后发送

**触发时机**: 管理员将捐赠状态更新为 `completed`

**内容**:
- 祝贺信息
- 捐赠详情
- 配送确认照片
- 感谢和分享鼓励

**发送函数**:
```typescript
import { sendDonationCompletedEmail } from '@/lib/email'

await sendDonationCompletedEmail({
  to: string
  donorName: string
  projectNameI18n: I18nText
  locationI18n: I18nText
  unitNameI18n: I18nText
  donationIds: string[]
  quantity: number
  totalAmount: number
  currency: string
  locale: 'en' | 'zh' | 'ua'
  resultImageUrl?: string  // 可选：配送照片
})
```

**使用示例**（管理员更新捐赠状态时）:

```typescript
// 在 app/actions/admin.ts 中
import { sendDonationCompletedEmail } from '@/lib/email'

export async function completeDonation(donationId: string, resultImageUrl: string) {
  // 1. 更新捐赠状态
  const { data: donation } = await supabase
    .from('donations')
    .update({
      donation_status: 'completed',
      donation_result_url: resultImageUrl
    })
    .eq('id', donationId)
    .select()
    .single()

  // 2. 获取项目信息
  const { data: project } = await supabase
    .from('projects')
    .select('project_name_i18n, location_i18n, unit_name_i18n')
    .eq('id', donation.project_id)
    .single()

  // 3. 发送完成邮件
  await sendDonationCompletedEmail({
    to: donation.donor_email,
    donorName: donation.donor_name,
    projectNameI18n: project.project_name_i18n,
    locationI18n: project.location_i18n,
    unitNameI18n: project.unit_name_i18n,
    donationIds: [donation.donation_public_id],
    quantity: 1,
    totalAmount: donation.amount,
    currency: 'UAH',
    locale: donation.locale,
    resultImageUrl
  })
}
```

---

### 3. 退款成功邮件

**用途**: 退款处理完成后发送

**触发时机**: WayForPay Webhook 收到 `Refunded` 状态

**内容**:
- 退款确认信息
- 退款金额和捐赠 ID
- 退款原因（可选）
- 退款到账时间说明
- 感谢和期待未来支持

**发送函数**:
```typescript
import { sendRefundSuccessEmail } from '@/lib/email'

await sendRefundSuccessEmail({
  to: string
  donorName: string
  projectNameI18n: I18nText
  donationIds: string[]
  refundAmount: number
  currency: string
  locale: 'en' | 'zh' | 'ua'
  refundReason?: string  // 可选：退款原因
})
```

**使用示例**（Webhook 处理退款）:

```typescript
// 在 app/api/webhooks/wayforpay/route.ts 中
import { sendRefundSuccessEmail } from '@/lib/email'

// 当收到退款成功 webhook
if (transactionStatus === WAYFORPAY_STATUS.REFUNDED) {
  const { data: project } = await supabase
    .from('projects')
    .select('project_name_i18n')
    .eq('id', donation.project_id)
    .single()

  await sendRefundSuccessEmail({
    to: donation.donor_email,
    donorName: donation.donor_name,
    projectNameI18n: project.project_name_i18n,
    donationIds: [donation.donation_public_id],
    refundAmount: donation.amount,
    currency: 'UAH',
    locale: donation.locale,
    refundReason: 'Customer request'
  })
}
```

---

## 使用方法

### 在 Server Actions 中使用

```typescript
// app/actions/donation.ts
import { sendPaymentSuccessEmail } from '@/lib/email'

export async function processDonation(params) {
  // ... 业务逻辑

  await sendPaymentSuccessEmail({
    to: donor.email,
    donorName: donor.name,
    // ... 其他参数
  })
}
```

### 在 API Routes 中使用

```typescript
// app/api/webhooks/wayforpay/route.ts
import { sendPaymentSuccessEmail } from '@/lib/email'

export async function POST(req: Request) {
  // ... 处理 webhook

  await sendPaymentSuccessEmail({
    // ... 参数
  })

  return NextResponse.json({ success: true })
}
```

### 错误处理

```typescript
try {
  await sendPaymentSuccessEmail(params)
  console.log('Email sent successfully')
} catch (error) {
  console.error('Failed to send email:', error)
  // 不要让邮件发送失败影响主要业务流程
}
```

---

## 添加新邮件类型

如需添加新的邮件类型（如"捐赠提醒"），按以下步骤操作：

### 1. 定义类型

在 `types.ts` 中添加参数接口：

```typescript
export interface DonationReminderEmailParams extends BaseEmailParams {
  donorName: string
  projectNameI18n: I18nText
  donationIds: string[]
  // ... 其他参数
}
```

### 2. 创建内容文件

创建 `templates/donation-reminder/content.ts`:

```typescript
import { Locale } from '../../types'

export const donationReminderContent: Record<Locale, {
  subject: string
  title: string
  // ... 其他字段
}> = {
  en: { /* 英文内容 */ },
  zh: { /* 中文内容 */ },
  ua: { /* 乌克兰语内容 */ }
}
```

### 3. 创建模板生成器

创建 `templates/donation-reminder/index.ts`:

```typescript
import { DonationReminderEmailParams, EmailContent } from '../../types'
import { createEmailLayout } from '../base/layout'
import { donationReminderContent } from './content'

export function generateDonationReminderEmail(
  params: DonationReminderEmailParams
): EmailContent {
  // 构建邮件内容
  const html = createEmailLayout({ /* ... */ })
  const text = /* 纯文本版本 */

  return { subject, html, text }
}
```

### 4. 创建发送函数

创建 `senders/donation-reminder.ts`:

```typescript
import { resend, FROM_EMAIL } from '../client'
import { DonationReminderEmailParams } from '../types'
import { generateDonationReminderEmail } from '../templates/donation-reminder'

export async function sendDonationReminderEmail(
  params: DonationReminderEmailParams
) {
  const emailContent = generateDonationReminderEmail(params)

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text
  })

  if (error) throw error
  return data
}
```

### 5. 导出函数

在 `index.ts` 中导出：

```typescript
export { sendDonationReminderEmail } from './senders/donation-reminder'
export { generateDonationReminderEmail } from './templates/donation-reminder'
```

---

## 配置

### 品牌配置

在 `config.ts` 中修改 NGO 品牌信息：

```typescript
export const NGO_BRANDING: NGOBranding = {
  name: {
    en: 'Way to Future UA',
    zh: '乌克兰未来之路',
    ua: 'Way to Future UA'
  },
  logoUrl: 'https://waytofutureua.org.ua/logo.png',
  websiteUrl: 'https://waytofutureua.org.ua',
  contactEmail: 'contact@waytofutureua.org.ua',
  socialLinks: {
    // 社交媒体链接
  }
}
```

### 颜色配置

```typescript
export const EMAIL_COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  // ... 其他颜色
}
```

### 环境变量

确保设置以下环境变量：

```bash
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=noreply@send.waytofutureua.org.ua
NEXT_PUBLIC_APP_URL=https://waytofutureua.org.ua
```

---

## 测试

### 测试所有语言

```bash
npx tsx scripts/test-email.ts
```

这将发送 3 封测试邮件（英文、中文、乌克兰语）。

### 测试中文邮件

```bash
npm run test:email:zh
```

### 测试邮件内容

测试脚本会：
1. 生成随机捐赠 ID
2. 使用测试数据发送邮件
3. 输出 Resend Email ID
4. 提供查看邮件的链接

### 手动测试

你也可以直接调用发送函数进行测试：

```typescript
import { sendPaymentSuccessEmail } from '@/lib/email'

await sendPaymentSuccessEmail({
  to: 'test@example.com',
  donorName: 'Test User',
  projectNameI18n: {
    en: 'Test Project',
    zh: '测试项目',
    ua: 'Тестовий проект'
  },
  // ... 其他测试数据
})
```

---

## 常见问题

### Q: 如何更改邮件样式？

修改 `templates/base/styles.ts` 中的 CSS 样式。

### Q: 如何添加新的可复用组件？

在 `templates/base/components.ts` 中添加新函数。

### Q: 邮件发送失败怎么办？

检查：
1. `RESEND_API_KEY` 是否正确
2. 发件人邮箱是否已在 Resend 验证
3. Resend Dashboard 中的错误日志

### Q: 如何预览邮件？

使用 Resend Dashboard 或将邮件发送到你的测试邮箱。

---

## 最佳实践

1. **总是使用 i18n 字段**
   - ❌ `projectName: 'Clean Water'`
   - ✅ `projectNameI18n: { en: 'Clean Water', zh: '清洁水', ua: 'Чиста вода' }`

2. **错误处理不影响主流程**
   ```typescript
   try {
     await sendEmail(params)
   } catch (error) {
     console.error('Email failed:', error)
     // 不要 throw，让主流程继续
   }
   ```

3. **使用类型安全**
   ```typescript
   // 利用 TypeScript 类型检查
   const params: PaymentSuccessEmailParams = { /* ... */ }
   await sendPaymentSuccessEmail(params)
   ```

4. **测试所有语言**
   - 在发布前测试所有 3 种语言的邮件
   - 检查邮件在不同邮件客户端的显示效果

---

## 维护者

如有问题或建议，请联系开发团队。

**文档版本**: 1.0.0
**最后更新**: 2025-12-25
