# 捐赠状态重构方案

> 将分散在各处的捐赠状态判断逻辑集中到统一的工具库中，提高代码可维护性

**文档版本**: 1.0.0
**创建日期**: 2026-01-09

---

## 目录

1. [问题分析](#1-问题分析)
2. [重构目标](#2-重构目标)
3. [设计方案](#3-设计方案)
4. [需要修改的文件清单](#4-需要修改的文件清单)
5. [实施步骤](#5-实施步骤)
6. [风险评估](#6-风险评估)

---

## 1. 问题分析

### 1.1 当前存在的问题

**状态判断逻辑分散在 15+ 个文件中**，主要表现为：

1. **重复定义状态分组**
   - `DonationDetails.tsx` 定义了 `STATUS_GROUPS`
   - `DonationStatusFlow.tsx` 定义了 `mainFlow` 和 `refundFlow`
   - `track-donation.ts` 有可退款状态列表
   - `wayforpay/route.ts` 有可转换状态列表

2. **重复定义状态转换规则**
   - `DonationEditModal.tsx` 定义了 `STATUS_TRANSITIONS`
   - `BatchDonationEditModal.tsx` 重复定义了相同的 `STATUS_TRANSITIONS`
   - `DonationStatusProgress.tsx` 也定义了 `STATUS_TRANSITIONS`
   - `admin.ts` Server Action 中又定义了 `validTransitions`

3. **硬编码的状态判断散落各处**
   - `=== 'completed'` 出现 8+ 次
   - `=== 'refunding'` 出现 5+ 次
   - `=== 'failed'` 出现 4+ 次
   - `includes()` 数组判断出现 10+ 次

4. **维护风险**
   - 新增/删除状态时需要修改多处
   - 状态转换规则不一致的风险
   - 容易遗漏某处修改

### 1.2 现有状态判断位置统计

| 文件 | 判断类型 | 判断次数 | 风险等级 |
|------|---------|---------|---------|
| `components/donation/DonationStatusBadge.tsx` | switch/case 颜色映射 | 15 | 中 |
| `components/donation/DonationStatusFlow.tsx` | 流程状态数组 | 4 | 中 |
| `components/donation/ProjectDonationList.tsx` | completed 判断 | 2 | 低 |
| `app/[locale]/donate/success/DonationDetails.tsx` | 状态分组 | 5 | 高 |
| `components/admin/DonationEditModal.tsx` | 转换规则 | 4 | 高 |
| `components/admin/BatchDonationEditModal.tsx` | 转换规则（重复） | 3 | 高 |
| `components/admin/DonationStatusProgress.tsx` | 转换规则 + 特殊状态 | 8 | 高 |
| `components/admin/DonationsTable.tsx` | 批量编辑判断 | 3 | 中 |
| `app/actions/admin.ts` | 转换规则 + 排序 | 4 | 高 |
| `app/actions/track-donation.ts` | 退款资格判断 | 10 | 高 |
| `app/actions/donation.ts` | 初始状态 + 失败标记 | 3 | 低 |
| `app/actions/donation-result.ts` | completed 检查 | 2 | 低 |
| `app/api/webhooks/wayforpay/route.ts` | 状态映射 + 转换 | 12 | 高 |
| `app/api/webhooks/nowpayments/route.ts` | 状态映射 + 转换 | 10 | 高 |

**总计**: 约 85 处状态相关判断

---

## 2. 重构目标

### 2.1 核心目标

1. **单一数据源** - 所有状态定义、分组、转换规则集中在一个文件
2. **类型安全** - 利用 TypeScript 确保状态值的正确性
3. **易于维护** - 新增/修改状态只需改动一处
4. **向后兼容** - 重构不改变现有行为

### 2.2 预期收益

- 减少代码重复约 60%
- 降低维护成本
- 提高代码一致性
- 便于单元测试

---

## 3. 设计方案

### 3.1 新建工具库文件

**文件路径**: `lib/donation-status.ts`

```typescript
// ============================================
// 1. 状态定义
// ============================================

export const DONATION_STATUSES = [
  'pending', 'widget_load_failed',
  'processing', 'fraud_check',
  'paid', 'confirmed', 'delivering', 'completed',
  'expired', 'declined', 'failed',
  'refunding', 'refund_processing', 'refunded',
] as const

export type DonationStatus = typeof DONATION_STATUSES[number]

// ============================================
// 2. 状态分组
// ============================================

/** 支付前状态 */
export const PRE_PAYMENT_STATUSES: readonly DonationStatus[] = [
  'pending', 'widget_load_failed'
] as const

/** 处理中状态 */
export const PROCESSING_STATUSES: readonly DonationStatus[] = [
  'processing', 'fraud_check'
] as const

/** 支付成功状态（计入项目进度） */
export const SUCCESS_STATUSES: readonly DonationStatus[] = [
  'paid', 'confirmed', 'delivering', 'completed'
] as const

/** 支付失败状态 */
export const FAILED_STATUSES: readonly DonationStatus[] = [
  'expired', 'declined', 'failed'
] as const

/** 退款相关状态 */
export const REFUND_STATUSES: readonly DonationStatus[] = [
  'refunding', 'refund_processing', 'refunded'
] as const

/** 被计数状态（用于项目单位统计） */
export const COUNTED_STATUSES = SUCCESS_STATUSES

/** 未被计数状态 */
export const NON_COUNTED_STATUSES: readonly DonationStatus[] = [
  ...PRE_PAYMENT_STATUSES,
  ...PROCESSING_STATUSES,
  ...FAILED_STATUSES,
  ...REFUND_STATUSES,
] as const

// ============================================
// 3. 状态转换规则
// ============================================

/** 管理员可执行的状态转换 */
export const ADMIN_STATUS_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  pending: [],
  widget_load_failed: [],
  processing: [],
  fraud_check: [],
  paid: ['confirmed'],
  confirmed: ['delivering'],
  delivering: ['completed'],
  completed: [],
  expired: [],
  declined: [],
  failed: [],
  refunding: [],
  refund_processing: [],
  refunded: [],
}

/** 支付 Webhook 可更新的源状态 */
export const PAYMENT_WEBHOOK_SOURCE_STATUSES: readonly DonationStatus[] = [
  'pending', 'processing', 'fraud_check', 'widget_load_failed'
] as const

/** 退款 Webhook 可更新的源状态 */
export const REFUND_WEBHOOK_SOURCE_STATUSES: readonly DonationStatus[] = [
  'paid', 'confirmed', 'delivering', 'refunding', 'refund_processing'
] as const

/** 可申请退款的状态 */
export const REFUNDABLE_STATUSES: readonly DonationStatus[] = [
  'paid', 'confirmed', 'delivering'
] as const

/** 不可退款的状态（已完成） */
export const NON_REFUNDABLE_COMPLETED: DonationStatus = 'completed'

/** 退款进行中状态（不可重复申请） */
export const REFUND_IN_PROGRESS_STATUSES: readonly DonationStatus[] = [
  'refunding', 'refund_processing', 'refunded'
] as const

// ============================================
// 4. UI 显示相关
// ============================================

/** 状态颜色映射 */
export const STATUS_COLORS: Record<DonationStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  widget_load_failed: { bg: 'bg-gray-100', text: 'text-gray-700' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  fraud_check: { bg: 'bg-purple-100', text: 'text-purple-800' },
  paid: { bg: 'bg-green-100', text: 'text-green-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  delivering: { bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-600' },
  declined: { bg: 'bg-red-100', text: 'text-red-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  refunding: { bg: 'bg-orange-100', text: 'text-orange-800' },
  refund_processing: { bg: 'bg-orange-100', text: 'text-orange-800' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

/** 主流程状态（用于进度显示） */
export const MAIN_FLOW_STATUSES: readonly DonationStatus[] = [
  'paid', 'confirmed', 'delivering', 'completed'
] as const

/** 显示用的流程状态（包含 pending） */
export const DISPLAY_FLOW_STATUSES: readonly DonationStatus[] = [
  'pending', 'paid', 'confirmed', 'delivering', 'completed'
] as const

// ============================================
// 5. 状态判断辅助函数
// ============================================

/** 是否为预支付状态 */
export function isPrePaymentStatus(status: DonationStatus): boolean {
  return PRE_PAYMENT_STATUSES.includes(status)
}

/** 是否为处理中状态 */
export function isProcessingStatus(status: DonationStatus): boolean {
  return PROCESSING_STATUSES.includes(status)
}

/** 是否为成功状态（已支付） */
export function isSuccessStatus(status: DonationStatus): boolean {
  return SUCCESS_STATUSES.includes(status)
}

/** 是否为失败状态 */
export function isFailedStatus(status: DonationStatus): boolean {
  return FAILED_STATUSES.includes(status)
}

/** 是否为退款相关状态 */
export function isRefundStatus(status: DonationStatus): boolean {
  return REFUND_STATUSES.includes(status)
}

/** 是否为被计数状态（计入项目进度） */
export function isCountedStatus(status: DonationStatus): boolean {
  return COUNTED_STATUSES.includes(status)
}

/** 是否可以申请退款 */
export function canRequestRefund(status: DonationStatus): boolean {
  return REFUNDABLE_STATUSES.includes(status)
}

/** 是否为退款进行中（不可重复申请） */
export function isRefundInProgress(status: DonationStatus): boolean {
  return REFUND_IN_PROGRESS_STATUSES.includes(status)
}

/** 是否可以查看结果图片（仅 completed） */
export function canViewResult(status: DonationStatus): boolean {
  return status === 'completed'
}

/** 是否可以管理文件（仅 completed） */
export function canManageFiles(status: DonationStatus): boolean {
  return status === 'completed'
}

/** 是否支持批量编辑（delivering 不支持，需要上传文件） */
export function canBatchEdit(status: DonationStatus): boolean {
  return status !== 'delivering' &&
         ADMIN_STATUS_TRANSITIONS[status]?.length > 0
}

/** 获取管理员允许的下一个状态 */
export function getNextAllowedStatuses(status: DonationStatus): DonationStatus[] {
  return ADMIN_STATUS_TRANSITIONS[status] || []
}

/** 检查状态转换是否合法（管理员） */
export function isValidAdminTransition(from: DonationStatus, to: DonationStatus): boolean {
  return ADMIN_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/** 是否需要上传文件（delivering → completed） */
export function needsFileUpload(from: DonationStatus, to: DonationStatus): boolean {
  return from === 'delivering' && to === 'completed'
}

// ============================================
// 6. 成功页状态分组
// ============================================

export type StatusGroup = 'failed' | 'processing' | 'success'

/** 获取状态所属的分组（用于成功页显示） */
export function getStatusGroup(status: DonationStatus): StatusGroup {
  if (FAILED_STATUSES.includes(status) || status === 'widget_load_failed') {
    return 'failed'
  }
  if (PRE_PAYMENT_STATUSES.includes(status) || PROCESSING_STATUSES.includes(status)) {
    return 'processing'
  }
  return 'success'
}

// ============================================
// 7. Webhook 辅助函数
// ============================================

/** 是否为退款类型的 Webhook */
export function isRefundWebhook(wayforpayStatus: string): boolean {
  return ['Refunded', 'RefundInProcessing', 'Voided'].includes(wayforpayStatus)
}

/** 获取 Webhook 可更新的源状态 */
export function getWebhookSourceStatuses(isRefund: boolean): readonly DonationStatus[] {
  return isRefund ? REFUND_WEBHOOK_SOURCE_STATUSES : PAYMENT_WEBHOOK_SOURCE_STATUSES
}

/** 检查状态是否可被 Webhook 更新 */
export function canWebhookUpdate(status: DonationStatus, isRefund: boolean): boolean {
  const sourceStatuses = getWebhookSourceStatuses(isRefund)
  return sourceStatuses.includes(status)
}
```

### 3.2 类型定义迁移

**从 `types/index.ts` 迁移到 `lib/donation-status.ts`**

```typescript
// types/index.ts - 改为重新导出
export { DONATION_STATUSES, type DonationStatus } from '@/lib/donation-status'
```

---

## 4. 需要修改的文件清单

### 4.1 高优先级（状态转换规则）

| 文件 | 修改内容 | 复杂度 |
|------|---------|-------|
| `components/admin/DonationEditModal.tsx` | 删除 `STATUS_TRANSITIONS`，改用 `getNextAllowedStatuses()` | 中 |
| `components/admin/BatchDonationEditModal.tsx` | 删除 `STATUS_TRANSITIONS`，改用 `getNextAllowedStatuses()` | 中 |
| `components/admin/DonationStatusProgress.tsx` | 删除 `STATUS_TRANSITIONS`，改用库函数 | 中 |
| `app/actions/admin.ts` | 删除 `validTransitions`，改用 `isValidAdminTransition()` | 中 |
| `app/actions/track-donation.ts` | 删除硬编码状态数组，改用库函数 | 高 |

### 4.2 中优先级（状态分组和判断）

| 文件 | 修改内容 | 复杂度 |
|------|---------|-------|
| `app/[locale]/donate/success/DonationDetails.tsx` | 删除 `STATUS_GROUPS`，改用 `getStatusGroup()` | 中 |
| `components/donation/DonationStatusFlow.tsx` | 删除 `mainFlow`/`refundFlow`，改用常量 | 低 |
| `components/donation/DonationStatusBadge.tsx` | 删除 switch，改用 `STATUS_COLORS` | 低 |
| `components/donation/ProjectDonationList.tsx` | 改用 `canViewResult()` | 低 |
| `components/admin/DonationsTable.tsx` | 改用 `canBatchEdit()` | 低 |
| `app/actions/donation-result.ts` | 改用 `canViewResult()` | 低 |

### 4.3 低优先级（Webhook 和初始化）

| 文件 | 修改内容 | 复杂度 |
|------|---------|-------|
| `app/api/webhooks/wayforpay/route.ts` | 使用 `getWebhookSourceStatuses()` | 中 |
| `app/api/webhooks/nowpayments/route.ts` | 使用 `getWebhookSourceStatuses()` | 中 |
| `app/actions/donation.ts` | 状态值从库导入 | 低 |
| `types/index.ts` | 改为重新导出 | 低 |

### 4.4 数据库（不需要修改）

数据库中的状态判断逻辑（触发器、视图）保持不变，因为：
- 数据库是最终的数据验证层
- SQL 中的状态判断是独立的
- 修改需要迁移，风险高

---

## 5. 实施步骤

### 阶段一：创建工具库（低风险）

1. 创建 `lib/donation-status.ts`
2. 添加所有常量和辅助函数
3. 添加单元测试
4. 不修改任何现有文件

### 阶段二：类型迁移（低风险）

1. 修改 `types/index.ts` 重新导出
2. 验证类型兼容性
3. 运行类型检查

### 阶段三：逐文件迁移（中风险）

按以下顺序逐个修改并测试：

```
1. components/donation/DonationStatusBadge.tsx （最简单，验证方案可行性）
2. components/donation/ProjectDonationList.tsx （简单判断）
3. app/actions/donation-result.ts （简单判断）
4. components/donation/DonationStatusFlow.tsx （状态分组）
5. app/[locale]/donate/success/DonationDetails.tsx （状态分组）
6. components/admin/DonationsTable.tsx （批量编辑判断）
7. components/admin/DonationEditModal.tsx （转换规则）
8. components/admin/BatchDonationEditModal.tsx （转换规则）
9. components/admin/DonationStatusProgress.tsx （转换规则）
10. app/actions/admin.ts （Server Action）
11. app/actions/track-donation.ts （退款逻辑，最复杂）
12. app/api/webhooks/wayforpay/route.ts （Webhook）
13. app/api/webhooks/nowpayments/route.ts （Webhook）
```

### 阶段四：清理和文档

1. 删除未使用的旧代码
2. 更新 CLAUDE.md 文档
3. 更新 DONATION_STATUS.md 文档

---

## 6. 风险评估

### 6.1 低风险

- 创建新文件（不影响现有代码）
- 类型重新导出（向后兼容）
- UI 组件颜色映射（视觉效果易于验证）

### 6.2 中风险

- Server Actions 修改（需要完整测试）
- 状态转换规则（需要管理员功能测试）
- 退款逻辑（需要完整流程测试）

### 6.3 高风险

- Webhook 处理（影响支付流程）
- 数据库相关（不建议在此次修改）

### 6.4 回滚策略

- 每个文件单独提交
- 每次修改后运行完整测试
- 保留旧代码直到验证通过
- Git revert 可快速回滚单个文件

---

## 7. 修改示例

### 7.1 DonationStatusBadge.tsx 修改前后对比

**修改前**:
```typescript
function getStatusClasses(status: DonationStatus) {
  const baseClasses = '...'
  switch (status) {
    case 'pending':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'widget_load_failed':
      return `${baseClasses} bg-gray-100 text-gray-700`
    // ... 15 个 case
    default:
      return `${baseClasses} bg-gray-100 text-gray-700`
  }
}
```

**修改后**:
```typescript
import { STATUS_COLORS, type DonationStatus } from '@/lib/donation-status'

function getStatusClasses(status: DonationStatus) {
  const baseClasses = '...'
  const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  return `${baseClasses} ${colors.bg} ${colors.text}`
}
```

### 7.2 DonationEditModal.tsx 修改前后对比

**修改前**:
```typescript
const STATUS_TRANSITIONS: Record<string, string[]> = {
  paid: ['confirmed'],
  confirmed: ['delivering'],
  delivering: ['completed'],
}

const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || []
const canUpdate = allowedStatuses.length > 0
const needsFileUpload = currentStatus === 'delivering' && newStatus === 'completed'
```

**修改后**:
```typescript
import {
  getNextAllowedStatuses,
  needsFileUpload,
  type DonationStatus
} from '@/lib/donation-status'

const allowedStatuses = getNextAllowedStatuses(currentStatus as DonationStatus)
const canUpdate = allowedStatuses.length > 0
const requiresFile = needsFileUpload(currentStatus as DonationStatus, newStatus as DonationStatus)
```

### 7.3 track-donation.ts 修改前后对比

**修改前**:
```typescript
if (status === 'completed') {
  return { error: 'cannotRefundCompleted' }
}

if (status === 'refunding' || status === 'refund_processing' || status === 'refunded') {
  return { error: 'alreadyRefunding' }
}

if (!['paid', 'confirmed', 'delivering'].includes(status)) {
  return { error: 'invalidStatus' }
}
```

**修改后**:
```typescript
import {
  canRequestRefund,
  isRefundInProgress,
  NON_REFUNDABLE_COMPLETED,
  type DonationStatus
} from '@/lib/donation-status'

if (status === NON_REFUNDABLE_COMPLETED) {
  return { error: 'cannotRefundCompleted' }
}

if (isRefundInProgress(status as DonationStatus)) {
  return { error: 'alreadyRefunding' }
}

if (!canRequestRefund(status as DonationStatus)) {
  return { error: 'invalidStatus' }
}
```

---

## 8. 验收标准

1. **功能不变**: 所有现有功能正常工作
2. **类型安全**: 无 TypeScript 编译错误
3. **测试通过**: 单元测试和 E2E 测试通过
4. **代码减少**: 状态相关代码减少 50%+
5. **单一数据源**: 所有状态定义来自 `lib/donation-status.ts`

---

## 9. 后续优化

完成本次重构后，可考虑：

1. **状态机实现**: 使用 XState 等库实现完整状态机
2. **数据库同步**: 生成数据库迁移中的状态列表
3. **文档生成**: 自动生成状态流程图
4. **国际化整合**: 状态翻译键统一管理

---

**文档版本**: 1.0.0
**作者**: Claude
**创建日期**: 2026-01-09
