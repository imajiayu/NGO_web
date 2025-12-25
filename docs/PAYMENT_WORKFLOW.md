# NGO 平台 - WayForPay 支付流程与改进方案

## 📋 文档概述

本文档详细记录了 WayForPay 支付集成的完整流程、状态管理、webhook 处理逻辑，以及计划中的改进方案。

**最后更新**: 2025-12-24
**WayForPay API 版本**: Standard Payment Widget
**文档版本**: 1.1.0 (新增 Voided vs Refunded 设计决策)

---

## 🎯 目录

1. [WayForPay 交易状态完整列表](#wayforpay-交易状态完整列表)
2. [当前支付流程详解](#当前支付流程详解)
3. [Webhook 处理逻辑](#webhook-处理逻辑)
4. [当前架构的问题](#当前架构的问题)
5. [改进方案](#改进方案)
6. [退款流程完善](#退款流程完善)

---

## 📊 WayForPay 交易状态完整列表

根据 [WayForPay 官方文档](https://wiki.wayforpay.com/en/view/852131)，以下是所有可能的 `transactionStatus` 值：

| 状态值 | 官方说明 | 中文含义 | Webhook 触发 | 当前代码处理 |
|--------|---------|---------|-------------|-------------|
| `Approved` | Successful payment | 支付成功（资金已扣款） | ✅ 是 | ✅ 更新为 `paid` + 发邮件 |
| `Declined` | Operation cannot be completed | 操作无法完成（被拒绝） | ✅ 是 | ✅ 更新为 `failed` |
| `Pending` | Under anti-fraud verification | 反欺诈审核中 | ✅ 是 | ⚠️ 仅记录日志 |
| `Expired` | Payment term has elapsed | 支付已过期 | ✅ 是 | ⚠️ 归类为 `failed` |
| `inProcessing` | Under processing | 处理中（等待支付网关） | ✅ 可能 | ⚠️ 归类为 `failed` |
| `WaitingAuthComplete` | Successful Hold | 预授权成功（等待结算） | ✅ 可能 | ⚠️ 归类为 `failed` |
| `Refunded` | Refund completed | 退款已完成 | ✅ 是 | ✅ 更新为 `refunded` |
| `Voided` | Asset un-holding completed | 解除预授权完成 | ✅ 可能 | ✅ 更新为 `refunded`（同 Refunded）⭐ |
| `RefundInProcessing` | Refund awaiting merchant balance | 退款处理中 | ✅ 可能 | ✅ 已定义常量 |

**⭐ 设计决策**：`Voided` 和 `Refunded` 统一处理为 `refunded` 状态。详见下文「Voided vs Refunded：设计决策」章节。

### 当前代码中的状态常量定义

**lib/wayforpay/server.ts:149-155**
```typescript
export const WAYFORPAY_STATUS = {
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  PENDING: 'Pending',
  REFUND_IN_PROCESSING: 'RefundInProcessing',
  REFUNDED: 'Refunded',
  // ❌ 缺失: Expired, inProcessing, WaitingAuthComplete, Voided
} as const
```

**⚠️ 缺失的状态常量**：
- `EXPIRED`
- `IN_PROCESSING`
- `WAITING_AUTH_COMPLETE`
- `VOIDED`

### Voided vs Refunded：设计决策

#### 技术区别

**Voided（撤销预授权）**：
- 📍 **时机**：资金仅被冻结（预授权），尚未实际扣款
- ⚡ **速度**：立即生效（几秒内）
- 💰 **成本**：无手续费（无实际资金转移）
- 🎯 **流程**：银行冻结 → 解除冻结 → 用户可用额度立即恢复
- 📊 **示例**：酒店预订押金、租车押金的快速释放

**Refunded（退款）**：
- 📍 **时机**：资金已实际扣款（Approved 状态后）
- 🐌 **速度**：3-10 个工作日
- 💸 **成本**：可能有手续费
- 🎯 **流程**：银行扣款 → 资金到商户 → 退款 → 资金退回用户
- 📊 **示例**：商品退货、服务取消的退款

#### 我们的设计选择 ✅

**决策**：**Voided 和 Refunded 统一处理为 `refunded` 状态**

**理由**：
1. ✅ **用户视角一致**：无论技术实现如何，用户看到的结果都是"钱回来了"
2. ✅ **简化系统复杂度**：避免引入额外的状态和逻辑分支
3. ✅ **Voided 场景罕见**：大多数支付直接 Approved（立即扣款），预授权模式较少
4. ✅ **财务影响有限**：对于 NGO 捐赠平台，资金流入/流出的区分不如电商平台重要
5. ✅ **日志完整性**：Webhook 日志会记录实际的 `transactionStatus`，需要时可追溯

**实现**：
```typescript
// app/api/webhooks/wayforpay/route.ts
if (transactionStatus === WAYFORPAY_STATUS.REFUNDED ||
    transactionStatus === WAYFORPAY_STATUS.VOIDED) {
  newStatus = 'refunded'
  console.log(`[WEBHOOK] Payment cancelled (${transactionStatus}) - marking as refunded`)
}
```

**用户界面显示**：
```
捐赠状态：已退款
说明：您的捐赠已取消，资金已退回您的账户。
```

**备注**：如果未来需要区分这两种情况（例如用于详细财务分析），可以：
- 在数据库日志表中记录原始 `transactionStatus`
- 或在 `donations` 表添加 `cancellation_reason` 字段
- 但在用户界面保持简化显示

#### Refund API 的智能处理

**重要发现**：根据 [WayForPay Refund API 文档](https://wiki.wayforpay.com/en/view/852115)，Refund API 的响应可以是 "Refunded, **Voided**" 或 "Declined"。

**推测行为**（待验证）：

| 交易当前状态 | 调用 Refund API | 实际执行操作 | 返回 Webhook |
|------------|----------------|-------------|-------------|
| `WaitingAuthComplete` | `Refund` | **Void**（撤销预授权） | `Voided` |
| `Approved` | `Refund` | **Refund**（退款） | `RefundInProcessing` → `Refunded` |

**原理**：
- ✅ WayForPay 检测交易状态，自动选择最优操作
- ✅ 预授权阶段：执行 Void（快速、无手续费）
- ✅ 已扣款阶段：执行 Refund（标准退款流程）

**验证方法**：
- 在测试环境对预授权交易调用 Refund API
- 观察返回的 Webhook 状态
- 或联系 WayForPay 技术支持确认

**对我们系统的影响**：
- ✅ 无论返回 `Voided` 还是 `Refunded`，都统一处理为 `refunded` 状态
- ✅ 用户体验保持一致
- ✅ Webhook 日志会记录实际返回的状态，便于排查

---

## 🔄 当前支付流程详解

### 1. 用户提交捐赠表单

**文件**: `components/donate/DonationFormCard.tsx:274-343`

```
用户填写表单 → 点击提交按钮
  ↓
handleSubmit()
  ↓
setShowWidget(true)  ← 立即显示支付窗口容器
setProcessingState('creating')  ← 显示"正在处理"状态
scrollToFormArea()  ← 滚动到支付区域
  ↓
调用 Server Action: createWayForPayDonation()
```

**关键时序**：
1. ✅ 先更新 UI（显示处理中状态）
2. ✅ 再发起网络请求（创建订单）

---

### 2. Server Action 创建订单和支付参数

**文件**: `app/actions/donation.ts:18-201`

**步骤**：

#### 2.1 验证项目和数量
```typescript
// 1. 验证输入
const validated = donationFormSchema.parse(data)

// 2. 查询项目
const project = await getProjectById(validated.project_id)

// 3. 检查项目状态
if (project.status !== 'active') {
  return { success: false, error: 'project_not_active' }
}

// 4. 检查数量限制（非长期项目）
if (!project.is_long_term) {
  const remainingUnits = project.target_units - project.current_units
  if (validated.quantity > remainingUnits) {
    return { success: false, error: 'quantity_exceeded', remainingUnits }
  }
}
```

#### 2.2 生成订单号
```typescript
const timestamp = Date.now()
const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
const orderReference = `DONATE-${project.id}-${timestamp}-${randomSuffix}`
```

**格式**: `DONATE-{项目ID}-{时间戳}-{6位随机码}`
**示例**: `DONATE-1-1703462400000-A1B2C3`

#### 2.3 创建 Pending 捐赠记录
```typescript
for (let i = 0; i < validated.quantity; i++) {
  // 生成公开捐赠 ID
  const donationPublicId = await supabase.rpc('generate_donation_public_id', {
    project_id_input: validated.project_id
  })

  donationRecords.push({
    donation_public_id: donationPublicId,  // 如: "1-A1B2C3"
    order_reference: orderReference,       // 如: "DONATE-1-1703462400000-A1B2C3"
    project_id: validated.project_id,
    donor_name: validated.donor_name,
    donor_email: validated.donor_email,
    amount: unitPrice,
    currency: 'USD',
    payment_method: 'WayForPay',
    donation_status: 'pending',  ← ⚠️ 初始状态
    locale: validated.locale,
  })
}

// 批量插入数据库
const { data } = await supabase.from('donations').insert(donationRecords).select()
```

**⚠️ 关键时间点**：此时订单已在数据库中，状态为 `pending`

#### 2.4 生成支付参数
```typescript
const paymentParams = createWayForPayPayment({
  orderReference,
  amount: totalAmount,
  currency: 'USD',
  productName: [projectName],
  productPrice: [unitPrice],
  productCount: [validated.quantity],
  clientFirstName,
  clientLastName,
  clientEmail: validated.donor_email,
  language: 'UA' | 'EN',
  returnUrl: `${baseUrl}/api/donate/success-redirect?order=${orderReference}`,
  serviceUrl: `${baseUrl}/api/webhooks/wayforpay`,
})
```

**生成 HMAC-MD5 签名**：
```typescript
// lib/wayforpay/server.ts:86-98
const signatureValues = [
  merchantAccount,
  merchantDomain,
  orderReference,
  orderDate,
  amount,
  currency,
  ...productName,
  ...productCount,
  ...productPrice,
]
const merchantSignature = crypto.createHmac('md5', secretKey)
  .update(signatureValues.join(';'))
  .digest('hex')
```

#### 2.5 返回支付参数
```typescript
return {
  success: true,
  paymentParams: {
    merchantAccount,
    merchantSignature,
    orderReference,
    amount,
    currency,
    // ... 其他参数
  },
  amount: totalAmount,
  orderReference,
}
```

---

### 3. 前端加载 WayForPay Widget

**文件**: `app/[locale]/donate/wayforpay-widget.tsx:37-155`

#### 3.1 加载 WayForPay 脚本
```typescript
const script = document.createElement('script')
script.src = 'https://secure.wayforpay.com/server/pay-widget.js'
script.async = true

// 15秒超时
setTimeout(() => {
  if (!scriptLoadedRef.current) {
    setError(t('errors.paymentLoadFailed'))
  }
}, 15000)
```

**⚠️ 问题 1**：如果脚本加载失败（网络问题），数据库中已有 `pending` 记录，但用户无法支付。

#### 3.2 初始化支付 Widget
```typescript
const wayforpay = new window.Wayforpay()

wayforpay.run(
  paymentParams,  ← 此时才向 WayForPay 发送订单信息

  // 成功回调
  function (response) {
    // WayForPay 会自动重定向到 returnUrl
  },

  // 失败回调
  function (response) {
    setError(response.reason || t('errors.paymentFailed'))
  },

  // Pending 回调
  function (response) {
    if (response && response.orderReference) {
      // 重定向到成功页面
      window.location.href = paymentParams.returnUrl
    } else {
      setError(tWidget('windowClosed'))  ← ⚠️ 用户关闭窗口
    }
  }
)
```

**⚠️ 问题 2**：用户关闭支付窗口时，前端显示错误，但数据库记录仍为 `pending`，且不会收到 webhook。

---

### 4. 用户完成支付

**可能的结果**：

| 用户操作 | WayForPay Widget 回调 | WayForPay Webhook | 数据库状态 |
|---------|---------------------|------------------|-----------|
| 支付成功 | Success → 重定向 | `Approved` | `pending` → `paid` |
| 支付失败（银行拒绝） | Failed → 显示错误 | `Declined` | `pending` → `failed` |
| 支付中（反欺诈） | Pending → 重定向 | `Pending` | 保持 `pending` |
| 关闭窗口（未支付） | Pending → 显示错误 | ❌ 无 | 保持 `pending` ⚠️ |
| 超时未支付 | ❌ 无 | `Expired`（数小时后） | `pending` → `failed` |

---

## 🔔 Webhook 处理逻辑

**文件**: `app/api/webhooks/wayforpay/route.ts:6-143`

### 当前代码流程

```typescript
export async function POST(req: Request) {
  const body = await req.json()
  const { transactionStatus, orderReference, merchantSignature } = body

  // 1. 验证签名
  if (!verifyWayForPaySignature(body, merchantSignature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. 处理不同状态
  if (transactionStatus === 'Approved') {
    // 更新为 paid，发送邮件
  } else if (transactionStatus === 'Pending') {
    // 仅记录日志，不更新数据库
  } else if (transactionStatus === 'Declined') {
    // 更新为 failed
  } else {
    // 其他状态（包括 Expired, inProcessing 等）都更新为 failed
  }

  // 3. 返回确认响应
  const signature = generateWebhookResponseSignature(orderReference, 'accept', time)
  return NextResponse.json({ orderReference, status: 'accept', time, signature })
}
```

### 详细处理逻辑

#### Case 1: `Approved` - 支付成功
```typescript
if (transactionStatus === WAYFORPAY_STATUS.APPROVED) {
  // 1. 查询所有 pending 捐赠
  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('order_reference', orderReference)

  // 2. 更新为 paid
  await supabase
    .from('donations')
    .update({ donation_status: 'paid' })
    .eq('order_reference', orderReference)
    .eq('donation_status', 'pending')

  // 3. 发送确认邮件
  await sendDonationConfirmation({
    to: donor_email,
    donorName: donor_name,
    projectName: project_name,
    donationIds: updatedDonations.map(d => d.donation_public_id),
    totalAmount: parseFloat(body.amount),
    currency: body.currency,
    locale: locale,
  })
}
```

**触发时机**：用户支付成功后立即（通常 1-5 秒内）

---

#### Case 2: `Pending` - 反欺诈审核中
```typescript
else if (transactionStatus === WAYFORPAY_STATUS.PENDING) {
  console.log('[WEBHOOK] Pending - waiting for approval')
}
```

**⚠️ 当前问题**：
- 不更新数据库
- 用户已被重定向到成功页面
- 如果后续审核失败，用户不会收到通知

**触发时机**：
1. 首次支付时（前端同步回调）
2. 反欺诈系统审核中（异步 webhook）

---

#### Case 3: `Declined` - 支付被拒绝
```typescript
else if (transactionStatus === WAYFORPAY_STATUS.DECLINED) {
  await supabase
    .from('donations')
    .update({ donation_status: 'failed' })
    .eq('order_reference', orderReference)
    .eq('donation_status', 'pending')
}
```

**触发时机**：
- 银行拒绝交易（余额不足、卡片冻结等）
- 支付信息验证失败

---

#### Case 4: 其他状态（包括 `Expired`）
```typescript
else {
  console.log(`[WEBHOOK] Non-approved status: ${transactionStatus} - marking as failed`)

  await supabase
    .from('donations')
    .update({ donation_status: 'failed' })
    .eq('order_reference', orderReference)
    .eq('donation_status', 'pending')
}
```

**⚠️ 当前问题**：
- `Expired` 和 `Declined` 被归为同一类
- 无法区分"用户放弃"和"银行拒绝"

---

## ❌ 当前架构的问题

### 问题 1：脚本加载失败导致的僵尸订单

**场景**：用户因网络问题无法加载 WayForPay Widget 脚本

**当前流程**：
```
用户提交表单
  ↓
创建 pending 记录（已存入数据库）
  ↓
加载 WayForPay 脚本失败（网络问题）
  ↓
前端显示错误
  ↓
❌ 数据库记录永久保持 pending 状态
❌ 不会收到任何 webhook
```

**影响**：
- ✅ 项目统计不受影响（`current_units` 触发器只统计 `paid` 及以上状态）
- ❌ 数据库累积无效记录
- ❌ 用户可能多次重试，产生多条 pending 记录

---

### 问题 2：用户关闭窗口导致的僵尸订单

**场景**：用户拉起支付窗口，但未输入支付信息就关闭

**当前流程**：
```
WayForPay Widget 已加载
  ↓
支付窗口弹出（或跳转支付页面）
  ↓
用户关闭窗口/返回
  ↓
前端 Pending Callback 触发（无 orderReference）
  ↓
前端显示错误: "窗口已关闭"
  ↓
❌ WayForPay 不会发送 webhook（因为没有实际交易）
❌ 数据库记录永久保持 pending 状态
```

**判断依据**：
```typescript
// wayforpay-widget.tsx:110-122
function (response: any) {
  if (response && response.orderReference) {
    // 有 orderReference → 用户至少进行了部分操作
    window.location.href = paymentParams.returnUrl
  } else {
    // 无 orderReference → 用户直接关闭窗口
    setError(tWidget('windowClosed'))  ← ⚠️ 仅前端提示
  }
}
```

---

### 问题 3：支付超时（Expired）无法区分

**场景**：用户进入支付页面，但长时间未完成

**当前流程**：
```
用户点击支付
  ↓
进入银行页面/等待验证码
  ↓
长时间未操作（数小时）
  ↓
WayForPay 发送 Webhook: transactionStatus = "Expired"
  ↓
后端处理：归类为 failed（和 Declined 相同）
  ↓
❌ 无法区分是"用户放弃"还是"银行拒绝"
```

---

### 问题 4：Pending 状态处理不完整

**场景**：反欺诈系统审核中

**当前流程**：
```
用户支付成功
  ↓
WayForPay Webhook: transactionStatus = "Pending"
  ↓
后端仅记录日志，不更新数据库
  ↓
用户看到成功页面（因为前端 Pending Callback 已重定向）
  ↓
数据库状态: pending（未更新）
  ↓
如果审核失败 → WayForPay 发送 Declined webhook → 更新为 failed
如果审核通过 → WayForPay 发送 Approved webhook → 更新为 paid
```

**⚠️ 当前问题**：
- 用户在审核期间看到的是"支付成功"，但数据库显示 `pending`
- 如果审核失败，用户已离开页面，不会看到错误通知

---

### 问题 5：退款流程不完整

**当前实现**：
```typescript
// app/actions/track-donation.ts:requestRefund()
export async function requestRefund(donorEmail: string, donationPublicId: string) {
  const { data, error } = await supabase.rpc('request_donation_refund', {
    donor_email_input: donorEmail,
    donation_public_id_input: donationPublicId,
  })

  // 数据库函数仅更新状态为 refunding
  // UPDATE donations SET donation_status = 'refunding' WHERE ...
}
```

**⚠️ 缺失的功能**：
1. ❌ 没有调用 WayForPay Refund API
2. ❌ 管理员无法标记为"已退款"（`refunded`）
3. ❌ 没有退款成功后的邮件通知
4. ❌ 没有部分退款功能

---

## ✨ 改进方案

### 改进 1：新增捐赠状态

**当前状态定义** (`types/index.ts:138`):
```typescript
export const DONATION_STATUSES = [
  'pending',     // 待支付
  'paid',        // 已支付
  'confirmed',   // 已确认
  'delivering',  // 配送中
  'completed',   // 已完成
  'refunding',   // 退款中
  'refunded',    // 已退款
  'failed',      // 失败
] as const
```

**建议新增**：
```typescript
export const DONATION_STATUSES = [
  // === 支付前 ===
  'pending',              // 待支付（订单已创建）
  'widget_load_failed',   // 支付窗口加载失败 ← 新增
  'user_cancelled',       // 用户取消支付 ← 新增

  // === 支付中 ===
  'processing',           // 支付处理中 ← 新增（对应 WayForPay inProcessing）
  'fraud_check',          // 反欺诈审核中 ← 新增（对应 WayForPay Pending）

  // === 支付完成 ===
  'paid',                 // 已支付
  'confirmed',            // 已确认
  'delivering',           // 配送中
  'completed',            // 已完成

  // === 支付失败 ===
  'expired',              // 支付超时 ← 新增（对应 WayForPay Expired）
  'declined',             // 银行拒绝 ← 新增（对应 WayForPay Declined）
  'failed',               // 其他失败

  // === 退款 ===
  'refunding',            // 退款申请中
  'refund_processing',    // 退款处理中 ← 新增（对应 WayForPay RefundInProcessing）
  'refunded',             // 已退款
] as const
```

**状态映射表**：

| 场景 | 前端事件/Webhook | 应设置的状态 | 说明 |
|------|-----------------|-------------|------|
| 脚本加载失败 | 前端超时 | `widget_load_failed` | 网络问题或 CDN 不可用 |
| 用户关闭窗口 | Pending Callback（无 orderReference） | `user_cancelled` | 未发起任何支付操作 |
| 支付处理中 | `inProcessing` | `processing` | WayForPay 正在处理 |
| 反欺诈审核 | `Pending` | `fraud_check` | 等待风控审核 |
| 支付超时 | `Expired` | `expired` | 用户未在规定时间内完成 |
| 银行拒绝 | `Declined` | `declined` | 余额不足、卡片冻结等 |
| 支付成功 | `Approved` | `paid` | 资金已扣款 |
| 退款处理中 | `RefundInProcessing` | `refund_processing` | 等待商户余额 |
| 预授权撤销 | `Voided` | `refunded` | 资金冻结已解除（统一显示为退款）⭐ |
| 退款完成 | `Refunded` | `refunded` | 资金已退回 |

**⭐ 注意**：`Voided` 和 `Refunded` 虽然技术实现不同，但从用户角度都是"钱回来了"，因此统一处理为 `refunded` 状态。详见上文「Voided vs Refunded：设计决策」。

---

### 改进 2：WayForPay 状态常量补全

**修改文件**: `lib/wayforpay/server.ts`

```typescript
export const WAYFORPAY_STATUS = {
  // 成功状态
  APPROVED: 'Approved',

  // 处理中状态
  IN_PROCESSING: 'inProcessing',              // 新增
  WAITING_AUTH_COMPLETE: 'WaitingAuthComplete', // 新增
  PENDING: 'Pending',

  // 失败状态
  DECLINED: 'Declined',
  EXPIRED: 'Expired',                         // 新增

  // 退款状态
  REFUND_IN_PROCESSING: 'RefundInProcessing',
  REFUNDED: 'Refunded',
  VOIDED: 'Voided',                          // 新增
} as const
```

---

### 改进 3：Webhook 处理逻辑增强

**修改文件**: `app/api/webhooks/wayforpay/route.ts`

```typescript
export async function POST(req: Request) {
  const { transactionStatus, orderReference } = body

  // 验证签名...

  const supabase = createServiceClient()

  // 统一查询订单
  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('order_reference', orderReference)

  if (!donations || donations.length === 0) {
    console.warn('[WEBHOOK] Order not found')
    return respondWithAccept(orderReference)
  }

  // 根据 WayForPay 状态映射到系统状态
  let newStatus: DonationStatus | null = null
  let shouldSendEmail = false

  switch (transactionStatus) {
    case WAYFORPAY_STATUS.APPROVED:
      newStatus = 'paid'
      shouldSendEmail = true
      console.log('[WEBHOOK] Payment approved')
      break

    case WAYFORPAY_STATUS.PENDING:
      newStatus = 'fraud_check'  // 新增：反欺诈审核
      console.log('[WEBHOOK] Payment under fraud check')
      break

    case WAYFORPAY_STATUS.IN_PROCESSING:
      newStatus = 'processing'  // 新增：处理中
      console.log('[WEBHOOK] Payment in processing')
      break

    case WAYFORPAY_STATUS.DECLINED:
      newStatus = 'declined'  // 新增：区分银行拒绝
      console.log('[WEBHOOK] Payment declined by bank')
      break

    case WAYFORPAY_STATUS.EXPIRED:
      newStatus = 'expired'  // 新增：区分超时
      console.log('[WEBHOOK] Payment expired')
      break

    case WAYFORPAY_STATUS.REFUNDED:
    case WAYFORPAY_STATUS.VOIDED:
      // 统一处理：Voided 和 Refunded 都视为退款完成
      // 详见文档「Voided vs Refunded：设计决策」
      newStatus = 'refunded'
      console.log(`[WEBHOOK] Payment cancelled (${transactionStatus}) - marking as refunded`)
      break

    case WAYFORPAY_STATUS.REFUND_IN_PROCESSING:
      newStatus = 'refund_processing'  // 新增
      console.log('[WEBHOOK] Refund in processing')
      break

    default:
      newStatus = 'failed'
      console.log(`[WEBHOOK] Unknown status: ${transactionStatus}`)
  }

  // 更新数据库
  if (newStatus) {
    const { data: updated } = await supabase
      .from('donations')
      .update({ donation_status: newStatus })
      .eq('order_reference', orderReference)
      .in('donation_status', ['pending', 'processing', 'fraud_check'])  // 只更新这些状态
      .select()

    console.log(`[WEBHOOK] Updated ${updated?.length} donations to ${newStatus}`)

    // 发送邮件
    if (shouldSendEmail && updated && updated.length > 0) {
      await sendDonationConfirmation(/* ... */)
    }
  }

  return respondWithAccept(orderReference)
}
```

---

### 改进 4：前端错误处理增强

**修改文件**: `app/[locale]/donate/wayforpay-widget.tsx`

```typescript
// 在脚本加载失败时，调用 Server Action 更新状态
script.onerror = async () => {
  setError(t('errors.paymentLoadFailed'))
  setIsLoading(false)

  // 调用 Server Action 标记订单为 widget_load_failed
  try {
    await markDonationFailed(orderReference, 'widget_load_failed')
  } catch (err) {
    console.error('Failed to update donation status:', err)
  }
}

// Pending callback 中处理用户关闭窗口
function (response: any) {
  if (response && response.orderReference) {
    // 有订单号，重定向成功页
    window.location.href = paymentParams.returnUrl
  } else {
    // 无订单号，用户关闭窗口
    setError(tWidget('windowClosed'))

    // 调用 Server Action 标记为 user_cancelled
    markDonationCancelled(paymentParams.orderReference, 'user_cancelled')
      .catch(err => console.error('Failed to mark as cancelled:', err))
  }
}
```

**新增 Server Action**: `app/actions/donation.ts`

```typescript
'use server'

export async function markDonationFailed(
  orderReference: string,
  reason: 'widget_load_failed' | 'user_cancelled'
) {
  const supabase = createAnonClient()

  await supabase
    .from('donations')
    .update({ donation_status: reason })
    .eq('order_reference', orderReference)
    .eq('donation_status', 'pending')

  return { success: true }
}
```

---

## 💰 退款流程完善

### 当前退款流程

**用户申请退款**:
```typescript
// app/actions/track-donation.ts
export async function requestRefund(donorEmail: string, donationPublicId: string) {
  const { data } = await supabase.rpc('request_donation_refund', {
    donor_email_input: donorEmail,
    donation_public_id_input: donationPublicId,
  })

  // 数据库函数检查权限并更新状态
  // UPDATE donations SET donation_status = 'refunding' WHERE ...
}
```

**⚠️ 仅更新数据库状态，不调用 WayForPay API**

---

### 完善后的退款流程

#### 步骤 1：用户申请退款（保持不变）
- 用户在捐赠追踪页面点击"申请退款"
- 状态更新为 `refunding`

#### 步骤 2：管理员审核并执行退款

**新增管理员界面功能**：

```typescript
// app/admin/donations/page.tsx
async function handleRefund(donation: Donation) {
  // 1. 确认退款
  const confirmed = confirm(`确认退款 ${donation.amount} USD 给 ${donation.donor_email}?`)
  if (!confirmed) return

  // 2. 调用 Server Action
  const result = await processRefund(donation.id)

  if (result.success) {
    alert('退款请求已发送到 WayForPay')
  } else {
    alert(`退款失败: ${result.error}`)
  }
}
```

**新增 Server Action**: `app/actions/admin.ts`

```typescript
'use server'

import { callWayForPayRefund } from '@/lib/wayforpay/refund'

export async function processRefund(donationId: number) {
  // 1. 验证管理员权限
  await requireAdmin()

  // 2. 查询捐赠记录
  const supabase = createServiceClient()
  const { data: donation } = await supabase
    .from('donations')
    .select('*')
    .eq('id', donationId)
    .single()

  if (!donation) {
    return { success: false, error: 'Donation not found' }
  }

  // 3. 检查状态
  if (donation.donation_status !== 'refunding') {
    return { success: false, error: 'Donation is not in refunding status' }
  }

  // 4. 调用 WayForPay Refund API
  try {
    const refundResult = await callWayForPayRefund({
      orderReference: donation.order_reference,
      amount: donation.amount,
      currency: donation.currency,
      comment: 'User requested refund',
    })

    if (refundResult.reasonCode === 1100) {
      // 退款成功，更新状态为 refund_processing
      await supabase
        .from('donations')
        .update({ donation_status: 'refund_processing' })
        .eq('id', donationId)

      return { success: true }
    } else {
      return { success: false, error: refundResult.reason }
    }
  } catch (err) {
    console.error('[REFUND] Error:', err)
    return { success: false, error: 'Failed to call WayForPay API' }
  }
}
```

#### 步骤 3：WayForPay 处理退款

**新增文件**: `lib/wayforpay/refund.ts`

```typescript
import { generateSignature, WAYFORPAY_MERCHANT_ACCOUNT } from './server'

export interface RefundParams {
  orderReference: string
  amount: number
  currency: 'USD' | 'UAH' | 'EUR'
  comment: string
}

export async function callWayForPayRefund({
  orderReference,
  amount,
  currency,
  comment,
}: RefundParams) {
  // 1. 生成签名
  const signatureValues = [
    WAYFORPAY_MERCHANT_ACCOUNT,
    orderReference,
    amount,
    currency,
  ]
  const merchantSignature = generateSignature(signatureValues)

  // 2. 调用 WayForPay Refund API
  const response = await fetch('https://api.wayforpay.com/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionType: 'REFUND',
      merchantAccount: WAYFORPAY_MERCHANT_ACCOUNT,
      orderReference,
      amount,
      currency,
      comment,
      merchantSignature,
    }),
  })

  const data = await response.json()
  return data
}
```

#### 步骤 4：接收 WayForPay Webhook

**Webhook 会发送**：
- `transactionStatus: 'RefundInProcessing'` → 更新为 `refund_processing`
- `transactionStatus: 'Refunded'` → 更新为 `refunded` + 发送邮件通知

---

## 🗺️ 改进实施路线图

### Phase 1：数据库层面改进（优先级：高）

- [ ] 1.1 修改 `donations.donation_status` 字段类型，支持新状态
- [ ] 1.2 创建数据库迁移文件
- [ ] 1.3 更新 TypeScript 类型定义
- [ ] 1.4 测试现有捐赠记录兼容性

**预计工作量**: 2 小时

---

### Phase 2：WayForPay 集成增强（优先级：高）

- [ ] 2.1 补全 `WAYFORPAY_STATUS` 常量
- [ ] 2.2 增强 Webhook 处理逻辑
- [ ] 2.3 添加详细的状态转换日志
- [ ] 2.4 测试所有 Webhook 场景

**预计工作量**: 3 小时

---

### Phase 3：前端错误处理（优先级：中）

- [ ] 3.1 添加脚本加载失败处理
- [ ] 3.2 添加用户取消支付处理
- [ ] 3.3 创建 `markDonationFailed` Server Action
- [ ] 3.4 更新错误提示文案（i18n）

**预计工作量**: 2 小时

---

### Phase 4：退款流程完善（优先级：中）

- [ ] 4.1 创建 `lib/wayforpay/refund.ts`
- [ ] 4.2 添加 `processRefund` Server Action
- [ ] 4.3 管理员界面添加"执行退款"按钮
- [ ] 4.4 添加退款成功邮件通知
- [ ] 4.5 测试完整退款流程

**预计工作量**: 4 小时

---

### Phase 5：监控和清理（优先级：低）

- [ ] 5.1 添加定时任务清理长时间 pending 订单
- [ ] 5.2 添加管理员仪表盘统计各状态订单数
- [ ] 5.3 添加异常订单告警
- [ ] 5.4 创建运维文档

**预计工作量**: 3 小时

---

## 📚 参考资料

- [WayForPay 官方文档](https://wiki.wayforpay.com/en)
- [WayForPay Payment API](https://wiki.wayforpay.com/en/view/852102)
- [WayForPay Refund API](https://wiki.wayforpay.com/en/view/852115)
- [WayForPay Response Codes](https://wiki.wayforpay.com/en/view/852131)

---

**文档维护者**: 开发团队
**下次更新时间**: 实施改进后
