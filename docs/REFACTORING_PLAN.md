# NGO 平台 - 代码重构计划

> 本文档记录代码库分析结果和重构建议，旨在使代码结构更清晰、目录层级更明确、更容易扩展。

**创建日期**: 2026-01-10
**状态**: 执行中
**更新日期**: 2026-01-13

---

## 目录

1. [概述](#概述)
2. [高优先级重构](#高优先级重构)
3. [中优先级重构](#中优先级重构)
4. [低优先级重构](#低优先级重构)
5. [目标目录结构](#目标目录结构)
6. [执行计划](#执行计划)
7. [风险评估](#风险评估)

---

## 概述

### 当前问题总览

| 类别 | 问题数量 | 影响范围 |
|------|----------|----------|
| 代码重复 | 8 处 | Server Actions, Webhooks, Modals |
| 组件过大 | 4 个 | 1,180 / 772 / 692 / 632 行 |
| 组织混乱 | 5 处 | 验证、类型、工具函数分散 |
| 缺失结构 | 5 个目录 | 缺少 index.ts 导出文件 |
| 命名不一致 | 多处 | 文件名、函数名、组件名 |

### 重构目标

1. **减少代码重复** - 提取共享逻辑，建立统一的工具函数
2. **改善模块化** - 大文件拆分，职责单一化
3. **统一代码风格** - 命名规范、目录结构标准化
4. **提升可维护性** - 清晰的模块边界，易于定位和修改
5. **便于扩展** - 新功能可以按照既定模式快速添加

---

## 高优先级重构

### 1. Server Actions - Supabase 客户端初始化统一

**问题描述**

每个 action 文件都独立导入和调用 Supabase 客户端创建函数，导致：
- 重复的初始化代码
- 不一致的错误处理
- 难以统一修改客户端配置

**影响文件**

| 文件 | 重复模式 |
|------|----------|
| `app/actions/admin.ts` | `createAuthClient()` + `requireAdmin()` |
| `app/actions/donation.ts` | `createServerClient()` / `createServiceClient()` |
| `app/actions/track-donation.ts` | `createAnonClient()` / `createServiceClient()` |
| `app/actions/subscription.ts` | `createAnonClient()` / `createServiceClient()` |
| `app/actions/email-broadcast.ts` | `createAuthClient()` + 自定义 admin 检查 |
| `app/actions/donation-result.ts` | `createServiceClient()` |

**当前代码示例**

```typescript
// app/actions/admin.ts - 重复出现 15+ 次
await requireAdmin()
const supabase = await createAuthClient()
```

**建议方案**

创建统一的 Action 客户端工厂：

```typescript
// lib/supabase/action-clients.ts (新文件)

import { createAuthClient, createAnonClient, createServiceClient } from './server'
import { requireAdmin } from './admin-auth'

/**
 * 获取需要管理员权限的客户端
 * 自动执行权限检查
 */
export async function getAdminClient() {
  await requireAdmin()
  return createAuthClient()
}

/**
 * 获取匿名客户端（用于公开操作）
 */
export async function getPublicClient() {
  return createAnonClient()
}

/**
 * 获取服务端客户端（用于 webhook 等内部操作）
 */
export async function getInternalClient() {
  return createServiceClient()
}

/**
 * 获取带用户上下文的客户端
 */
export async function getUserClient() {
  return createAuthClient()
}
```

**重构后使用示例**

```typescript
// app/actions/admin.ts
import { getAdminClient } from '@/lib/supabase/action-clients'

export async function getAdminProjects() {
  const supabase = await getAdminClient() // 已包含权限检查
  // ...
}
```

**预期收益**

- 减少 50+ 行重复代码
- 统一错误处理逻辑
- 便于添加日志、性能监控等横切关注点

---

### 2. Webhook 处理逻辑整合

**问题描述**

WayForPay 和 NOWPayments 的 webhook 处理器有大量重复逻辑：
- 签名验证流程
- 根据 order_reference 查询捐赠
- 状态映射和更新
- 邮件发送

**影响文件**

| 文件 | 行数 | 重复比例 |
|------|------|----------|
| `app/api/webhooks/wayforpay/route.ts` | ~150 | 60%+ |
| `app/api/webhooks/nowpayments/route.ts` | ~180 | 60%+ |

**重复代码块**

```typescript
// 两个文件都有类似逻辑：

// 1. 查询捐赠
const { data: donations } = await supabase
  .from('donations')
  .select('*')
  .eq('order_reference', orderReference)

// 2. 处理未找到情况
if (!donations || donations.length === 0) {
  console.log('[WEBHOOK] No donations found')
  return NextResponse.json({ status: 'ok' })
}

// 3. 状态映射（switch 语句）
// 4. 更新数据库
// 5. 发送邮件
```

**建议方案**

创建共享的 webhook 处理工具：

```typescript
// lib/webhooks/common.ts (新文件)

import { createServiceClient } from '@/lib/supabase/server'
import { sendPaymentSuccessEmail, sendRefundSuccessEmail } from '@/lib/email'

export interface WebhookProcessResult {
  success: boolean
  donationsUpdated: number
  error?: string
}

/**
 * 根据订单号查询捐赠记录
 */
export async function getDonationsByOrderReference(
  orderReference: string
): Promise<Donation[]> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('order_reference', orderReference)

  if (error) throw new Error(`Query failed: ${error.message}`)
  return data || []
}

/**
 * 批量更新捐赠状态
 */
export async function updateDonationsStatus(
  donations: Donation[],
  newStatus: DonationStatus,
  paymentDetails?: Partial<Donation>
): Promise<void> {
  const supabase = await createServiceClient()

  for (const donation of donations) {
    await supabase
      .from('donations')
      .update({ status: newStatus, ...paymentDetails })
      .eq('id', donation.id)
  }
}

/**
 * 发送支付相关邮件
 */
export async function sendPaymentNotification(
  donations: Donation[],
  type: 'success' | 'refund'
): Promise<void> {
  const firstDonation = donations[0]
  if (!firstDonation.donor_email) return

  if (type === 'success') {
    await sendPaymentSuccessEmail(firstDonation)
  } else {
    await sendRefundSuccessEmail(firstDonation)
  }
}

/**
 * 标准化的 webhook 响应
 */
export function createWebhookResponse(
  status: 'ok' | 'error',
  message?: string
) {
  return NextResponse.json({ status, message })
}
```

**重构后的 Webhook 结构**

```typescript
// app/api/webhooks/wayforpay/route.ts (简化后)

import {
  getDonationsByOrderReference,
  updateDonationsStatus,
  sendPaymentNotification,
  createWebhookResponse
} from '@/lib/webhooks/common'
import { verifyWayForPaySignature, mapWayForPayStatus } from '@/lib/payment/wayforpay'

export async function POST(request: Request) {
  const body = await request.json()

  // 1. 验证签名 (支付方特定)
  if (!verifyWayForPaySignature(body)) {
    return createWebhookResponse('error', 'Invalid signature')
  }

  // 2. 查询捐赠 (共享逻辑)
  const donations = await getDonationsByOrderReference(body.orderReference)
  if (donations.length === 0) {
    return createWebhookResponse('ok', 'No donations found')
  }

  // 3. 映射状态 (支付方特定)
  const newStatus = mapWayForPayStatus(body.transactionStatus)

  // 4. 更新数据库 (共享逻辑)
  await updateDonationsStatus(donations, newStatus, {
    payment_system: body.paymentSystem,
    card_pan: body.cardPan
  })

  // 5. 发送邮件 (共享逻辑)
  if (newStatus === 'paid') {
    await sendPaymentNotification(donations, 'success')
  }

  return createWebhookResponse('ok')
}
```

**预期收益**

- 减少 ~150 行重复代码
- 统一 webhook 处理流程
- 便于添加新的支付方式
- 集中的错误处理和日志

---

### 3. 超大组件拆分

#### 3.1 DonationFormCard.tsx (1,180 行)

**当前结构分析**

```
DonationFormCard.tsx
├── 类型定义 (20 行)
├── PaymentWidgetContainer 组件 (100+ 行)
├── 表单状态管理 (150+ 行)
├── 项目选择逻辑 (100+ 行)
├── 表单字段渲染 (300+ 行)
├── 支付方式选择 (100+ 行)
├── 提交逻辑 (100+ 行)
└── 主组件渲染 (300+ 行)
```

**建议拆分方案**

```
components/donate/
├── DonationFormCard.tsx          # 主组件 (~300 行，组合其他组件)
├── PaymentWidgetContainer.tsx    # 支付小部件容器 (~120 行)
├── DonationFormFields.tsx        # 表单字段 (~200 行)
├── ProjectSelector.tsx           # 项目选择器 (~150 行)
├── PaymentMethodSelector.tsx     # 支付方式选择 (~100 行)
├── hooks/
│   └── useDonationForm.ts        # 表单状态管理 hook (~150 行)
└── index.ts                      # 导出文件
```

**拆分后的主组件**

```typescript
// components/donate/DonationFormCard.tsx (简化后)

import { useDonationForm } from './hooks/useDonationForm'
import { ProjectSelector } from './ProjectSelector'
import { DonationFormFields } from './DonationFormFields'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { PaymentWidgetContainer } from './PaymentWidgetContainer'

export function DonationFormCard({ projects, locale }: Props) {
  const {
    formData,
    selectedProject,
    paymentMethod,
    isSubmitting,
    handleSubmit,
    // ... other state
  } = useDonationForm(projects)

  return (
    <Card>
      <ProjectSelector
        projects={projects}
        selected={selectedProject}
        onChange={handleProjectChange}
      />

      <DonationFormFields
        formData={formData}
        onChange={handleFieldChange}
        errors={errors}
      />

      <PaymentMethodSelector
        method={paymentMethod}
        onChange={setPaymentMethod}
      />

      {showPaymentWidget && (
        <PaymentWidgetContainer
          donationData={formData}
          paymentMethod={paymentMethod}
        />
      )}
    </Card>
  )
}
```

#### 3.2 Project0/Project3 详情页 (772/632 行)

**问题描述**

两个项目详情页有大量相似结构：
- 图片画廊
- 进度展示
- 统计数据
- 故事卡片
- 挑战说明

**建议方案**

1. 创建可复用的详情页模板组件
2. 将项目特定数据移至 JSON 配置

```typescript
// components/projects/detail-pages/ProjectDetailTemplate.tsx (新文件)

interface ProjectDetailTemplateProps {
  projectId: string
  locale: string
  sections: {
    gallery?: GalleryConfig
    statistics?: StatisticsConfig
    stories?: StoryConfig[]
    challenges?: ChallengeConfig[]
    progress?: boolean
  }
}

export function ProjectDetailTemplate({ projectId, locale, sections }: Props) {
  return (
    <div className="project-detail">
      {sections.gallery && <ProjectGallery config={sections.gallery} />}
      {sections.statistics && <StatisticsGrid config={sections.statistics} />}
      {sections.stories && <StoriesSection stories={sections.stories} />}
      {sections.challenges && <ChallengesSection challenges={sections.challenges} />}
      {sections.progress && <ProjectProgressSection projectId={projectId} />}
    </div>
  )
}
```

```json
// public/content/projects/project-0-detail.json
{
  "sections": {
    "gallery": {
      "images": ["url1", "url2"],
      "layout": "masonry"
    },
    "statistics": {
      "items": [
        { "label": "families_helped", "value": 150 },
        { "label": "regions_covered", "value": 12 }
      ]
    },
    "stories": [...]
  }
}
```

#### 3.3 Admin Modal 组件 (487-692 行)

**建议方案**

创建基础 Modal 组件，减少样板代码：

```typescript
// components/admin/BaseEditModal.tsx (新文件)

interface FieldDefinition<T> {
  name: keyof T
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'file' | 'textarea'
  options?: { value: string; label: string }[]
  required?: boolean
  validation?: (value: any) => string | null
}

interface BaseEditModalProps<T> {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: FieldDefinition<T>[]
  initialData: T
  onSubmit: (data: T) => Promise<void>
  isLoading?: boolean
}

export function BaseEditModal<T>({
  isOpen,
  onClose,
  title,
  fields,
  initialData,
  onSubmit,
  isLoading
}: BaseEditModalProps<T>) {
  const [formData, setFormData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 通用表单处理逻辑...

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>
        {fields.map(field => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
            error={errors[field.name]}
          />
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} loading={isLoading}>Save</Button>
      </Modal.Footer>
    </Modal>
  )
}
```

**使用示例**

```typescript
// components/admin/ProjectEditModal.tsx (简化后)

import { BaseEditModal, FieldDefinition } from './BaseEditModal'

const projectFields: FieldDefinition<Project>[] = [
  { name: 'project_name', label: 'Project Name', type: 'text', required: true },
  { name: 'status', label: 'Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
  { name: 'target_amount', label: 'Target Amount', type: 'number' },
  // ...
]

export function ProjectEditModal({ project, onSave, ...props }: Props) {
  return (
    <BaseEditModal
      title="Edit Project"
      fields={projectFields}
      initialData={project}
      onSubmit={onSave}
      {...props}
    />
  )
}
```

---

### 4. 验证 Schema 统一

**问题描述**

Zod 验证 schema 分散在多个文件中：

| 当前位置 | Schema |
|----------|--------|
| `lib/validations.ts` | `donationFormSchema`, `createProjectSchema` |
| `app/api/unsubscribe/route.ts` | `unsubscribeSchema` |
| `app/actions/subscription.ts` | `createSubscriptionSchema` |
| `app/actions/email-broadcast.ts` | `sendBroadcastSchema` |
| `app/actions/track-donation.ts` | `trackDonationSchema` |

**建议方案**

统一到 `lib/validations.ts`，按领域组织：

```typescript
// lib/validations.ts

import { z } from 'zod'

// ============================================
// 基础验证规则
// ============================================

export const emailSchema = z.string().email()
export const localeSchema = z.enum(['en', 'zh', 'ua'])
export const uuidSchema = z.string().uuid()

// ============================================
// 项目相关
// ============================================

export const createProjectSchema = z.object({
  project_name: z.string().min(1),
  // ...
})

export const updateProjectSchema = createProjectSchema.partial()

// ============================================
// 捐赠相关
// ============================================

export const donationFormSchema = z.object({
  project_id: uuidSchema,
  donor_name: z.string().min(1).max(100),
  donor_email: emailSchema,
  // ...
})

export const trackDonationSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
})

// ============================================
// 订阅相关
// ============================================

export const createSubscriptionSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
  source: z.string().optional(),
})

export const unsubscribeSchema = z.object({
  token: z.string().min(1),
})

// ============================================
// 邮件相关
// ============================================

export const sendBroadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  content: z.string().min(1),
  recipientFilter: z.enum(['all', 'active', 'inactive']),
})

// ============================================
// 类型导出
// ============================================

export type DonationFormData = z.infer<typeof donationFormSchema>
export type TrackDonationData = z.infer<typeof trackDonationSchema>
export type CreateSubscriptionData = z.infer<typeof createSubscriptionSchema>
export type SendBroadcastData = z.infer<typeof sendBroadcastSchema>
```

---

## 中优先级重构

### 5. 组件目录 Index 文件

**缺失 index.ts 的目录**

| 目录 | 组件数量 | 影响 |
|------|----------|------|
| `components/donate/` | 3 | 深层导入 |
| `components/donate/widgets/` | 2 | 深层导入 |
| `components/admin/` | 12 | 深层导入 |
| `components/donation/` | 5 | 深层导入 |
| `components/home/` | 6 | 深层导入 |

**建议方案**

为每个目录添加 barrel export 文件：

```typescript
// components/donate/index.ts
export { DonationFormCard } from './DonationFormCard'
export { DonationFormFields } from './DonationFormFields'
export { ProjectSelector } from './ProjectSelector'

// components/donate/widgets/index.ts
export { WayForPayWidget } from './WayForPayWidget'
export { NowPaymentsWidget } from './NowPaymentsWidget'

// components/admin/index.ts
export { AdminNav } from './AdminNav'
export { ProjectsTable } from './ProjectsTable'
export { ProjectCreateModal } from './ProjectCreateModal'
export { ProjectEditModal } from './ProjectEditModal'
export { DonationsTable } from './DonationsTable'
export { DonationEditModal } from './DonationEditModal'
export { BatchDonationEditModal } from './BatchDonationEditModal'
export { SubscriptionsTable } from './SubscriptionsTable'
export { BroadcastModal } from './BroadcastModal'
// ...

// components/donation/index.ts
export { DonationStatusFlow } from './DonationStatusFlow'
export { DonationStatusBadge } from './DonationStatusBadge'
export { ProjectDonationList } from './ProjectDonationList'
export { DonationResultViewer } from './DonationResultViewer'
```

**使用改进**

```typescript
// Before
import DonationFormCard from '@/components/donate/DonationFormCard'
import WayForPayWidget from '@/components/donate/widgets/WayForPayWidget'

// After
import { DonationFormCard } from '@/components/donate'
import { WayForPayWidget } from '@/components/donate/widgets'
```

---

### 6. 支付模块重组

**当前结构**

```
lib/payment/
├── wayforpay/
│   └── server.ts (357 行 - 混合多种职责)
└── nowpayments/
    ├── server.ts (255 行 - 混合多种职责)
    └── types.ts
```

**建议结构**

```
lib/payment/
├── shared/
│   ├── types.ts              # 通用支付类型
│   ├── signature.ts          # 签名验证抽象
│   └── errors.ts             # 支付错误类型
├── wayforpay/
│   ├── index.ts              # 导出文件
│   ├── client.ts             # 支付创建 (~80 行)
│   ├── refund.ts             # 退款处理 (~60 行)
│   ├── signature.ts          # 签名验证 (~50 行)
│   ├── status-mapping.ts     # 状态映射 (~40 行)
│   └── types.ts              # WayForPay 特定类型
└── nowpayments/
    ├── index.ts
    ├── client.ts             # 支付创建
    ├── currencies.ts         # 货币列表
    ├── signature.ts          # IPN 验证
    ├── status-mapping.ts     # 状态映射
    └── types.ts
```

---

### 7. 邮件系统重构

**当前问题**

- Sender 文件高度相似（35 行/文件，结构相同）
- 模板和发送逻辑混合

**建议方案**

```typescript
// lib/email/send.ts (新文件 - 通用发送器)

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    ...options,
  })
}

// lib/email/templates/index.ts (模板工厂)

export function createPaymentSuccessEmail(donation: Donation, locale: Locale) {
  return {
    subject: getSubject('payment_success', locale),
    html: renderPaymentSuccessTemplate(donation, locale),
  }
}

export function createRefundSuccessEmail(donation: Donation, locale: Locale) {
  return {
    subject: getSubject('refund_success', locale),
    html: renderRefundSuccessTemplate(donation, locale),
  }
}

// 使用示例
import { sendEmail } from '@/lib/email/send'
import { createPaymentSuccessEmail } from '@/lib/email/templates'

const emailContent = createPaymentSuccessEmail(donation, locale)
await sendEmail({
  to: donation.donor_email,
  ...emailContent,
})
```

---

### 8. Table 过滤逻辑抽取

**问题描述**

Admin 表格组件都有相似的过滤逻辑。

**建议方案**

```typescript
// lib/filters/table-filters.ts (新文件)

export interface FilterConfig<T> {
  field: keyof T
  type: 'select' | 'search' | 'date-range'
  options?: { value: string; label: string }[]
}

export function createFilter<T>(
  items: T[],
  filters: Record<string, any>,
  config: FilterConfig<T>[]
): T[] {
  return items.filter(item => {
    return config.every(({ field, type }) => {
      const filterValue = filters[field as string]
      if (!filterValue || filterValue === 'all') return true

      const itemValue = item[field]

      switch (type) {
        case 'select':
          return itemValue === filterValue
        case 'search':
          return String(itemValue).toLowerCase().includes(filterValue.toLowerCase())
        case 'date-range':
          // Date range logic
          return true
        default:
          return true
      }
    })
  })
}

// 使用示例
const filteredDonations = createFilter(donations, filters, [
  { field: 'status', type: 'select' },
  { field: 'project_id', type: 'select' },
  { field: 'donor_email', type: 'search' },
])
```

---

## 低优先级重构

### 9. 命名规范统一

**文件命名规范**

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `DonationFormCard.tsx` |
| Hook 文件 | camelCase，use 前缀 | `useDonationForm.ts` |
| 工具文件 | kebab-case | `table-filters.ts` |
| Action 文件 | kebab-case 或领域名 | `donations.ts` |
| 类型文件 | kebab-case | `donation-types.ts` |

**需要重命名的文件**

| 当前 | 建议 |
|------|------|
| `track-donation.ts` | `donation-tracking.ts` |
| `donation-result.ts` | `donation-results.ts` |
| `track-donation-form.tsx` | `TrackDonationForm.tsx` |

**函数命名规范**

| 类型 | 规范 | 示例 |
|------|------|------|
| 创建操作 | `create*` | `createDonation()` |
| 获取操作 | `get*` | `getDonations()` |
| 更新操作 | `update*` | `updateStatus()` |
| 删除操作 | `delete*` | `deleteDonation()` |
| 发送操作 | `send*` | `sendEmail()` |
| 验证操作 | `verify*` / `validate*` | `verifySignature()` |

---

### 10. 类型定义重组

**建议结构**

```
types/
├── index.ts          # 主导出文件
├── database.ts       # Supabase 生成的类型 (保持不变)
├── donation.ts       # 捐赠相关类型
├── project.ts        # 项目相关类型
├── email.ts          # 邮件相关类型 (从 lib/email/types.ts 移入)
├── payment.ts        # 支付相关类型 (从 lib/payment/*/types.ts 整合)
└── api.ts            # API 请求/响应类型
```

---

### 11. 图标系统重构

**当前问题**

`components/icons/index.tsx` 有 250+ 行内联 SVG。

**建议方案**

```typescript
// lib/icons/paths.ts
export const iconPaths = {
  'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'x-circle': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  // ...
}

// components/icons/Icon.tsx
import { iconPaths } from '@/lib/icons/paths'

interface IconProps {
  name: keyof typeof iconPaths
  className?: string
  size?: number
}

export function Icon({ name, className, size = 24 }: IconProps) {
  const path = iconPaths[name]

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d={path} />
    </svg>
  )
}

// 使用
<Icon name="check-circle" className="text-green-500" />
```

---

### 12. 日志系统统一

**建议方案**

```typescript
// lib/logger.ts (新文件)

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (message: string, data?: any) => void
  info: (message: string, data?: any) => void
  warn: (message: string, data?: any) => void
  error: (message: string, data?: any) => void
}

export function createLogger(context: string): Logger {
  const log = (level: LogLevel, message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${context}] [${level.toUpperCase()}]`

    if (data) {
      console[level](`${prefix} ${message}`, data)
    } else {
      console[level](`${prefix} ${message}`)
    }
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
  }
}

// 使用示例
const logger = createLogger('WayForPayWebhook')
logger.info('Processing payment', { orderReference })
logger.error('Signature verification failed', { error })
```

---

## 目标目录结构

```
NGO_web/
├── app/
│   ├── [locale]/                   # 国际化路由 (保持不变)
│   ├── admin/                      # 管理后台 (保持不变)
│   ├── actions/
│   │   ├── donations/              # 捐赠相关 actions (新)
│   │   │   ├── wayforpay.ts
│   │   │   ├── nowpayments.ts
│   │   │   └── common.ts
│   │   ├── admin/                  # 管理相关 actions (新)
│   │   │   ├── projects.ts
│   │   │   ├── donations.ts
│   │   │   └── files.ts
│   │   ├── subscription.ts
│   │   └── email-broadcast.ts
│   └── api/
│       └── webhooks/               # (保持不变，但使用共享逻辑)
│
├── components/
│   ├── admin/
│   │   ├── index.ts                # 新增
│   │   ├── base/                   # 新增：基础组件
│   │   │   └── BaseEditModal.tsx
│   │   └── ...
│   ├── donate/
│   │   ├── index.ts                # 新增
│   │   ├── hooks/                  # 新增
│   │   │   └── useDonationForm.ts
│   │   ├── widgets/
│   │   │   └── index.ts            # 新增
│   │   └── ...
│   ├── donation/
│   │   └── index.ts                # 新增
│   ├── home/
│   │   └── index.ts                # 新增
│   ├── projects/
│   │   └── detail-pages/
│   │       ├── shared/             # 扩展共享组件
│   │       │   ├── Gallery.tsx
│   │       │   ├── StatisticsGrid.tsx
│   │       │   └── StoriesSection.tsx
│   │       └── ProjectDetailTemplate.tsx  # 新增
│   └── icons/
│       └── Icon.tsx                # 重构
│
├── lib/
│   ├── supabase/
│   │   ├── action-clients.ts       # 新增
│   │   └── ...
│   ├── webhooks/                   # 新增
│   │   └── common.ts
│   ├── payment/
│   │   ├── shared/                 # 新增
│   │   │   ├── types.ts
│   │   │   └── errors.ts
│   │   ├── wayforpay/
│   │   │   ├── index.ts
│   │   │   ├── client.ts           # 从 server.ts 拆分
│   │   │   ├── refund.ts
│   │   │   └── signature.ts
│   │   └── nowpayments/
│   │       └── ...
│   ├── email/
│   │   ├── send.ts                 # 新增：通用发送器
│   │   └── templates/
│   │       └── index.ts            # 模板工厂
│   ├── filters/                    # 新增
│   │   └── table-filters.ts
│   ├── icons/                      # 新增
│   │   └── paths.ts
│   ├── errors/                     # 新增
│   │   └── index.ts
│   ├── logger.ts                   # 新增
│   └── validations.ts              # 整合所有 schema
│
├── types/
│   ├── index.ts
│   ├── database.ts
│   ├── donation.ts                 # 新增
│   ├── project.ts                  # 新增
│   ├── email.ts                    # 从 lib 移入
│   └── payment.ts                  # 整合支付类型
│
└── ...
```

---

## 执行计划

### 第一阶段：快速收益 (低风险，高可见度) ✅ 已完成

**目标**: 改善开发体验，不影响业务逻辑

| 任务 | 文件变更 | 风险 | 状态 |
|------|----------|------|------|
| 1.1 添加组件 index.ts | 5 个新文件 | 低 | ✅ 完成 |
| 1.2 整合验证 schema | 修改 6 个文件 | 低 | ✅ 完成 |
| 1.3 创建 action-clients.ts | 1 个新文件 + 修改 6 个文件 | 低 | ✅ 完成 |

### 第二阶段：核心改进 (中等风险，高价值)

**目标**: 减少代码重复，改善可维护性

| 任务 | 文件变更 | 风险 |
|------|----------|------|
| 2.1 创建 webhook 共享逻辑 | 1 个新文件 + 修改 2 个文件 | 中 |
| 2.2 拆分 DonationFormCard | 5 个新文件 + 修改 1 个文件 | 中 |
| 2.3 创建 BaseEditModal | 1 个新文件 + 修改 4 个文件 | 中 |

### 第三阶段：架构优化 (较高风险，长期收益)

**目标**: 建立更好的代码架构

| 任务 | 文件变更 | 风险 |
|------|----------|------|
| 3.1 重组支付模块 | 8 个新文件 + 删除 2 个文件 | 高 |
| 3.2 Actions 按领域拆分 | 6 个新文件 + 修改 3 个文件 | 高 |
| 3.3 类型定义重组 | 4 个新文件 + 修改多个文件 | 中 |
| 3.4 邮件系统重构 | 3 个新文件 + 修改 5 个文件 | 高 |

### 第四阶段：完善细节 (低风险，改善体验)

| 任务 | 文件变更 | 风险 | 状态 |
|------|----------|------|------|
| 4.1 添加日志系统 | 1 个新文件 + 修改多个文件 | 低 | ✅ 完成 |
| 4.2 图标系统重构 | 2 个新文件 + 修改 1 个文件 | 低 | |
| 4.3 命名规范统一 | 重命名多个文件 | 低 | |
| 4.4 项目详情页模板化 | 3 个新文件 + 修改 2 个文件 | 中 | |

---

## 风险评估

### 高风险操作

| 操作 | 风险点 | 缓解措施 |
|------|--------|----------|
| 支付模块重组 | 影响支付流程 | 充分测试，分步进行 |
| Webhook 逻辑修改 | 影响支付回调 | 保留旧代码作为回退 |
| 邮件系统重构 | 影响邮件发送 | 测试环境验证 |

### 测试要求

每个阶段完成后需要验证：

1. **第一阶段后**
   - [ ] 所有导入路径正常工作
   - [ ] 验证功能正常

2. **第二阶段后**
   - [ ] Webhook 正常接收和处理
   - [ ] 捐赠表单功能正常
   - [ ] 管理后台 Modal 正常

3. **第三阶段后**
   - [ ] 完整支付流程测试
   - [ ] 邮件发送测试
   - [ ] 管理员操作测试

4. **第四阶段后**
   - [ ] 整体功能回归测试
   - [ ] 性能测试

---

## 附录：代码度量

### 当前状态

| 指标 | 值 |
|------|-----|
| 最大组件行数 | 1,180 行 |
| 最大 Action 行数 | 782 行 |
| 重复代码比例 | ~15% |
| 缺失 index 文件 | 5 个目录 |

### 目标状态

| 指标 | 目标值 |
|------|--------|
| 最大组件行数 | < 400 行 |
| 最大 Action 行数 | < 300 行 |
| 重复代码比例 | < 5% |
| 缺失 index 文件 | 0 |

---

**文档版本**: 1.1
**最后更新**: 2026-01-13
