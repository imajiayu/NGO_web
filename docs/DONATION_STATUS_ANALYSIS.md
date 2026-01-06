# 捐赠状态完整分析文档

> 版本: 1.0.0
> 最后更新: 2026-01-06
> 分析范围: 所有与捐赠状态相关的代码、数据库约束、触发器、RLS策略

---

## 目录

1. [状态概览](#1-状态概览)
2. [状态分组](#2-状态分组)
3. [状态定义一致性检查](#3-状态定义一致性检查)
4. [状态转换规则](#4-状态转换规则)
5. [数据库层约束](#5-数据库层约束)
6. [UI层影响](#6-ui层影响)
7. [退款逻辑](#7-退款逻辑)
8. [项目进度计数](#8-项目进度计数)
9. [潜在Bug分析](#9-潜在bug分析)
10. [文件索引](#10-文件索引)

---

## 1. 状态概览

系统共定义 **15种** 捐赠状态，分为5大类：

| 类别 | 状态值 | 中文名称 | 说明 |
|------|--------|----------|------|
| **支付前** | `pending` | 支付待确认 | 订单已创建，等待支付 |
| | `widget_load_failed` | 未支付 | 支付窗口加载失败 |
| **处理中** | `processing` | 支付处理中 | WayForPay inProcessing |
| | `fraud_check` | 安全审核中 | WayForPay Pending（反欺诈检查） |
| **支付完成** | `paid` | 已支付 | 资金已到账/预授权 |
| | `confirmed` | 已确认 | NGO确认收款 |
| | `delivering` | 配送中 | 物资配送中 |
| | `completed` | 已完成 | 配送完成，有照片证明 |
| **支付失败** | `expired` | 支付超时 | WayForPay Expired |
| | `declined` | 银行拒绝支付 | WayForPay Declined |
| | `failed` | 支付失败 | 其他未知失败 |
| **退款** | `refunding` | 退款处理中 | 用户申请退款 |
| | `refund_processing` | 退款处理中 | WayForPay RefundInProcessing |
| | `refunded` | 已退款 | 退款完成（含Voided） |

---

## 2. 状态分组

### 2.1 按业务功能分组

```
Pre-payment (2)   → pending, widget_load_failed
Processing (2)    → processing, fraud_check
Payment OK (4)    → paid, confirmed, delivering, completed
Payment Fail (3)  → expired, declined, failed
Refund (3)        → refunding, refund_processing, refunded
```

### 2.2 按项目计数分组

**计入 current_units（增加项目进度）:**
- `paid`, `confirmed`, `delivering`, `completed`

**不计入 current_units:**
- `pending`, `processing`, `fraud_check`, `widget_load_failed`
- `expired`, `declined`, `failed`
- `refunding`, `refund_processing`, `refunded`

### 2.3 按公开可见性分组

**公开捐赠列表可见:**
- `paid`, `confirmed`, `delivering`, `completed`

**仅限当事人可见（通过追踪功能）:**
- 全部15种状态

---

## 3. 状态定义一致性检查

### 3.1 各处状态列表对比

| 位置 | 状态数量 | 一致性 |
|------|----------|--------|
| `types/index.ts` (DONATION_STATUSES) | 15 | ✅ |
| 数据库 CHECK 约束 | 15 | ✅ |
| `DonationStatusBadge.tsx` switch | 15 | ✅ (含default) |
| `DonationStatusProgress.tsx` | 5 (正常流程) | ✅ (仅展示主流程) |
| `DonationStatusFlow.tsx` | 6 (主流程+退款) | ✅ (仅展示主流程+退款) |
| messages/*.json 翻译 | 14 | ⚠️ 见下方 |

### 3.2 翻译文件覆盖检查

**翻译键路径**: `trackDonation.status.*`

| 状态 | en.json | zh.json | ua.json |
|------|---------|---------|---------|
| pending | ✅ | ✅ | ✅ |
| widget_load_failed | ✅ | ✅ | ✅ |
| processing | ✅ | ✅ | ✅ |
| fraud_check | ✅ | ✅ | ✅ |
| paid | ✅ | ✅ | ✅ |
| confirmed | ✅ | ✅ | ✅ |
| delivering | ✅ | ✅ | ✅ |
| completed | ✅ | ✅ | ✅ |
| expired | ✅ | ✅ | ✅ |
| declined | ✅ | ✅ | ✅ |
| failed | ✅ | ✅ | ✅ |
| refunding | ✅ | ✅ | ✅ |
| refund_processing | ✅ | ✅ | ✅ |
| refunded | ✅ | ✅ | ✅ |

**结论**: 所有15种状态在3种语言中都有翻译 ✅

---

## 4. 状态转换规则

### 4.1 约束层级说明

⚠️ **重要**: 状态转换约束分为两个层级，理解这一点至关重要：

| 层级 | 约束类型 | 适用范围 | 强度 |
|------|----------|----------|------|
| **数据库层** | 硬约束 | 仅对管理员 (`auth.uid() IS NOT NULL`) | 强制 |
| **应用层** | 软约束 | Webhook过滤逻辑 | 可绕过 |

**数据库对 Service Role (`auth.uid() IS NULL`) 允许任意状态转换！**

### 4.2 数据库硬约束（仅管理员）

触发器 `prevent_donation_immutable_fields()` 强制执行：

```sql
-- 管理员只能执行以下3种转换
IF auth.uid() IS NOT NULL THEN
  IF NOT (
    (OLD = 'paid' AND NEW = 'confirmed') OR
    (OLD = 'confirmed' AND NEW = 'delivering') OR
    (OLD = 'delivering' AND NEW = 'completed')
  ) THEN
    RAISE EXCEPTION 'Invalid status transition';
  END IF;
END IF;
-- Service Role 无任何限制
```

### 4.3 应用层软约束（Webhook）

`route.ts` 通过 `transitionableStatuses` 实现过滤，决定**哪些当前状态的记录会被更新**：

```typescript
// 支付类Webhook - 只更新以下状态的记录
const paymentTransitionable = ['pending', 'processing', 'fraud_check', 'widget_load_failed']

// 退款类Webhook - 只更新以下状态的记录
const refundTransitionable = ['paid', 'confirmed', 'delivering', 'refunding', 'refund_processing']
```

### 4.4 完整状态转换矩阵

**支付类Webhook可触发的转换** (当前状态 → 新状态):

| 当前状态 | → paid | → processing | → fraud_check | → expired | → declined | → failed |
|----------|--------|--------------|---------------|-----------|------------|----------|
| pending | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| processing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| fraud_check | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| widget_load_failed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**退款类Webhook可触发的转换**:

| 当前状态 | → refund_processing | → refunded |
|----------|---------------------|------------|
| paid | ✅ | ✅ |
| confirmed | ✅ | ✅ |
| delivering | ✅ | ✅ |
| refunding | ✅ | ✅ |
| refund_processing | ✅ | ✅ |

**用户/客户端可触发的转换**:

| 当前状态 | → widget_load_failed | → refunding |
|----------|----------------------|-------------|
| pending | ✅ (客户端) | ❌ |
| paid | ❌ | ✅ (退款请求) |
| confirmed | ❌ | ✅ (退款请求) |
| delivering | ❌ | ✅ (退款请求) |

**管理员可触发的转换** (数据库强制):

| 当前状态 | → confirmed | → delivering | → completed |
|----------|-------------|--------------|-------------|
| paid | ✅ | ❌ | ❌ |
| confirmed | ❌ | ✅ | ❌ |
| delivering | ❌ | ❌ | ✅ (需上传文件) |

### 4.5 典型状态流程图

```
                                    ┌─────────────────────────────────┐
                                    │         支付失败分支             │
                                    │                                 │
                                    │   ┌──→ expired                  │
                                    │   │                             │
                                    │   ├──→ declined                 │
                                    │   │                             │
                                    │   └──→ failed                   │
                                    │                                 │
                                    └─────────────────────────────────┘
                                              ▲
                                              │ (Webhook)
    ┌────────────┐                            │
    │ 用户创建订单 │                           │
    └─────┬──────┘                            │
          │                                   │
          ▼                                   │
    ┌────────────┐    Widget失败    ┌──────────────────────┐
    │  pending   │──────────────────→ widget_load_failed  │
    └─────┬──────┘                  └──────────┬───────────┘
          │                                    │
          │ (Webhook)                          │ (Webhook: 用户重试)
          ▼                                    │
    ┌────────────┐◄────────────────────────────┘
    │ processing │◄─────┐
    └─────┬──────┘      │
          │             │ (Webhook: 状态变化)
          ▼             │
    ┌────────────┐──────┘
    │fraud_check │
    └─────┬──────┘
          │ (Webhook)
          ▼
    ┌──────────┐
    │   paid   │◄──────── WayForPay Approved
    └────┬─────┘
         │
         │ (Admin: 数据库强制)
         ▼
    ┌──────────┐
    │confirmed │
    └────┬─────┘
         │
         │ (Admin: 数据库强制)
         ▼
    ┌──────────┐        用户申请      ┌───────────┐
    │delivering│───────────────────────▶ refunding │
    └────┬─────┘                       └─────┬─────┘
         │                                   │
         │ (Admin: 数据库强制 + 文件上传)      │ (API/Webhook)
         ▼                                   ▼
    ┌──────────┐                     ┌────────────────┐
    │completed │                     │refund_processing│
    └──────────┘                     └───────┬────────┘
                                             │ (Webhook)
                                             ▼
                                      ┌──────────┐
                                      │ refunded │
                                      └──────────┘
```

### 4.6 状态变化来源汇总

| 变化来源 | 说明 | 约束层级 |
|----------|------|----------|
| **用户创建** | 只能创建 `pending` | RLS INSERT 策略 |
| **客户端** | `pending` → `widget_load_failed` | RLS UPDATE 策略 |
| **WayForPay Webhook** | 支付/退款状态 | 应用层软过滤 |
| **用户退款请求** | `paid/confirmed/delivering` → `refunding` | 应用层验证 |
| **管理员** | `paid→confirmed→delivering→completed` | 数据库触发器强制 |

---

## 5. 数据库层约束

### 5.1 CHECK 约束

**文件**: `20251224160000_remove_user_cancelled_status.sql`

```sql
ALTER TABLE public.donations
ADD CONSTRAINT donations_status_check CHECK (
  donation_status IN (
    'pending', 'widget_load_failed',
    'processing', 'fraud_check',
    'paid', 'confirmed', 'delivering', 'completed',
    'expired', 'declined', 'failed',
    'refunding', 'refund_processing', 'refunded'
  )
);
```

### 5.2 触发器函数

#### 5.2.1 状态转换验证

**文件**: `20251224120000_restrict_admin_status_updates.sql`

```sql
CREATE OR REPLACE FUNCTION prevent_donation_immutable_fields()
-- 验证逻辑:
-- 1. 如果 auth.uid() IS NOT NULL (管理员/已认证用户)
--    只允许: paid→confirmed, confirmed→delivering, delivering→completed
-- 2. 如果 auth.uid() IS NULL (Service Role)
--    允许任意状态转换 (用于Webhook和退款API)
```

#### 5.2.2 状态历史记录

**文件**: `20260106010000_add_donation_status_history.sql`

```sql
CREATE OR REPLACE FUNCTION log_donation_status_change()
-- INSERT: 记录初始状态 (from_status = NULL)
-- UPDATE: 记录状态变化 (from_status = OLD, to_status = NEW)
```

#### 5.2.3 项目单位数更新

**文件**: `20260106020000_fix_update_project_units_trigger.sql`

```sql
CREATE OR REPLACE FUNCTION update_project_units()
-- counted_statuses: paid, confirmed, delivering, completed
-- 状态从 non-counted → counted: current_units + 1
-- 状态从 counted → non-counted: current_units - 1
```

### 5.3 RLS 策略

| 策略名称 | 操作 | 条件 |
|----------|------|------|
| Allow anonymous insert pending donations | INSERT | donation_status = 'pending' |
| Allow anonymous update pending to widget_load_failed | UPDATE | FROM pending TO widget_load_failed |
| Admins can update donation status | UPDATE | is_admin() |
| Public can view confirmed donations | SELECT | status IN (paid, confirmed, delivering, completed) |

---

## 6. UI层影响

### 6.1 状态徽章颜色方案

**组件**: `components/donation/DonationStatusBadge.tsx`

| 状态 | 背景色 | 文字色 | 语义 |
|------|--------|--------|------|
| pending | yellow-100 | yellow-800 | 等待中 |
| widget_load_failed | gray-100 | gray-700 | 失败/未完成 |
| processing | blue-100 | blue-800 | 处理中 |
| fraud_check | purple-100 | purple-800 | 审核中 |
| paid | green-100 | green-800 | 成功 |
| confirmed | green-100 | green-800 | 成功 |
| delivering | blue-100 | blue-700 | 进行中 |
| completed | green-100 | green-800 | 成功 |
| expired | gray-100 | gray-600 | 过期/失效 |
| declined | red-100 | red-800 | 失败 |
| failed | red-100 | red-800 | 失败 |
| refunding | orange-100 | orange-800 | 退款中 |
| refund_processing | orange-100 | orange-800 | 退款中 |
| refunded | gray-100 | gray-700 | 已退款 |

### 6.2 状态对功能的影响

#### 6.2.1 "查看结果"按钮

**条件**: `donation_status === 'completed'`

**组件**:
- `components/donation/ProjectDonationList.tsx`
- `app/[locale]/track-donation/track-donation-form.tsx`

#### 6.2.2 退款按钮

**可退款状态**: `paid`, `confirmed`, `delivering`

**不可退款**:
- `completed` → 错误: cannotRefundCompleted
- `refunding`, `refund_processing`, `refunded` → 错误: alreadyRefunding
- `pending`, `failed`, `expired`, `declined` → 错误: cannotRefundPending

#### 6.2.3 管理员状态编辑

**可编辑状态**: `paid`, `confirmed`, `delivering`
**不可编辑**: 所有退款状态、失败状态、completed(状态变更)

**批量编辑限制**:
- 所有选中捐赠必须状态一致
- `delivering` → `completed` 不支持批量（需要上传文件）

### 6.3 支付成功页分组

**文件**: `app/[locale]/donate/success/DonationDetails.tsx`

```typescript
const statusGroups = {
  failed: ['widget_load_failed', 'expired', 'declined', 'failed'],
  processing: ['pending', 'processing', 'fraud_check'],
  success: ['paid', 'confirmed', 'delivering', 'completed',
            'refunding', 'refund_processing', 'refunded']
}
```

| 分组 | UI表现 |
|------|--------|
| failed | 红色提示，重试引导，帮助信息 |
| processing | 黄色/蓝色提示，等待消息，邮件提醒 |
| success | 绿色确认，追踪信息，下一步操作 |

---

## 7. 退款逻辑

### 7.1 退款资格验证

**文件**: `app/actions/track-donation.ts` (requestRefund函数)

```typescript
// 验证逻辑
if (status === 'completed') {
  return { error: 'cannotRefundCompleted' }  // 已完成不可退
}
if (['refunding', 'refund_processing', 'refunded'].includes(status)) {
  return { error: 'alreadyRefunding' }  // 已在退款流程
}
if (['pending', 'failed', 'expired', 'declined'].includes(status)) {
  return { error: 'cannotRefundPending' }  // 未支付成功不可退
}
// 只有 paid, confirmed, delivering 可退款
```

### 7.2 WayForPay 退款状态映射

| WayForPay状态 | 系统状态 | 说明 |
|---------------|----------|------|
| Refunded | refunded | 退款完成 |
| RefundInProcessing | refund_processing | 退款处理中 |
| Voided | refunded | 预授权取消，视为退款 |
| Declined (退款请求) | 保持原状态 | 退款被拒，用户仍持有捐赠 |

### 7.3 退款失败处理

如果WayForPay API调用失败:
- 状态设为 `refunding` (记录用户意图)
- 管理员可在后台看到退款请求
- 需要人工跟进处理

---

## 8. 项目进度计数

### 8.1 计数逻辑

**触发器**: `update_project_units()`

```sql
counted_statuses := ARRAY['paid', 'confirmed', 'delivering', 'completed'];
non_counted_statuses := ARRAY[其他11种状态];

-- INSERT: 如果新捐赠状态在 counted_statuses → current_units + 1
-- UPDATE:
--   从 non-counted → counted: current_units + 1
--   从 counted → non-counted: current_units - 1
-- DELETE: 如果删除的捐赠状态在 counted_statuses → current_units - 1
```

### 8.2 状态变化对计数的影响

| 状态变化 | 计数变化 | 场景 |
|----------|----------|------|
| pending → paid | +1 | 支付成功 |
| paid → confirmed | 0 | 管理员确认 |
| confirmed → delivering | 0 | 开始配送 |
| delivering → completed | 0 | 配送完成 |
| paid → refunding | -1 | 用户申请退款 |
| delivering → refunding | -1 | 配送中申请退款 |
| refunding → refunded | 0 | 退款完成 |
| pending → expired | 0 | 支付超时 |

### 8.3 金额统计视图

**视图**: `project_stats`

只统计 `paid, confirmed, delivering, completed` 状态的捐赠金额:

```sql
COALESCE(SUM(
  CASE
    WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
    THEN d.amount
    ELSE 0
  END
), 0) AS total_raised
```

---

## 9. 潜在Bug分析

### 9.1 ✅ 已解决的问题

1. **order_donations_secure 视图状态过滤过严**
   - 问题: 最初只包含成功状态，导致pending/processing等状态在成功页不可见
   - 解决: 移除状态过滤 (20260105020000)

2. **项目单位计数不处理refunding状态**
   - 问题: 最初只处理refunded，导致refunding时计数不减少
   - 解决: 更新触发器处理所有15种状态 (20260106020000)

3. **user_cancelled 状态冗余**
   - 问题: 与expired功能重复
   - 解决: 移除该状态 (20251224160000)

### 9.2 ⚠️ 需要注意的设计

1. **Service Role 无状态转换约束**
   - 设计: 数据库触发器只对 `auth.uid() IS NOT NULL` (管理员) 强制状态转换规则
   - Service Role (`auth.uid() IS NULL`) 可执行**任意**状态转换
   - 影响: Webhook可将任何状态变为任何状态（仅受应用层软过滤）
   - 风险: 如果WayForPay发送异常webhook，可能导致状态混乱
   - 缓解: 应用层 `transitionableStatuses` 过滤器提供额外保护
   - **建议**: 可考虑在数据库层添加更严格的状态机约束

2. **Declined 状态的双重含义**
   - Webhook中需要区分: 支付被拒 vs 退款被拒
   - 当前实现: 根据当前状态判断 (paid/confirmed/delivering/refund_processing 表示退款被拒)
   - 建议: 逻辑正确但需要注意维护

3. **refunding 与 refund_processing 的区别**
   - `refunding`: 用户申请退款 / API调用失败的fallback
   - `refund_processing`: WayForPay正在处理
   - 翻译相同("退款处理中")，UI相同，可考虑合并

4. **批量编辑delivering状态的限制**
   - 设计: delivering→completed需要上传文件，不支持批量
   - 影响: 大量deliveries完成时需要逐个操作
   - 建议: 可考虑添加批量上传功能

### 9.3 🔍 约束强度分析

| 约束类型 | 数据库强制 | 应用层验证 | 绕过风险 |
|----------|------------|------------|----------|
| 管理员状态转换 | ✅ 触发器 | ✅ admin.ts | 低 |
| Webhook状态转换 | ❌ 无约束 | ✅ 软过滤 | 中 |
| 用户创建pending | ✅ RLS | ✅ donation.ts | 低 |
| 用户退款请求 | ❌ 无约束 | ✅ track-donation.ts | 中 |

### 9.4 ✅ 一致性确认

| 检查项 | 状态 |
|--------|------|
| 类型定义 vs 数据库约束 | ✅ 一致 (15种) |
| 翻译文件覆盖 | ✅ 完整 (3语言×15状态) |
| 触发器状态列表 | ✅ 完整 (15种) |
| UI组件switch覆盖 | ✅ 完整 (含default) |
| 项目计数逻辑 | ✅ 正确 (4种计入) |
| 公开可见性 | ✅ 正确 (4种公开) |

---

## 10. 文件索引

### 10.1 核心定义文件

| 文件 | 内容 |
|------|------|
| `types/index.ts` | DONATION_STATUSES 常量和 DonationStatus 类型 |
| `types/database.ts` | Supabase 生成的数据库类型 |
| `lib/wayforpay/server.ts` | WAYFORPAY_STATUS 常量 |

### 10.2 状态转换逻辑

| 文件 | 内容 |
|------|------|
| `app/actions/admin.ts` | 管理员状态更新 (updateDonationStatus, batchUpdateDonationStatus) |
| `app/actions/donation.ts` | 捐赠创建 (pending), Widget失败 (widget_load_failed) |
| `app/actions/track-donation.ts` | 退款请求 (refunding) |
| `app/api/webhooks/wayforpay/route.ts` | Webhook状态映射 |

### 10.3 UI组件

| 文件 | 内容 |
|------|------|
| `components/donation/DonationStatusBadge.tsx` | 状态徽章 (颜色/样式) |
| `components/donation/DonationStatusFlow.tsx` | 状态流程图 |
| `components/admin/DonationStatusProgress.tsx` | 管理员状态进度条 |
| `components/admin/DonationsTable.tsx` | 捐赠表格 (筛选/批量选择) |
| `components/admin/DonationEditModal.tsx` | 单个编辑模态框 |
| `components/admin/BatchDonationEditModal.tsx` | 批量编辑模态框 |
| `components/donation/ProjectDonationList.tsx` | 项目捐赠列表 |
| `components/donation/DonationResultViewer.tsx` | 结果查看器 |
| `app/[locale]/track-donation/track-donation-form.tsx` | 追踪表单 |
| `app/[locale]/donate/success/DonationDetails.tsx` | 成功页详情 |

### 10.4 数据库迁移

| 文件 | 内容 |
|------|------|
| `20251219061700_reset_complete.sql` | 初始Schema (7状态) |
| `20251220000000_add_failed_status.sql` | 添加failed状态 |
| `20251224000000_add_donation_status_constraints.sql` | 扩展到16状态 |
| `20251224120000_restrict_admin_status_updates.sql` | 管理员转换限制触发器 |
| `20251224160000_remove_user_cancelled_status.sql` | 最终15状态 |
| `20260106010000_add_donation_status_history.sql` | 状态历史表+触发器 |
| `20260106020000_fix_update_project_units_trigger.sql` | 项目计数触发器 |

### 10.5 翻译文件

| 文件 | 路径 |
|------|------|
| `messages/en.json` | trackDonation.status.* |
| `messages/zh.json` | trackDonation.status.* |
| `messages/ua.json` | trackDonation.status.* |

---

## 附录: 状态代码速查表

```
┌─────────────────────┬────────────────────┬─────────┬─────────┬──────────┐
│ 状态                 │ 变化来源            │ 计入进度 │ 公开可见 │ 可退款    │
├─────────────────────┼────────────────────┼─────────┼─────────┼──────────┤
│ pending             │ 用户创建            │ ❌       │ ❌       │ ❌        │
│ widget_load_failed  │ 客户端              │ ❌       │ ❌       │ ❌        │
│ processing          │ Webhook            │ ❌       │ ❌       │ ❌        │
│ fraud_check         │ Webhook            │ ❌       │ ❌       │ ❌        │
│ paid                │ Webhook            │ ✅       │ ✅       │ ✅        │
│ confirmed           │ Admin              │ ✅       │ ✅       │ ✅        │
│ delivering          │ Admin              │ ✅       │ ✅       │ ✅        │
│ completed           │ Admin + 文件上传    │ ✅       │ ✅       │ ❌        │
│ expired             │ Webhook            │ ❌       │ ❌       │ ❌        │
│ declined            │ Webhook            │ ❌       │ ❌       │ ❌        │
│ failed              │ Webhook            │ ❌       │ ❌       │ ❌        │
│ refunding           │ 用户请求 / API      │ ❌       │ ❌       │ ❌        │
│ refund_processing   │ Webhook / API      │ ❌       │ ❌       │ ❌        │
│ refunded            │ Webhook / API      │ ❌       │ ❌       │ ❌        │
└─────────────────────┴────────────────────┴─────────┴─────────┴──────────┘
```

---

**文档生成时间**: 2026-01-06
**分析工具**: Claude Code
**涉及文件数**: 44+ (迁移) + 15+ (代码) + 3 (翻译)
