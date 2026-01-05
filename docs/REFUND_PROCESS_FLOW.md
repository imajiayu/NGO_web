# 退款流程完整梳理

> 详细说明 NGO 平台的退款逻辑，包括金额计算、状态转换、API 集成和数据库触发器

**文档版本**: 1.1.0
**最后更新**: 2026-01-05
**相关文件**: 38+ 个迁移文件，多个核心业务模块

---

## 🎉 最新优化 (v1.1.0)

### ✅ 优化 1: 智能退款金额计算

**问题**: 之前退款计算订单内所有捐赠金额，包括已完成（`completed`）的捐赠

**解决方案**: 只计算可退款状态的捐赠金额

```typescript
// 优化前
const totalOrderAmount = orderDonations.reduce((sum, d) => sum + Number(d.amount), 0)

// 优化后
const refundableDonations = orderDonations.filter(d =>
  d.donation_status && ['paid', 'confirmed', 'delivering'].includes(d.donation_status)
)
const totalOrderAmount = refundableDonations.reduce((sum, d) => sum + Number(d.amount), 0)
```

**好处**:
- ✅ 支持部分完成订单的退款
- ✅ 只退款未完成的捐赠金额
- ✅ 避免退款已配送完成的物资

**示例场景**:
```
订单 #ABC123:
├─ Donation 1: $50, status=completed (已配送)
├─ Donation 2: $50, status=completed (已配送)
├─ Donation 3: $50, status=completed (已配送)
├─ Donation 4: $50, status=delivering (配送中)
└─ Donation 5: $50, status=delivering (配送中)

退款金额计算:
- 优化前: $250 (全部5个捐赠)
- 优化后: $100 (只有2个配送中的捐赠)
```

**相关文件**: `app/actions/track-donation.ts:185-196`

---

### ✅ 优化 2: 自动发送退款成功邮件

**问题**: Webhook 收到 `refunded` 状态后，没有自动发送邮件通知用户

**解决方案**: 在 Webhook 中添加退款成功邮件发送逻辑

```typescript
// 在 Webhook 中添加
if (newStatus === 'refunded' && updatedDonations && updatedDonations.length > 0) {
  const refundAmount = updatedDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0)

  await sendRefundSuccessEmail({
    to: firstDonation.donor_email,
    donorName: firstDonation.donor_name,
    projectNameI18n: project.project_name_i18n,
    donationIds: updatedDonations.map(d => d.donation_public_id),
    refundAmount,
    currency: body.currency,
    locale: firstDonation.locale,
  })
}
```

**好处**:
- ✅ 用户自动收到退款确认邮件
- ✅ 支持多语言（en/zh/ua）
- ✅ 包含退款金额和捐赠 ID
- ✅ 告知用户退款到账时间（5-10 个工作日）

**邮件内容** (中文示例):
```
主题: 您的退款已处理

尊敬的 [Name]：

您的退款申请已获批准并处理。

退款金额：$100 USD
捐赠编号：1-A1B2C3, 1-D4E5F6

退款金额将在 5-10 个工作日内退还至您的原支付方式。

感谢您的理解...
```

**相关文件**:
- `app/api/webhooks/wayforpay/route.ts:194-225`
- `lib/email/templates/transactional/refund-success/`

---

## 目录

1. [退款流程概览](#退款流程概览)
2. [退款金额计算逻辑](#退款金额计算逻辑)
3. [捐赠状态转换](#捐赠状态转换)
4. [前端触发流程](#前端触发流程)
5. [Server Action 处理](#server-action-处理)
6. [WayForPay API 集成](#wayforpay-api-集成)
7. [Webhook 回调处理](#webhook-回调处理)
8. [数据库触发器保护](#数据库触发器保护)
9. [邮件通知系统](#邮件通知系统)
10. [错误处理和边界情况](#错误处理和边界情况)
11. [完整流程图](#完整流程图)

---

## 1. 退款流程概览

### 核心设计原则

1. **订单级退款**: WayForPay 只能退款整个订单（不支持部分退款）
2. **批量更新**: 一个订单可能包含多个捐赠记录（物资项目），退款时需全部更新
3. **状态同步**: 数据库状态与 WayForPay 状态保持一致
4. **权限分离**: 管理员无权修改退款状态，只能由系统自动处理
5. **防重复**: 检查订单是否已有退款进行中，避免重复退款

### 退款适用场景

| 场景 | 可退款 | 说明 |
|------|--------|------|
| **支付成功** (`paid`) | ✅ | 款项已到账，可申请退款 |
| **已确认** (`confirmed`) | ✅ | NGO 已确认收款，可申请退款 |
| **配送中** (`delivering`) | ✅ | 物资采购/配送中，可申请退款 |
| **已完成** (`completed`) | ❌ | 配送完成，无法退款 |
| **待支付** (`pending`) | ❌ | 尚未支付，无需退款 |
| **支付失败** (`failed`/`expired`/`declined`) | ❌ | 支付未成功，无需退款 |
| **退款中** (`refunding`/`refund_processing`/`refunded`) | ❌ | 已在退款流程，防止重复 |

---

## 2. 退款金额计算逻辑

### 订单聚合计算

退款金额 = **订单内所有捐赠记录的总和**（无论项目类型）

```typescript
// 步骤 1: 获取订单的 order_reference
const { data: donationData } = await supabase
  .from('donations')
  .select('order_reference, currency')
  .eq('donation_public_id', donationPublicId)
  .single()

// 步骤 2: 查询该订单的所有捐赠记录
const { data: orderDonations } = await supabase
  .from('donations')
  .select('id, donation_public_id, amount, donation_status')
  .eq('order_reference', donationData.order_reference)

// 步骤 3: 计算订单总金额
const totalOrderAmount = orderDonations.reduce(
  (sum, d) => sum + Number(d.amount),
  0
)
```

### 示例场景

#### 物资项目（拆分模式）

**用户捐赠**: 10 个睡袋 × $50 = $500

**数据库记录**:
```
order_reference: WFP-20260105-ABC123
├─ donation_1: amount = $50 (1 个睡袋)
├─ donation_2: amount = $50 (1 个睡袋)
├─ ...
└─ donation_10: amount = $50 (1 个睡袋)

总计: 10 条记录
```

**退款金额计算**:
```javascript
totalOrderAmount = 50 + 50 + ... + 50 = $500
```

#### 打赏项目（聚合模式）

**用户捐赠**: $100 打赏

**数据库记录**:
```
order_reference: WFP-20260105-XYZ789
└─ donation_1: amount = $100 (单条聚合记录)

总计: 1 条记录
```

**退款金额计算**:
```javascript
totalOrderAmount = $100
```

#### 混合订单（多项目）

**用户一次性捐赠**:
- 项目 A（物资）: 5 个睡袋 × $50 = $250
- 项目 B（打赏）: $100 打赏

**数据库记录**:
```
order_reference: WFP-20260105-MIX456
├─ donation_1: project_id=A, amount=$50
├─ donation_2: project_id=A, amount=$50
├─ donation_3: project_id=A, amount=$50
├─ donation_4: project_id=A, amount=$50
├─ donation_5: project_id=A, amount=$50
└─ donation_6: project_id=B, amount=$100

总计: 6 条记录
```

**退款金额计算**:
```javascript
totalOrderAmount = (50×5) + 100 = $350
```

### 关键代码位置

**文件**: `app/actions/track-donation.ts:185-186`

```typescript
// Calculate total order amount (sum of all donations in this order)
const totalOrderAmount = orderDonations.reduce((sum, d) => sum + Number(d.amount), 0)
```

---

## 3. 捐赠状态转换

### 退款状态流转图

```
正常支付流程:
pending → processing → fraud_check → paid → confirmed → delivering → completed
                                       ↓
                                    退款入口
                                       ↓
                            ┌──────────┴──────────┐
                            ↓                     ↓
                    用户请求退款          管理员无权限
                            ↓                  (触发器阻止)
                      refunding
                            ↓
                 WayForPay API 处理
                            ↓
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
        refund_processing  refunded    Declined
        (处理中)          (成功)      (保持原状态)
              ↓
         WayForPay Webhook
              ↓
          refunded
         (最终状态)
```

### 15 个捐赠状态详解

| 状态 | 中文名 | 类型 | 可退款 | 说明 |
|------|--------|------|--------|------|
| `pending` | 待支付 | 支付前 | ❌ | 用户尚未完成支付 |
| `widget_load_failed` | 窗口加载失败 | 支付前 | ❌ | WayForPay 支付窗口加载失败 |
| `processing` | 处理中 | 支付中 | ❌ | 支付网关处理中 |
| `fraud_check` | 反欺诈审核 | 支付中 | ❌ | 反欺诈系统审核中 |
| `paid` | 已支付 | 支付完成 | ✅ | **可退款** - 款项已到账 |
| `confirmed` | 已确认 | 业务流程 | ✅ | **可退款** - NGO 已确认收款 |
| `delivering` | 配送中 | 业务流程 | ✅ | **可退款** - 物资采购/配送中 |
| `completed` | 已完成 | 业务流程 | ❌ | 配送完成，不可退款 |
| `expired` | 支付超时 | 支付失败 | ❌ | 用户未在规定时间内支付 |
| `declined` | 银行拒绝 | 支付失败 | ❌ | 银行拒绝交易 |
| `failed` | 其他失败 | 支付失败 | ❌ | 其他原因导致支付失败 |
| `refunding` | 退款中 | 退款流程 | ❌ | **系统专用** - 退款申请已提交 |
| `refund_processing` | 退款处理中 | 退款流程 | ❌ | **系统专用** - WayForPay 处理中 |
| `refunded` | 已退款 | 退款流程 | ❌ | **系统专用** - 退款完成 |

### 状态转换权限

| 角色 | 允许的状态转换 | 禁止的转换 |
|------|---------------|-----------|
| **匿名用户** | `pending` → `widget_load_failed` | 其他所有转换 |
| **管理员** | `paid` → `confirmed`<br>`confirmed` → `delivering`<br>`delivering` → `completed` | 所有退款相关状态 |
| **服务角色**（Webhook）| 任意转换 | 无限制 |

### 退款状态特殊说明

**为什么管理员不能修改退款状态？**

1. **数据一致性**: 退款状态必须与 WayForPay 保持同步
2. **防止误操作**: 管理员手动修改可能导致资金与状态不一致
3. **审计追踪**: 所有退款操作必须通过 WayForPay API，有完整日志

**触发器保护**:

```sql
-- 文件: supabase/migrations/20251224120000_restrict_admin_status_updates.sql

IF auth.uid() IS NOT NULL THEN
  -- 管理员只能执行以下状态转换
  IF NOT (
    (OLD.donation_status = 'paid' AND NEW.donation_status = 'confirmed') OR
    (OLD.donation_status = 'confirmed' AND NEW.donation_status = 'delivering') OR
    (OLD.donation_status = 'delivering' AND NEW.donation_status = 'completed')
  ) THEN
    RAISE EXCEPTION 'Invalid status transition: % → %. Admins can only update: paid→confirmed, confirmed→delivering, delivering→completed. Refund statuses are handled automatically by WayForPay.',
      OLD.donation_status, NEW.donation_status;
  END IF;
END IF;
```

---

## 4. 前端触发流程

### 用户操作入口

**页面**: `/[locale]/track-donation`
**组件**: `app/[locale]/track-donation/track-donation-form.tsx`

### 退款按钮显示逻辑

```typescript
// 判断订单是否可以退款
const canRefund = orderDonations.some(d =>
  ['paid', 'confirmed', 'delivering'].includes(d.donation_status)
)

const isRefunding = orderDonations.some(d =>
  ['refunding', 'refund_processing', 'refunded'].includes(d.donation_status)
)

// 显示退款按钮的条件
if (canRefund && !isRefunding) {
  // 显示 "Request Refund" 按钮
}
```

### 退款确认对话框

```typescript
// 用户点击退款按钮
<button onClick={() => setConfirmRefundId(orderReference)}>
  {t('actions.requestRefund')}
</button>

// 确认对话框
{confirmRefundId === orderReference && (
  <div className="confirmation-modal">
    <p>Are you sure you want to refund ${refundableAmount}?</p>
    <button onClick={() => handleRequestRefund(orderReference)}>
      Confirm
    </button>
  </div>
)}
```

### 退款请求处理

```typescript
// 文件: app/[locale]/track-donation/track-donation-form.tsx:138-174

async function handleRequestRefund(orderReference: string) {
  setRefundingDonationId(orderReference)
  setError('')

  try {
    // 1. 获取该订单的任意一个 donation ID 用于验证
    const donation = donations?.find(d => d.order_reference === orderReference)
    if (!donation) {
      setError(t('errors.donationNotFound'))
      return
    }

    // 2. 调用 Server Action
    const result = await requestRefund({
      donationPublicId: donation.donation_public_id,
      email,
    })

    // 3. 处理结果
    if (result.error) {
      setError(t(`errors.${result.error}`))
    } else if (result.success) {
      // 4. 更新前端状态（订单内所有捐赠）
      const newStatus = (result as any).status || 'refund_processing'
      setDonations(prev =>
        prev ? prev.map(d =>
          d.order_reference === orderReference
            ? { ...d, donation_status: newStatus as DonationStatus }
            : d
        ) : null
      )
      setConfirmRefundId(null)
    }
  } catch (err) {
    setError(t('errors.serverError'))
  } finally {
    setRefundingDonationId(null)
  }
}
```

### 前端显示效果

**退款前**:
```
┌─────────────────────────────────────────────┐
│ Order #ABC123                               │
│ Status: Paid                                │
│ Amount: $500                                │
│ [Request Refund]                            │
└─────────────────────────────────────────────┘
```

**退款中**:
```
┌─────────────────────────────────────────────┐
│ Order #ABC123                               │
│ Status: Refund Processing                   │
│ Amount: $500                                │
│ [Refunding... ⏳]                           │
└─────────────────────────────────────────────┘
```

**退款完成**:
```
┌─────────────────────────────────────────────┐
│ Order #ABC123                               │
│ Status: Refunded ✓                          │
│ Amount: $500                                │
│ No actions available                        │
└─────────────────────────────────────────────┘
```

---

## 5. Server Action 处理

### 退款 Server Action 流程

**文件**: `app/actions/track-donation.ts:81-255`

```typescript
export async function requestRefund(data: {
  donationPublicId: string
  email: string
}) {
  // 【步骤 1】验证输入
  const validated = requestRefundSchema.parse(data)

  // 【步骤 2】验证所有权（防止未授权退款）
  const { data: donations } = await anonSupabase.rpc(
    'get_donations_by_email_verified',
    {
      p_email: validated.email,
      p_donation_id: validated.donationPublicId,
    }
  )

  if (!donations || donations.length === 0) {
    return { error: 'donationNotFound' }
  }

  // 【步骤 3】检查退款资格
  const donation = donations.find(d => d.donation_public_id === validated.donationPublicId)
  const status = donation.donation_status

  // 3.1 检查状态
  if (status === 'completed') {
    return { error: 'cannotRefundCompleted' }
  }

  if (['refunding', 'refund_processing', 'refunded'].includes(status)) {
    return { error: 'alreadyRefunding' }
  }

  if (['pending', 'failed', 'expired', 'declined'].includes(status)) {
    return { error: 'cannotRefundPending' }
  }

  if (!['paid', 'confirmed', 'delivering'].includes(status)) {
    return { error: 'invalidStatus' }
  }

  // 【步骤 4】获取订单信息
  const serviceSupabase = createServiceClient()

  const { data: donationData } = await serviceSupabase
    .from('donations')
    .select('order_reference, currency')
    .eq('donation_public_id', validated.donationPublicId)
    .single()

  // 【步骤 5】查询订单内所有捐赠记录
  const { data: orderDonations } = await serviceSupabase
    .from('donations')
    .select('id, donation_public_id, amount, donation_status')
    .eq('order_reference', donationData.order_reference)

  // 5.1 检查订单是否已有退款进行中
  const hasRefundInProgress = orderDonations.some(d =>
    ['refunding', 'refund_processing', 'refunded'].includes(d.donation_status)
  )

  if (hasRefundInProgress) {
    return { error: 'alreadyRefunding' }
  }

  // 【步骤 6】计算订单总金额
  const totalOrderAmount = orderDonations.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  )

  // 【步骤 7】调用 WayForPay 退款 API
  try {
    const wayforpayResponse = await processWayForPayRefund({
      orderReference: donationData.order_reference,
      amount: totalOrderAmount,  // ← 完整订单金额
      currency: donationData.currency || 'USD',
      comment: `Full order refund requested by user (donation ID: ${validated.donationPublicId}, order: ${donationData.order_reference})`,
    })

    // 【步骤 8】映射 WayForPay 状态到数据库状态
    let newStatus: string

    switch (wayforpayResponse.transactionStatus) {
      case 'Refunded':
        newStatus = 'refunded'
        break
      case 'RefundInProcessing':
        newStatus = 'refund_processing'
        break
      case 'Voided':
        newStatus = 'refunded'  // Voided = 预授权取消，等同于退款
        break
      case 'Declined':
        return { error: 'refundDeclined', message: wayforpayResponse.reason }
      default:
        newStatus = 'refund_processing'
    }

    // 【步骤 9】更新订单内所有捐赠的状态
    const donationIds = orderDonations.map(d => d.id)

    await serviceSupabase
      .from('donations')
      .update({
        donation_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .in('id', donationIds)

    // 【步骤 10】返回成功结果
    return {
      success: true,
      status: newStatus,
      affectedDonations: orderDonations.length,  // 受影响的捐赠数量
      totalAmount: totalOrderAmount
    }

  } catch (wayforpayError: any) {
    console.error('WayForPay refund API error:', wayforpayError)
    return {
      error: 'refundApiError',
      message: wayforpayError.message || 'Failed to process refund with payment provider'
    }
  }
}
```

### 关键安全机制

1. **双重验证**:
   - 邮箱 + 捐赠 ID 验证所有权
   - 数据库函数 `get_donations_by_email_verified()` 防止枚举攻击

2. **订单级检查**:
   - 查询订单内所有捐赠记录
   - 确保没有重复退款

3. **批量更新**:
   - 使用 `.in('id', donationIds)` 批量更新
   - 确保订单内所有捐赠状态一致

4. **服务角色客户端**:
   - 使用 `createServiceClient()` 绕过 RLS
   - 允许系统自动更新状态

---

## 6. WayForPay API 集成

### 退款 API 调用

**文件**: `lib/wayforpay/server.ts:280-321`

```typescript
export async function processWayForPayRefund({
  orderReference,
  amount,
  currency = 'UAH',
  comment,
}: {
  orderReference: string
  amount: number
  currency?: 'UAH' | 'USD' | 'EUR'
  comment: string
}): Promise<WayForPayRefundResponse> {

  // 1. 创建退款请求参数
  const refundParams = createWayForPayRefund({
    orderReference,
    amount,
    currency,
    comment,
  })

  // 2. 调用 WayForPay API
  const response = await fetch('https://api.wayforpay.com/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(refundParams),
  })

  if (!response.ok) {
    throw new Error(`WayForPay API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as WayForPayRefundResponse

  // 3. 验证响应签名
  if (data.merchantSignature) {
    const isValid = verifyRefundResponseSignature(data, data.merchantSignature)
    if (!isValid) {
      throw new Error('Invalid refund response signature')
    }
  }

  return data
}
```

### 退款请求参数构建

```typescript
export function createWayForPayRefund({
  orderReference,
  amount,
  currency = 'UAH',
  comment,
}: {
  orderReference: string
  amount: number
  currency?: 'UAH' | 'USD' | 'EUR'
  comment: string
}): WayForPayRefundParams {

  // 生成 HMAC-MD5 签名
  // 签名字段顺序: merchantAccount;orderReference;amount;currency
  const signatureValues = [
    WAYFORPAY_MERCHANT_ACCOUNT,
    orderReference,
    amount,
    currency,
  ]

  const merchantSignature = generateSignature(signatureValues)

  return {
    transactionType: 'REFUND',
    merchantAccount: WAYFORPAY_MERCHANT_ACCOUNT,
    orderReference,
    amount,
    currency,
    comment,
    merchantSignature,
  }
}
```

### 退款响应类型

```typescript
export interface WayForPayRefundResponse {
  merchantAccount: string
  orderReference: string
  transactionStatus: 'Refunded' | 'Voided' | 'Declined' | 'RefundInProcessing'
  reason?: string
  reasonCode: number
  merchantSignature?: string
}
```

### WayForPay 退款状态映射

| WayForPay 状态 | 数据库状态 | 说明 |
|---------------|-----------|------|
| `Refunded` | `refunded` | 退款成功完成 |
| `Voided` | `refunded` | 预授权取消（等同于退款） |
| `RefundInProcessing` | `refund_processing` | 退款处理中（等待商户余额） |
| `Declined` | 保持原状态 | 退款被拒绝（返回错误） |

### 签名验证

**生成签名（请求）**:

```typescript
function generateSignature(values: (string | number)[]): string {
  const signString = values.join(';')
  return crypto.createHmac('md5', WAYFORPAY_SECRET_KEY).update(signString).digest('hex')
}

// 退款请求签名
const signatureValues = [
  merchantAccount,     // 商户账号
  orderReference,      // 订单号
  amount,              // 退款金额
  currency,            // 币种
]
```

**验证签名（响应）**:

```typescript
export function verifyRefundResponseSignature(
  data: WayForPayRefundResponse,
  receivedSignature: string
): boolean {
  // 签名字段顺序: merchantAccount;orderReference;transactionStatus;reasonCode
  const signatureValues = [
    data.merchantAccount,
    data.orderReference,
    data.transactionStatus,
    data.reasonCode,
  ]

  const calculatedSignature = generateSignature(signatureValues)
  return calculatedSignature === receivedSignature
}
```

---

## 7. Webhook 回调处理

### Webhook 接收退款通知

**文件**: `app/api/webhooks/wayforpay/route.ts`

```typescript
export async function POST(req: Request) {
  const body = await req.json()
  const transactionStatus = body.transactionStatus
  const orderReference = body.orderReference

  // 1. 验证签名
  if (!verifyWayForPaySignature(body, body.merchantSignature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 2. 查询订单的所有捐赠记录
  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('order_reference', orderReference)

  // 3. 判断是否为退款 Webhook
  const isRefundWebhook = [
    WAYFORPAY_STATUS.REFUNDED,
    WAYFORPAY_STATUS.REFUND_IN_PROCESSING,
    WAYFORPAY_STATUS.VOIDED
  ].includes(transactionStatus)

  // 4. 映射状态
  let newStatus: DonationStatus | null = null

  switch (transactionStatus) {
    case WAYFORPAY_STATUS.REFUNDED:
    case WAYFORPAY_STATUS.VOIDED:
      newStatus = 'refunded'
      console.log(`[WEBHOOK] Payment cancelled (${transactionStatus}) - funds returned`)
      break

    case WAYFORPAY_STATUS.REFUND_IN_PROCESSING:
      newStatus = 'refund_processing'
      console.log('[WEBHOOK] Refund being processed')
      break

    case WAYFORPAY_STATUS.DECLINED:
      // 区分支付拒绝 vs 退款拒绝
      const currentStatuses = donations.map(d => d.donation_status)
      const isRefundDeclined = currentStatuses.some(s =>
        ['paid', 'confirmed', 'delivering', 'refund_processing'].includes(s)
      )

      if (isRefundDeclined) {
        // 退款被拒绝 - 保持原状态
        console.log('[WEBHOOK] Refund declined - keeping original status')
        return respondWithAccept(orderReference)
      } else {
        // 支付被拒绝
        newStatus = 'declined'
      }
      break
  }

  // 5. 确定可转换的状态
  const transitionableStatuses: DonationStatus[] = isRefundWebhook
    ? ['paid', 'confirmed', 'delivering', 'refund_processing']  // 退款 Webhook
    : ['pending', 'processing', 'fraud_check', 'widget_load_failed']  // 支付 Webhook

  // 6. 过滤可更新的捐赠
  const updatableDonations = donations.filter(d =>
    transitionableStatuses.includes(d.donation_status as DonationStatus)
  )

  if (updatableDonations.length === 0) {
    console.log('[WEBHOOK] No donations in transitionable state - skipping')
    return respondWithAccept(orderReference)
  }

  // 7. 批量更新状态
  if (newStatus) {
    await supabase
      .from('donations')
      .update({ donation_status: newStatus })
      .eq('order_reference', orderReference)
      .in('donation_status', transitionableStatuses)

    console.log(`[WEBHOOK] Updated ${updatableDonations.length} donations: → ${newStatus}`)
  }

  // 8. TODO: 发送退款成功邮件（目前未实现）
  // if (newStatus === 'refunded') {
  //   await sendRefundSuccessEmail(...)
  // }

  return respondWithAccept(orderReference)
}
```

### Webhook 响应签名

```typescript
function respondWithAccept(orderReference: string) {
  const time = Math.floor(Date.now() / 1000)
  const signature = generateWebhookResponseSignature(orderReference, 'accept', time)
  return NextResponse.json({ orderReference, status: 'accept', time, signature })
}

// 签名字段顺序: orderReference;status;time
export function generateWebhookResponseSignature(
  orderReference: string,
  status: 'accept' | 'decline',
  time: number
): string {
  const signatureValues = [orderReference, status, time]
  return generateSignature(signatureValues)
}
```

### Webhook 安全机制

1. **签名验证**:
   - 验证所有 Webhook 请求的签名
   - 防止伪造退款通知

2. **状态过滤**:
   - 只更新处于可转换状态的捐赠
   - 防止状态错乱

3. **幂等性**:
   - 重复的 Webhook 请求不会重复更新
   - 通过状态过滤实现

4. **服务角色**:
   - 使用 `createServiceClient()` 绕过 RLS
   - Webhook 不受管理员权限限制

---

## 8. 数据库触发器保护

### 不可变字段保护

**文件**: `supabase/migrations/20251224120000_restrict_admin_status_updates.sql`

```sql
CREATE OR REPLACE FUNCTION prevent_donation_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 保护不可变字段
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot modify donation id';
  END IF;

  IF OLD.donation_public_id != NEW.donation_public_id THEN
    RAISE EXCEPTION 'Cannot modify donation_public_id';
  END IF;

  IF OLD.project_id != NEW.project_id THEN
    RAISE EXCEPTION 'Cannot modify project_id';
  END IF;

  IF OLD.donor_name != NEW.donor_name THEN
    RAISE EXCEPTION 'Cannot modify donor_name';
  END IF;

  IF OLD.donor_email != NEW.donor_email THEN
    RAISE EXCEPTION 'Cannot modify donor_email';
  END IF;

  IF OLD.amount != NEW.amount THEN
    RAISE EXCEPTION 'Cannot modify amount';
  END IF;

  IF OLD.order_reference != NEW.order_reference THEN
    RAISE EXCEPTION 'Cannot modify order_reference';
  END IF;

  IF OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;

  -- 【关键】验证状态转换
  IF OLD.donation_status != NEW.donation_status THEN
    -- 检查是否由管理员发起
    IF auth.uid() IS NOT NULL THEN
      -- 管理员只能执行 3 个业务流程转换
      IF NOT (
        (OLD.donation_status = 'paid' AND NEW.donation_status = 'confirmed') OR
        (OLD.donation_status = 'confirmed' AND NEW.donation_status = 'delivering') OR
        (OLD.donation_status = 'delivering' AND NEW.donation_status = 'completed')
      ) THEN
        RAISE EXCEPTION 'Invalid status transition: % → %. Admins can only update: paid→confirmed, confirmed→delivering, delivering→completed. Refund statuses are handled automatically by WayForPay.',
          OLD.donation_status, NEW.donation_status;
      END IF;
    END IF;
    -- 如果是服务角色（auth.uid() IS NULL），允许任意状态转换
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 触发器应用

```sql
CREATE TRIGGER prevent_donation_immutable_fields_trigger
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION prevent_donation_immutable_fields();
```

### 状态转换验证逻辑

| 调用者 | `auth.uid()` | 状态转换限制 |
|--------|-------------|-------------|
| **管理员** | NOT NULL | 只能执行 3 个业务转换 |
| **服务角色** (Webhook/API) | NULL | 无限制，可执行任意转换 |
| **匿名用户** | NULL (RLS 会拦截) | 无法更新（RLS 策略拒绝） |

### 安全保障

1. **数据库级强制执行**:
   - 即使应用层绕过，触发器也会拦截
   - 最高级别的安全保护

2. **防止管理员误操作**:
   - 管理员无法手动修改退款状态
   - 防止资金与状态不一致

3. **审计日志**:
   - 所有状态转换由触发器记录
   - 便于追踪退款流程

---

## 9. 邮件通知系统

### 退款成功邮件模板

**文件**: `lib/email/templates/transactional/refund-success/content.ts`

```typescript
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
  // zh, ua 翻译...
}
```

### 邮件发送函数

**文件**: `lib/email/senders/refund-success.ts`

```typescript
export async function sendRefundSuccessEmail(params: RefundSuccessEmailParams) {
  const emailContent = generateRefundSuccessEmail(params)

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    if (error) {
      console.error('Error sending refund success email:', error)
      throw error
    }

    console.log('Refund success email sent successfully:', data?.id)
    return data
  } catch (error) {
    console.error('Failed to send refund success email:', error)
    throw error
  }
}
```

### ⚠️ 当前状态：邮件未集成

**问题**: Webhook 中未调用 `sendRefundSuccessEmail()`

**位置**: `app/api/webhooks/wayforpay/route.ts:192`

**建议修复**:

```typescript
// 在 Webhook 中添加邮件发送逻辑
if (newStatus === 'refunded' && updatedDonations && updatedDonations.length > 0) {
  try {
    const firstDonation = updatedDonations[0]

    await sendRefundSuccessEmail({
      to: firstDonation.donor_email,
      donorName: firstDonation.donor_name,
      refundAmount: totalOrderAmount,
      currency: body.currency,
      donationIds: updatedDonations.map(d => d.donation_public_id),
      locale: firstDonation.locale as 'en' | 'zh' | 'ua',
    })

    console.log('[WEBHOOK] Refund success email sent to', firstDonation.donor_email)
  } catch (emailError) {
    console.error('[WEBHOOK] Refund email failed:', emailError)
    // 邮件失败不影响 Webhook 成功
  }
}
```

---

## 10. 错误处理和边界情况

### 错误类型和处理

| 错误代码 | 说明 | 用户提示 | 处理方式 |
|---------|------|---------|---------|
| `donationNotFound` | 捐赠记录不存在或邮箱不匹配 | "找不到捐赠记录" | 防止枚举攻击，不透露具体原因 |
| `cannotRefundCompleted` | 已完成的捐赠无法退款 | "配送已完成，无法退款" | 提示用户联系客服 |
| `alreadyRefunding` | 订单已在退款流程中 | "退款正在处理中" | 防止重复退款 |
| `cannotRefundPending` | 待支付/失败状态无法退款 | "该捐赠无法退款" | 说明只有已支付的捐赠可退款 |
| `invalidStatus` | 状态不符合退款条件 | "当前状态无法退款" | 列出可退款的状态 |
| `refundDeclined` | WayForPay 拒绝退款 | "退款被拒绝：{原因}" | 显示 WayForPay 返回的原因 |
| `refundApiError` | WayForPay API 调用失败 | "退款请求失败，请稍后重试" | 记录错误日志，建议用户联系客服 |
| `serverError` | 服务器内部错误 | "服务器错误，请稍后重试" | 记录详细错误日志 |
| `validationError` | 输入验证失败 | "输入格式不正确" | 提示用户检查邮箱和捐赠 ID |

### 边界情况处理

#### 1. 订单部分完成的情况

**场景**: 订单中 5 个捐赠，3 个已完成，2 个配送中

**当前逻辑**:
```typescript
// 计算可退款金额（排除已完成的捐赠）
const refundableAmount = orderDonations
  .filter(d => ['paid', 'confirmed', 'delivering'].includes(d.donation_status))
  .reduce((sum, d) => sum + Number(d.amount), 0)
```

**问题**: WayForPay 只能退款整个订单，不支持部分退款

**建议**:
- 选项 1: 阻止部分完成订单的退款（返回错误提示）
- 选项 2: 允许退款，但在前端明确提示会退款全部金额

#### 2. 并发退款请求

**场景**: 用户快速点击多次"退款"按钮

**保护机制**:
```typescript
// 前端防抖
const [refundingDonationId, setRefundingDonationId] = useState<string | null>(null)

if (refundingDonationId === orderReference) {
  return // 防止重复请求
}

// 数据库检查
const hasRefundInProgress = orderDonations.some(d =>
  ['refunding', 'refund_processing', 'refunded'].includes(d.donation_status)
)
```

#### 3. Webhook 延迟到达

**场景**: Server Action 更新状态后，Webhook 很久后才到达

**处理逻辑**:
```typescript
// Webhook 中的状态过滤
const transitionableStatuses = ['paid', 'confirmed', 'delivering', 'refund_processing']

const updatableDonations = donations.filter(d =>
  transitionableStatuses.includes(d.donation_status)
)

if (updatableDonations.length === 0) {
  // 已经是最终状态，跳过更新
  return respondWithAccept(orderReference)
}
```

#### 4. WayForPay API 超时

**场景**: `processWayForPayRefund()` 调用超时

**处理**:
```typescript
try {
  const wayforpayResponse = await processWayForPayRefund({...})
} catch (wayforpayError: any) {
  console.error('WayForPay refund API error:', wayforpayError)
  return {
    error: 'refundApiError',
    message: wayforpayError.message || 'Failed to process refund with payment provider'
  }
}
```

**建议**: 添加超时重试机制

#### 5. 签名验证失败

**Webhook 场景**:
```typescript
if (!verifyWayForPaySignature(body, body.merchantSignature)) {
  console.error('[WEBHOOK] Invalid signature')
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
```

**API 响应场景**:
```typescript
if (data.merchantSignature) {
  const isValid = verifyRefundResponseSignature(data, data.merchantSignature)
  if (!isValid) {
    throw new Error('Invalid refund response signature')
  }
}
```

#### 6. 混合货币订单

**场景**: 订单中包含不同货币的捐赠（理论上不应该发生）

**当前逻辑**: 使用第一个捐赠的货币
```typescript
const { data: donationData } = await serviceSupabase
  .from('donations')
  .select('order_reference, currency')
  .eq('donation_public_id', validated.donationPublicId)
  .single()

// 使用该捐赠的货币
currency: donationData.currency || 'USD'
```

**建议**: 在订单创建时确保货币统一

---

## 11. 完整流程图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          退款完整流程图                                      │
└─────────────────────────────────────────────────────────────────────────────┘

【用户端】
┌──────────────┐
│ 用户访问      │
│ /track-donation │
└──────┬───────┘
       ↓
┌──────────────────────┐
│ 输入邮箱 + 捐赠ID     │
│ trackDonations()      │
└──────┬───────────────┘
       ↓
┌──────────────────────────────────────┐
│ 显示捐赠列表（按订单分组）            │
│ ✓ Order #ABC: $500 [Request Refund]  │
└──────┬───────────────────────────────┘
       ↓
┌──────────────┐
│ 用户点击退款  │
│ 确认对话框    │
└──────┬───────┘
       ↓
┌──────────────────────┐
│ handleRequestRefund() │
└──────┬───────────────┘
       ↓

【Server Action】
┌─────────────────────────────────────────────────────────┐
│ requestRefund() - app/actions/track-donation.ts         │
├─────────────────────────────────────────────────────────┤
│ 1. 验证输入 (Zod schema)                                │
│ 2. 验证所有权 (get_donations_by_email_verified)         │
│ 3. 检查退款资格:                                        │
│    ✗ completed → 返回 cannotRefundCompleted            │
│    ✗ refunding/refund_processing/refunded → 已退款     │
│    ✗ pending/failed/expired/declined → 无需退款        │
│    ✓ paid/confirmed/delivering → 可退款                │
│ 4. 查询订单的所有捐赠记录                               │
│ 5. 检查订单是否已有退款进行中                           │
│ 6. 计算订单总金额 (sum of all amounts)                 │
└─────────┬───────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│ processWayForPayRefund() - lib/wayforpay/server.ts      │
├─────────────────────────────────────────────────────────┤
│ 7. 生成退款请求参数:                                    │
│    • transactionType: 'REFUND'                          │
│    • orderReference: WFP-20260105-ABC123                │
│    • amount: 500 (订单总金额)                           │
│    • currency: USD                                      │
│    • merchantSignature: HMAC-MD5(...)                   │
│ 8. POST https://api.wayforpay.com/api                   │
│ 9. 验证响应签名                                         │
│ 10. 返回响应:                                           │
│     { transactionStatus: 'RefundInProcessing', ... }    │
└─────────┬───────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│ 映射状态 & 更新数据库                                    │
├─────────────────────────────────────────────────────────┤
│ 11. 映射 WayForPay 状态:                                │
│     Refunded → refunded                                 │
│     RefundInProcessing → refund_processing              │
│     Voided → refunded                                   │
│     Declined → 返回错误，保持原状态                      │
│ 12. 使用服务角色客户端批量更新:                         │
│     UPDATE donations                                    │
│     SET donation_status = 'refund_processing',          │
│         updated_at = NOW()                              │
│     WHERE order_reference = 'WFP-20260105-ABC123'       │
│       AND id IN (1, 2, 3, ...)                          │
│ 13. 返回成功结果:                                       │
│     { success: true, status: 'refund_processing',       │
│       affectedDonations: 10, totalAmount: 500 }         │
└─────────┬───────────────────────────────────────────────┘
          ↓
【前端更新】
┌──────────────────────────────────────────────────────┐
│ 更新前端状态                                          │
│ Order #ABC: $500 [Refunding... ⏳]                   │
│ Status: Refund Processing                             │
└───────────────────────────────────────────────────────┘
          ↓
          ↓ (几秒后...)
          ↓

【WayForPay Webhook】
┌─────────────────────────────────────────────────────────┐
│ POST /api/webhooks/wayforpay                            │
├─────────────────────────────────────────────────────────┤
│ Body: {                                                 │
│   merchantAccount: "xxx",                               │
│   orderReference: "WFP-20260105-ABC123",                │
│   transactionStatus: "Refunded",                        │
│   merchantSignature: "...",                             │
│   amount: 500,                                          │
│   currency: "USD"                                       │
│ }                                                       │
└─────────┬───────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│ Webhook 处理 - app/api/webhooks/wayforpay/route.ts     │
├─────────────────────────────────────────────────────────┤
│ 1. 验证签名 (verifyWayForPaySignature)                  │
│ 2. 查询订单的所有捐赠记录                               │
│ 3. 判断 Webhook 类型 (退款 vs 支付)                    │
│ 4. 映射状态: Refunded → refunded                       │
│ 5. 确定可转换状态:                                      │
│    transitionableStatuses = [                           │
│      'paid', 'confirmed', 'delivering',                 │
│      'refund_processing'                                │
│    ]                                                    │
│ 6. 过滤可更新的捐赠                                     │
│ 7. 批量更新状态:                                        │
│    UPDATE donations                                     │
│    SET donation_status = 'refunded'                     │
│    WHERE order_reference = '...'                        │
│      AND donation_status IN (...)                       │
│ 8. TODO: 发送退款成功邮件 ⚠️ 未实现                    │
│ 9. 返回确认响应:                                        │
│    { orderReference, status: 'accept',                  │
│      time: xxx, signature: '...' }                      │
└─────────────────────────────────────────────────────────┘
          ↓

【数据库触发器】
┌─────────────────────────────────────────────────────────┐
│ prevent_donation_immutable_fields()                     │
├─────────────────────────────────────────────────────────┤
│ • 检查调用者: auth.uid() IS NULL (服务角色)             │
│ • 允许任意状态转换 ✓                                    │
│ • 如果是管理员 (auth.uid() IS NOT NULL):                │
│   只允许: paid→confirmed, confirmed→delivering,         │
│            delivering→completed                         │
│   退款状态转换 → RAISE EXCEPTION ✗                      │
└─────────────────────────────────────────────────────────┘
          ↓

【最终状态】
┌──────────────────────────────────────────────────────┐
│ 数据库状态                                            │
│ ┌────┬──────────┬────────┬────────┐                 │
│ │ ID │ Order    │ Status │ Amount │                 │
│ ├────┼──────────┼────────┼────────┤                 │
│ │  1 │ WFP-ABC  │refunded│   $50  │                 │
│ │  2 │ WFP-ABC  │refunded│   $50  │                 │
│ │... │ ...      │ ...    │  ...   │                 │
│ │ 10 │ WFP-ABC  │refunded│   $50  │                 │
│ └────┴──────────┴────────┴────────┘                 │
│ 总计: 10 条记录，全部 refunded                        │
└───────────────────────────────────────────────────────┘
          ↓
┌──────────────────────────────────────────────────────┐
│ 用户查看（前端轮询/实时更新）                         │
│ Order #ABC: $500 [Refunded ✓]                        │
│ Status: Refunded                                      │
│ Expected return date: 5-10 business days              │
└───────────────────────────────────────────────────────┘
          ↓
┌──────────────────────────────────────────────────────┐
│ 邮件通知 ⚠️ 待实现                                    │
│ Subject: Your Refund Has Been Processed               │
│ "Dear [Name], your $500 refund has been approved..."  │
└───────────────────────────────────────────────────────┘
```

---

## 总结

### 关键要点

1. **订单级退款**: WayForPay 只能退款整个订单，所以需要聚合所有捐赠金额
2. **批量更新**: 一个订单的所有捐赠记录必须同时更新状态
3. **双客户端**: 用户验证用匿名客户端，系统更新用服务角色客户端
4. **触发器保护**: 管理员无法修改退款状态，防止数据不一致
5. **签名验证**: 所有 WayForPay 交互都需要验证 HMAC-MD5 签名
6. **状态同步**: Server Action 立即更新，Webhook 异步确认

### 待优化项

1. ✅ **已实现**: 退款金额计算、状态转换、API 集成
2. ✅ **已实现**: 触发器保护、签名验证
3. ✅ **已实现** (v1.1.0): Webhook 中发送退款成功邮件
4. ✅ **已实现** (v1.1.0): 部分完成订单的退款处理（智能过滤可退款捐赠）
5. ⚠️ **待优化**: 退款 API 超时重试机制
6. ⚠️ **待优化**: 前端实时显示退款进度（WebSocket 或轮询）

### 相关文件清单

**Server Actions**:
- `app/actions/track-donation.ts` (退款逻辑)

**API Routes**:
- `app/api/webhooks/wayforpay/route.ts` (Webhook 处理)

**WayForPay 集成**:
- `lib/wayforpay/server.ts` (API 调用和签名)

**数据库迁移**:
- `supabase/migrations/20251224120000_restrict_admin_status_updates.sql` (触发器)

**邮件模板**:
- `lib/email/templates/transactional/refund-success/` (退款成功邮件)
- `lib/email/senders/refund-success.ts` (邮件发送)

**前端组件**:
- `app/[locale]/track-donation/track-donation-form.tsx` (退款按钮和逻辑)

---

**文档版本**: 1.1.0
**维护者**: 开发团队
**最后审查**: 2026-01-05

## 版本历史

**v1.1.0** (2026-01-05)
- ✅ 优化 1: 智能退款金额计算（只计算可退款状态的捐赠）
- ✅ 优化 2: 自动发送退款成功邮件

**v1.0.0** (2026-01-05)
- 初始版本：完整退款流程文档
