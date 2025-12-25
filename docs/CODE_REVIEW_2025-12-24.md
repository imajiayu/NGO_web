# 代码审查报告 - WayForPay 支付流程优化

**审查日期**: 2025-12-24
**审查范围**: 支付流程增强、状态管理优化、退款功能实现
**文件变更**: 18个文件修改, 5个新文件

---

## 📋 执行摘要

本次改动实现了 WayForPay 支付流程的全面优化,主要包括:

✅ **16个捐赠状态**(原8个) - 覆盖所有支付场景
✅ **完整的退款流程** - WayForPay API 集成
✅ **前端错误追踪** - widget_load_failed, user_cancelled
✅ **管理员权限细化** - 数据库触发器强制执行
✅ **订单分组显示** - 改善用户体验

---

## 🎯 核心改动分析

### 1. 数据库层改动

#### 1.1 新增捐赠状态 (16个)

**文件**: `supabase/migrations/20251224000000_add_donation_status_constraints.sql`

```sql
-- 支付前 (Pre-payment)
'pending'              -- 待支付(订单已创建)
'widget_load_failed'   -- 支付窗口加载失败
'user_cancelled'       -- 用户取消支付

-- 支付中 (Processing)
'processing'           -- 支付处理中 (WayForPay inProcessing)
'fraud_check'          -- 反欺诈审核中 (WayForPay Pending)

-- 支付完成 (Payment Complete)
'paid'                 -- 已支付
'confirmed'            -- 已确认
'delivering'           -- 配送中
'completed'            -- 已完成

-- 支付失败 (Payment Failed)
'expired'              -- 支付超时 (WayForPay Expired)
'declined'             -- 银行拒绝 (WayForPay Declined)
'failed'               -- 其他失败

-- 退款 (Refund)
'refunding'            -- 退款申请中
'refund_processing'    -- 退款处理中 (WayForPay RefundInProcessing)
'refunded'             -- 已退款 (包含 Refunded 和 Voided)
```

**设计决策**:
- ✅ **Voided vs Refunded 统一处理**: 虽然技术实现不同,但从用户角度都是"钱回来了"
- ✅ **CHECK 约束强制执行**: 数据库级别保证状态值合法
- ✅ **完整性验证**: 迁移前检查现有数据

**安全特性**:
```sql
-- 数据完整性检查
SELECT COUNT(*), STRING_AGG(DISTINCT donation_status, ', ')
FROM donations
WHERE donation_status NOT IN (/* 16个合法状态 */);
```

---

#### 1.2 管理员权限限制

**文件**: `supabase/migrations/20251224120000_restrict_admin_status_updates.sql`

**核心逻辑**:
```sql
-- 管理员(authenticated用户)只能执行业务状态转换
IF auth.uid() IS NOT NULL THEN
  -- 允许的转换:
  -- paid → confirmed
  -- confirmed → delivering
  -- delivering → completed

  -- 禁止的转换:
  -- 任何退款相关状态 (由 WayForPay API 自动处理)
  -- pending → paid (由 Webhook 处理)
END IF;

-- 服务角色(auth.uid() IS NULL)可以执行任意状态转换
-- 用于 Webhook 和系统级操作
```

**安全机制**:
- 🔒 **数据库级强制执行** - 即使应用层绕过也无效
- 🔒 **防止管理员意外修改退款状态** - 保持与 WayForPay 一致性
- 🔒 **服务角色特权** - Webhook 等系统操作不受限制

**潜在风险**:
⚠️ **依赖 `auth.uid()` 判断** - 需要确保服务角色调用时确实没有 auth context

---

#### 1.3 追踪函数增强

**文件**: `supabase/migrations/20251224130000_add_order_reference_to_track_function.sql`

**改动内容**:
```sql
-- 添加 order_reference 字段到返回结果
RETURNS TABLE (
  -- ... 其他字段
  order_reference VARCHAR(255),  -- ✨ NEW
  -- ... 其他字段
)
```

**用途**: 前端可以按订单分组显示捐赠

**潜在问题**:
⚠️ `DROP FUNCTION IF EXISTS` 会删除所有重载版本,可能影响其他依赖(实际上这个函数无重载,风险低)

---

### 2. WayForPay 集成增强

#### 2.1 支付状态映射

**文件**: `lib/wayforpay/server.ts`

**新增常量**:
```typescript
export const WAYFORPAY_STATUS = {
  // Success
  APPROVED: 'Approved',

  // Processing
  IN_PROCESSING: 'inProcessing',        // ✨ NEW
  WAITING_AUTH_COMPLETE: 'WaitingAuthComplete', // ✨ NEW
  PENDING: 'Pending',

  // Failed
  DECLINED: 'Declined',
  EXPIRED: 'Expired',                    // ✨ NEW

  // Refund
  REFUND_IN_PROCESSING: 'RefundInProcessing',
  REFUNDED: 'Refunded',
  VOIDED: 'Voided',                      // ✨ NEW
} as const
```

**完整的 Webhook 处理**:
```typescript
// app/api/webhooks/wayforpay/route.ts
switch (transactionStatus) {
  case WAYFORPAY_STATUS.APPROVED:
  case WAYFORPAY_STATUS.WAITING_AUTH_COMPLETE:
    newStatus = 'paid'
    shouldSendEmail = true
    break

  case WAYFORPAY_STATUS.PENDING:
    newStatus = 'fraud_check'  // ✨ 区分反欺诈审核
    break

  case WAYFORPAY_STATUS.DECLINED:
    // 🚨 智能区分: 支付被拒绝 vs 退款被拒绝
    const isRefundDeclined = currentStatuses.some(s =>
      ['paid', 'confirmed', 'delivering', 'refund_processing'].includes(s)
    )
    newStatus = isRefundDeclined ? null : 'declined'  // 退款被拒绝保持原状态
    break

  case WAYFORPAY_STATUS.REFUNDED:
  case WAYFORPAY_STATUS.VOIDED:
    newStatus = 'refunded'  // 统一处理
    break
}
```

**设计亮点**:
✅ **智能 DECLINED 处理** - 根据当前状态判断是支付还是退款被拒绝
✅ **状态转换保护** - 根据 Webhook 类型确定可转换状态
✅ **邮件发送控制** - 只在 APPROVED 和 WAITING_AUTH_COMPLETE 时发送

---

#### 2.2 退款 API 集成

**新增功能**:
```typescript
// lib/wayforpay/server.ts

// 1. 创建退款请求
export function createWayForPayRefund({
  orderReference,
  amount,
  currency,
  comment,
}): WayForPayRefundParams

// 2. 验证退款响应签名
export function verifyRefundResponseSignature(
  data: WayForPayRefundResponse,
  receivedSignature: string
): boolean

// 3. 调用 WayForPay API 处理退款
export async function processWayForPayRefund({
  orderReference,
  amount,
  currency,
  comment,
}): Promise<WayForPayRefundResponse>
```

**签名生成**:
```typescript
// 签名字段顺序: merchantAccount;orderReference;amount;currency
const signatureValues = [
  WAYFORPAY_MERCHANT_ACCOUNT,
  orderReference,
  amount,
  currency,
]
const merchantSignature = generateSignature(signatureValues)
```

**API 响应处理**:
```typescript
const data = await response.json()

// 验证响应签名(如果提供)
if (data.merchantSignature) {
  const isValid = verifyRefundResponseSignature(data, data.merchantSignature)
  if (!isValid) {
    throw new Error('Invalid refund response signature')
  }
}

return data  // { transactionStatus: 'Refunded' | 'Voided' | 'Declined' | ... }
```

**潜在问题**:
⚠️ **签名验证跳过** - 如果响应没有 `merchantSignature`,会跳过验证。根据文档某些响应可能确实没有签名,但需要确认安全性

---

### 3. 前端错误处理增强

#### 3.1 支付小部件错误追踪

**文件**: `app/[locale]/donate/wayforpay-widget.tsx`

**场景 1: 脚本加载失败**
```typescript
// 设置15秒超时
scriptLoadTimeoutRef.current = setTimeout(() => {
  if (!scriptLoadedRef.current) {
    setError(t('errors.paymentLoadFailed'))
    setIsLoading(false)

    // ✨ 标记为 widget_load_failed
    markDonationFailed(paymentParams.orderReference, 'widget_load_failed')
      .catch(err => console.error('[WIDGET] Failed to mark as widget_load_failed:', err))
  }
}, 15000)

// 脚本加载错误
script.onerror = () => {
  setError(t('errors.paymentLoadFailed'))
  markDonationFailed(paymentParams.orderReference, 'widget_load_failed')
    .catch(err => console.error('[WIDGET] Failed to mark as widget_load_failed:', err))
}
```

**场景 2: 用户取消支付**
```typescript
// WayForPay Pending callback
function (response: any) {
  if (response && response.orderReference) {
    // 用户完成了部分操作,重定向成功页
    window.location.href = paymentParams.returnUrl
  } else {
    // ✨ 用户直接关闭窗口,标记为 user_cancelled
    setError(tWidget('windowClosed'))

    markDonationFailed(paymentParams.orderReference, 'user_cancelled')
      .catch(err => console.error('[WIDGET] Failed to mark as user_cancelled:', err))
  }
}
```

**Server Action 实现**:
```typescript
// app/actions/donation.ts
export async function markDonationFailed(
  orderReference: string,
  reason: 'widget_load_failed' | 'user_cancelled'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAnonClient()  // 使用匿名客户端,依赖 RLS

  // 只更新 pending 状态的捐赠
  const { data, error } = await supabase
    .from('donations')
    .update({ donation_status: reason })
    .eq('order_reference', orderReference)
    .eq('donation_status', 'pending')
    .select()

  console.log(`[DONATION] Marked ${data?.length} donations as ${reason}`)
  return { success: true }
}
```

**潜在问题**:
⚠️ **错误处理缺失** - `markDonationFailed()` 失败时只 console.error,用户界面显示错误但数据库状态可能不正确
⚠️ **未检查 order_reference 存在性** - 如果 orderReference 不存在,会静默成功

**建议改进**:
```typescript
// 增强错误提示
markDonationFailed(orderReference, 'widget_load_failed')
  .then(result => {
    if (!result.success || result.error) {
      console.error('[WIDGET] Failed to update status:', result.error)
      // 显示额外提示: "支付窗口加载失败,订单状态可能未更新,请联系客服"
    }
  })
```

---

#### 3.2 订单分组显示

**文件**: `app/[locale]/track-donation/track-donation-form.tsx`

**核心逻辑**:
```typescript
// 按 order_reference 分组捐赠
const orderGroups = donations.reduce((acc, donation) => {
  const orderRef = donation.order_reference
  if (!acc[orderRef]) {
    acc[orderRef] = []
  }
  acc[orderRef].push(donation)
  return acc
}, {} as Record<string, typeof donations>)

// 计算显示金额(只统计成功状态)
const displayAmount = orderDonations
  .filter(d => ['paid', 'confirmed', 'delivering', 'completed'].includes(d.donation_status))
  .reduce((sum, d) => sum + Number(d.amount), 0)

// 计算可退款金额(不包含 completed)
const refundableAmount = orderDonations
  .filter(d => ['paid', 'confirmed', 'delivering'].includes(d.donation_status))
  .reduce((sum, d) => sum + Number(d.amount), 0)
```

**UI 改进**:
```tsx
{/* 订单卡片 */}
<div key={orderReference}>
  <h3>订单 #{orderReference.slice(-8)}</h3>

  {/* 订单详情 */}
  <div>订单号: {orderReference}</div>
  <div>数量: {orderDonations.length} units</div>
  <div>总金额: {displayAmount.toFixed(2)} USD</div>

  {/* 单个捐赠列表 */}
  {orderDonations.map(donation => (
    <div key={donation.id}>
      <code>{donation.donation_public_id}</code>
      <DonationStatusBadge status={donation.donation_status} />
      <Link href={`/donate?project=${donation.projects.id}`}>
        {projectName}
      </Link>
    </div>
  ))}

  {/* 操作按钮 */}
  {orderDonations.some(d => d.donation_status === 'completed') && (
    <button onClick={() => viewResult(...)}>查看结果</button>
  )}
  {refundableAmount > 0 && (
    <button onClick={() => requestRefund(...)}>申请退款</button>
  )}
</div>
```

**潜在问题**:
⚠️ **类型不安全** - line 86: `(result as any).status` 使用 any 类型

**建议改进**:
```typescript
// 定义完整的返回类型
interface RefundResult {
  success: boolean
  status?: DonationStatus
  affectedDonations?: number
  totalAmount?: number
  error?: string
  message?: string
}

const result = await requestRefund(...) as RefundResult
if (result.success && result.status) {
  const newStatus = result.status
  // ...
}
```

---

### 4. 退款流程实现

**文件**: `app/actions/track-donation.ts`

**完整流程**:
```typescript
export async function requestRefund(data: {
  donationPublicId: string
  email: string
}) {
  // 1️⃣ 验证所有权(使用数据库函数防止枚举攻击)
  const { data: donations } = await anonSupabase.rpc(
    'get_donations_by_email_verified',
    { p_email: email, p_donation_id: donationPublicId }
  )

  // 2️⃣ 验证退款资格
  const status = donation.donation_status
  if (status === 'completed') return { error: 'cannotRefundCompleted' }
  if (['refunding', 'refund_processing', 'refunded'].includes(status)) {
    return { error: 'alreadyRefunding' }
  }
  if (!['paid', 'confirmed', 'delivering'].includes(status)) {
    return { error: 'invalidStatus' }
  }

  // 3️⃣ 获取整个订单的所有捐赠
  const { data: orderDonations } = await serviceSupabase
    .from('donations')
    .select('*')
    .eq('order_reference', donationData.order_reference)

  // 检查订单中是否有退款中的捐赠
  const hasRefundInProgress = orderDonations.some(d =>
    ['refunding', 'refund_processing', 'refunded'].includes(d.donation_status)
  )
  if (hasRefundInProgress) return { error: 'alreadyRefunding' }

  // 计算订单总金额
  const totalOrderAmount = orderDonations.reduce((sum, d) => sum + Number(d.amount), 0)

  // 4️⃣ 调用 WayForPay 退款 API
  const wayforpayResponse = await processWayForPayRefund({
    orderReference: donationData.order_reference,
    amount: totalOrderAmount,  // ⚠️ 退款整个订单,不是单个捐赠
    currency: donationData.currency,
    comment: `Full order refund requested by user`,
  })

  // 5️⃣ 映射 WayForPay 状态到系统状态
  let newStatus: string
  switch (wayforpayResponse.transactionStatus) {
    case 'Refunded':
      newStatus = 'refunded'
      break
    case 'RefundInProcessing':
      newStatus = 'refund_processing'
      break
    case 'Voided':
      newStatus = 'refunded'  // 预授权取消,视为退款完成
      break
    case 'Declined':
      return { error: 'refundDeclined', message: wayforpayResponse.reason }
    default:
      newStatus = 'refund_processing'
  }

  // 6️⃣ 更新整个订单的所有捐赠状态
  const donationIds = orderDonations.map(d => d.id)
  await serviceSupabase
    .from('donations')
    .update({ donation_status: newStatus })
    .in('id', donationIds)

  return {
    success: true,
    status: newStatus,
    affectedDonations: orderDonations.length,
    totalAmount: totalOrderAmount
  }
}
```

**关键设计决策**:

1. **整个订单退款** - WayForPay 按订单退款,不支持部分退款
2. **双客户端验证** - 匿名客户端验证所有权 + 服务客户端更新状态
3. **状态检查多重防护** - 单个捐赠 + 整个订单都检查是否已退款
4. **Voided vs Refunded 统一处理** - 用户视角一致

**潜在问题**:

⚠️ **completed 状态退款限制** - 代码禁止 completed 退款,但业务上是否合理?
  → 文档说明:completed 后捐赠已送达,不能退款,需联系客服

⚠️ **网络错误处理** - WayForPay API 调用失败会抛出异常,但状态还未更新,安全
  → 实现正确,异常抛出前状态未改变

⚠️ **订单中部分捐赠已退款** - 如果订单中有些捐赠是 refunded,有些是 paid,如何处理?
  → 代码检查了 `hasRefundInProgress`,会阻止再次退款,逻辑正确

---

### 5. 管理员功能增强

#### 5.1 文件上传管理

**文件**: `app/actions/admin.ts`

**文件上传流程**:
```typescript
export async function uploadDonationResultFile(formData: FormData) {
  await requireAdmin()  // 验证管理员权限

  const file = formData.get('file') as File
  const donationId = parseInt(formData.get('donationId'))

  // 1️⃣ 获取 donation_public_id(用于文件路径)
  const { data: donation } = await supabase
    .from('donations')
    .select('donation_public_id')
    .eq('id', donationId)
    .single()

  // 2️⃣ 验证文件类型和大小
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
  if (!validTypes.includes(file.type)) throw new Error('Invalid file type')
  if (file.size > 50 * 1024 * 1024) throw new Error('File too large (max 50MB)')

  // 3️⃣ 生成文件路径
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${timestamp}.${fileExt}`
  const filePath = `${donation.donation_public_id}/${fileName}`

  // 4️⃣ 上传原始文件
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  await supabase.storage
    .from('donation-results')
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  // 5️⃣ 生成缩略图(仅图片)
  if (file.type.startsWith('image/')) {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, null, { withoutEnlargement: true, fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer()

      const thumbnailPath = `${donation.donation_public_id}/.thumbnails/${timestamp}_thumb.jpg`

      await supabase.storage
        .from('donation-results')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        })
    } catch (thumbnailError) {
      // 缩略图生成失败不影响主流程
      console.error('Failed to generate thumbnail:', thumbnailError)
    }
  }

  // 6️⃣ 返回公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('donation-results')
    .getPublicUrl(filePath)

  return { publicUrl, filePath, donationPublicId: donation.donation_public_id }
}
```

**存储结构**:
```
donation-results/
  {donation_public_id}/
    {timestamp}.jpg        # 原始文件
    {timestamp}.mp4        # 视频文件
    .thumbnails/
      {timestamp}_thumb.jpg # 缩略图(自动生成)
```

**安全特性**:
- ✅ **文件类型白名单** - 只允许图片和视频
- ✅ **大小限制** - 50MB 上限
- ✅ **路径隔离** - 每个捐赠独立文件夹
- ✅ **管理员认证** - 只有管理员可上传

**潜在问题**:
⚠️ **缩略图失败静默** - 缩略图生成失败只 console.error,用户不知道
  → 影响不大,缩略图是优化项,不影响核心功能

---

#### 5.2 状态更新验证

**文件**: `app/actions/admin.ts`

**状态转换逻辑**:
```typescript
export async function updateDonationStatus(id: number, newStatus: string) {
  await requireAdmin()

  // 1️⃣ 获取当前状态
  const { data: current } = await supabase
    .from('donations')
    .select('donation_status, donation_public_id')
    .eq('id', id)
    .single()

  // 2️⃣ 验证状态转换是否合法
  const validTransitions: Record<string, string[]> = {
    paid: ['confirmed'],
    confirmed: ['delivering'],
    delivering: ['completed'],
  }

  const currentStatus = current.donation_status
  const allowedNext = validTransitions[currentStatus] || []

  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
      `Admin can only modify: paid→confirmed, confirmed→delivering, delivering→completed. ` +
      `Refund statuses are handled automatically.`
    )
  }

  // 3️⃣ 如果是 delivering → completed,验证文件是否已上传
  if (currentStatus === 'delivering' && newStatus === 'completed') {
    const { data: files } = await supabase.storage
      .from('donation-results')
      .list(current.donation_public_id, { limit: 1 })

    if (!files || files.length === 0) {
      throw new Error('Please upload a result image/video before marking as completed')
    }
  }

  // 4️⃣ 更新状态(数据库触发器会再次验证)
  const { data } = await supabase
    .from('donations')
    .update({ donation_status: newStatus })
    .eq('id', id)
    .select()
    .single()

  revalidatePath('/admin/donations')
  return data
}
```

**双重验证**:
1. **应用层验证** - Server Action 检查状态转换
2. **数据库层验证** - 触发器强制执行(迁移文件 `20251224120000_*`)

**潜在问题**:
⚠️ **Race Condition** - 文件验证和状态更新之间有时间窗口,理论上文件可能被删除
  → 实际影响:极小,因为只有管理员能删除文件,且删除后立即可见
  → 建议:在一个事务中完成验证和更新(PostgreSQL 支持)

---

### 6. UI 组件改进

#### 6.1 统一状态徽章

**文件**: `components/donation/DonationStatusBadge.tsx`

**颜色映射**:
```typescript
const getStatusClasses = (status: DonationStatus): string => {
  switch (status) {
    // 支付前 - 黄色/灰色
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'widget_load_failed':
    case 'user_cancelled':
      return 'bg-gray-100 text-gray-700'

    // 处理中 - 蓝色/紫色
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'fraud_check':
      return 'bg-purple-100 text-purple-800'

    // 成功 - 绿色
    case 'paid':
    case 'confirmed':
    case 'completed':
      return 'bg-green-100 text-green-800'

    // 进行中 - 蓝色
    case 'delivering':
      return 'bg-blue-100 text-blue-700'

    // 失败 - 红色/灰色
    case 'expired':
      return 'bg-gray-100 text-gray-600'
    case 'declined':
    case 'failed':
      return 'bg-red-100 text-red-800'

    // 退款 - 橙色/灰色
    case 'refunding':
    case 'refund_processing':
      return 'bg-orange-100 text-orange-800'
    case 'refunded':
      return 'bg-gray-100 text-gray-700'

    default:
      return 'bg-gray-100 text-gray-700'
  }
}
```

**多 namespace 支持**:
```typescript
<DonationStatusBadge
  status="paid"
  namespace="trackDonation"  // 使用 trackDonation.status.paid
/>

<DonationStatusBadge
  status="completed"
  namespace="projectDonationList"  // 使用 projectDonationList.status.completed
/>
```

**潜在问题**:
⚠️ **未知状态处理** - default case 返回灰色,用户无法区分
  → 建议:在 default case 添加 console.warn,便于调试

---

#### 6.2 捐赠编辑模态框

**文件**: `components/admin/DonationEditModal.tsx`

**核心功能**:
1. **状态流程可视化** - 显示当前状态和可选择的下一步
2. **文件上传** - delivering → completed 时必须上传
3. **文件管理** - completed 状态可独立管理文件

**状态转换 UI**:
```tsx
<DonationStatusProgress
  currentStatus={currentStatus}
  selectedStatus={newStatus}
  onStatusSelect={setNewStatus}  // 点击下一状态
/>

{!newStatus && (
  <div>👆 点击进度条中的下一状态以继续</div>
)}

<button type="submit" disabled={!newStatus}>
  更新状态
</button>
```

**文件上传 UI**:
```tsx
{/* delivering → completed 时显示 */}
{needsFileUpload && (
  <div>
    <input
      type="file"
      accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime"
      onChange={handleFileChange}
      required
      multiple
    />
    {uploading && (
      <div>
        <span>上传中... {uploadProgress}%</span>
        <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
      </div>
    )}
  </div>
)}
```

**已完成状态文件管理**:
```tsx
{canManageFiles && (
  <div>
    {/* 显示已上传文件 */}
    {files.map(file => (
      <div key={file.path}>
        {isImage(file.contentType) && (
          <img src={file.publicUrl} alt={file.name} />
        )}
        {isVideo(file.contentType) && (
          <video src={file.publicUrl} controls />
        )}
        <button onClick={() => handleDeleteFile(file.path)}>
          删除
        </button>
      </div>
    ))}

    {/* 上传新文件 */}
    <input type="file" onChange={handleFileChange} multiple />
    <button onClick={handleUploadOnly}>
      上传 {filesToUpload.length} 个文件
    </button>
  </div>
)}
```

**潜在问题**:
⚠️ **进度条模拟** - Server Action 无法跟踪真实上传进度,使用模拟进度条
  → 影响:用户体验稍差,但不影响功能

---

## 🔍 潜在问题与风险

### 高优先级 ⚠️

#### 1. 前端错误处理缺失
**位置**: `app/[locale]/donate/wayforpay-widget.tsx:66-67, 86-87, 132-133`

**问题**:
```typescript
markDonationFailed(paymentParams.orderReference, 'widget_load_failed')
  .catch(err => console.error('[WIDGET] Failed to mark:', err))
  // ⚠️ 只打印错误,用户界面显示错误但数据库状态可能不正确
```

**建议修复**:
```typescript
markDonationFailed(orderReference, 'widget_load_failed')
  .then(result => {
    if (!result.success || result.error) {
      // 显示额外提示
      setError(prev =>
        `${prev}\n\n⚠️ 订单状态可能未更新,请保存订单号并联系客服: ${orderReference}`
      )
    }
  })
```

---

#### 2. 类型安全问题
**位置**: `app/[locale]/track-donation/track-donation-form.tsx:86`

**问题**:
```typescript
const newStatus = (result as any).status || 'refund_processing'
// ⚠️ 使用 any 类型,不安全
```

**建议修复**:
```typescript
interface RefundResult {
  success: boolean
  status?: DonationStatus
  affectedDonations?: number
  error?: string
}

const result = await requestRefund(...) as RefundResult
if (result.success && result.status) {
  const newStatus = result.status  // 类型安全
}
```

---

#### 3. Auth Context 依赖
**位置**: `supabase/migrations/20251224120000_restrict_admin_status_updates.sql:65`

**问题**:
```sql
IF auth.uid() IS NOT NULL THEN
  -- 管理员权限检查
END IF;
-- ⚠️ 依赖 auth.uid() 为 NULL 来判断服务角色
```

**风险**: 如果服务角色调用时 auth context 不为空,会被误认为管理员,受限于权限检查

**建议验证**:
```typescript
// 测试 Webhook 调用
const serviceSupabase = createServiceClient()
const { data, error } = await serviceSupabase
  .from('donations')
  .update({ donation_status: 'paid' })
  .eq('id', testId)

// 应该成功,如果失败说明 auth context 有问题
```

---

### 中优先级 ⚡

#### 4. 签名验证跳过
**位置**: `lib/wayforpay/server.ts:313-318`

**问题**:
```typescript
if (data.merchantSignature) {
  const isValid = verifyRefundResponseSignature(data, data.merchantSignature)
  if (!isValid) throw new Error('Invalid refund response signature')
}
// ⚠️ 如果没有 merchantSignature,跳过验证
```

**建议**: 查阅 WayForPay 文档确认哪些响应确实没有签名,添加注释说明

---

#### 5. 未知状态处理
**位置**: `components/donation/DonationStatusBadge.tsx:77-78`

**问题**:
```typescript
default:
  return `${baseClasses} bg-gray-100 text-gray-700`
  // ⚠️ 未知状态返回灰色,用户无法区分
```

**建议修复**:
```typescript
default:
  console.warn(`Unknown donation status: ${status}`)
  return `${baseClasses} bg-red-100 text-red-800`  // 使用红色警示
```

---

### 低优先级 💡

#### 6. 缩略图生成失败静默
**位置**: `app/actions/admin.ts:289-292`

**问题**:
```typescript
} catch (thumbnailError) {
  console.error('Failed to generate thumbnail:', thumbnailError)
  // ⚠️ 只打印错误,用户不知道缩略图失败
}
```

**影响**: 不影响核心功能,缩略图是优化项

---

#### 7. Race Condition
**位置**: `app/actions/admin.ts:175-183`

**问题**:
```typescript
// 检查文件是否存在
const { data: files } = await supabase.storage.list(...)
if (!files || files.length === 0) throw new Error('...')

// ⚠️ 时间窗口:文件可能在检查后、更新前被删除

// 更新状态
await supabase.from('donations').update({ donation_status: 'completed' })
```

**概率**: 极小(只有管理员能删除文件)
**影响**: completed 状态但无文件

**建议**: 使用 PostgreSQL 事务确保原子性(需要 Supabase Edge Functions 或自定义 SQL 函数)

---

## 📊 业务逻辑总结

### 状态转换矩阵

| 当前状态 | 可转换为 | 触发者 | 说明 |
|---------|---------|--------|------|
| `pending` | `widget_load_failed` | 前端 | 脚本加载失败 |
| `pending` | `user_cancelled` | 前端 | 用户关闭窗口 |
| `pending` | `processing` | Webhook | WayForPay 处理中 |
| `pending` | `fraud_check` | Webhook | 反欺诈审核 |
| `pending` | `paid` | Webhook | 支付成功 |
| `pending` | `declined` | Webhook | 银行拒绝 |
| `pending` | `expired` | Webhook | 支付超时 |
| `processing` | `paid` | Webhook | 处理完成 |
| `processing` | `declined` | Webhook | 处理失败 |
| `fraud_check` | `paid` | Webhook | 审核通过 |
| `fraud_check` | `declined` | Webhook | 审核不通过 |
| `paid` | `confirmed` | 管理员 | 人工确认 |
| `paid` | `refunding` | 用户 | 申请退款 |
| `confirmed` | `delivering` | 管理员 | 开始配送 |
| `confirmed` | `refunding` | 用户 | 申请退款 |
| `delivering` | `completed` | 管理员 | 配送完成(需上传文件) |
| `delivering` | `refunding` | 用户 | 申请退款 |
| `refunding` | `refund_processing` | WayForPay API | 退款处理中 |
| `refunding` | `refunded` | WayForPay API | 退款完成 |
| `refund_processing` | `refunded` | Webhook | 退款完成 |
| `refund_processing` | `paid/confirmed/delivering` | Webhook (Declined) | 退款被拒绝,保持原状态 |

### 退款规则

| 当前状态 | 可退款 | 退款范围 | 说明 |
|---------|--------|---------|------|
| `pending` | ❌ | - | 未支付,无需退款 |
| `widget_load_failed` | ❌ | - | 未支付 |
| `user_cancelled` | ❌ | - | 用户取消 |
| `processing` | ❌ | - | 处理中,等待结果 |
| `fraud_check` | ❌ | - | 审核中,等待结果 |
| `paid` | ✅ | 整个订单 | 已支付,可退款 |
| `confirmed` | ✅ | 整个订单 | 已确认,可退款 |
| `delivering` | ✅ | 整个订单 | 配送中,可退款 |
| `completed` | ❌ | - | 已完成,不可退款(需联系客服) |
| `expired` | ❌ | - | 已过期 |
| `declined` | ❌ | - | 已拒绝 |
| `failed` | ❌ | - | 已失败 |
| `refunding` | ❌ | - | 已在退款中 |
| `refund_processing` | ❌ | - | 退款处理中 |
| `refunded` | ❌ | - | 已退款 |

**关键规则**:
- 退款按**整个订单**处理,不支持部分退款
- 一个订单的所有捐赠同步更新状态
- `completed` 后不可退款(物资已送达)

---

## 🎨 UI 变动总结

### 1. 新增组件

| 组件 | 位置 | 用途 |
|------|------|------|
| `DonationStatusBadge` | `components/donation/` | 统一状态徽章显示 |

### 2. 重大 UI 改进

#### 追踪页面
**改动前**:
```
┌────────────────────────────┐
│ 捐赠列表                    │
├────────────────────────────┤
│ ID: 1-A1B2C3               │
│ 项目: Project A            │
│ 金额: $100                 │
│ 状态: paid                 │
├────────────────────────────┤
│ ID: 1-A1B2C4               │
│ 项目: Project A            │
│ 金额: $100                 │
│ 状态: paid                 │
└────────────────────────────┘
```

**改动后**:
```
┌────────────────────────────────────────────┐
│ 您的订单 (1)                               │
├────────────────────────────────────────────┤
│ 订单 #DONATE-1-1234567890-A1B2C3          │
│ ┌──────────────────────────────────────┐  │
│ │ 订单号: DONATE-1-...                 │  │
│ │ 数量: 2 units                        │  │
│ │ 总金额: USD 200.00                   │  │
│ │ 日期: 2025-12-24                    │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ 捐赠明细:                                  │
│ ┌──────────────────────────────────────┐  │
│ │ 1-A1B2C3 [已支付]                   │  │
│ │ Project A                            │  │
│ │ USD 100.00 | 2025-12-24             │  │
│ └──────────────────────────────────────┘  │
│ ┌──────────────────────────────────────┐  │
│ │ 1-A1B2C4 [已支付]                   │  │
│ │ Project A                            │  │
│ │ USD 100.00 | 2025-12-24             │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [查看结果] [申请退款]                      │
└────────────────────────────────────────────┘
```

#### 管理员编辑模态框
**新增功能**:
- ✅ 状态流程可视化进度条
- ✅ 文件预览和管理
- ✅ 缩略图显示
- ✅ 多文件上传
- ✅ 上传进度条
- ✅ 完整的捐赠信息展示

#### 支付小部件
**新增提示**:
- ✅ 网络错误提示
- ✅ 窗口关闭警告
- ✅ 弹窗拦截提示
- ✅ iOS 重定向说明
- ✅ 超时倒计时

---

## 📝 翻译更新

**新增翻译键** (所有语言: en/zh/ua):
```json
{
  "trackDonation": {
    "status": {
      "widget_load_failed": "...",
      "user_cancelled": "...",
      "processing": "...",
      "fraud_check": "...",
      "expired": "...",
      "declined": "...",
      "refund_processing": "..."
    },
    "errors": {
      "cannotRefundCompleted": "...",
      "alreadyRefunding": "...",
      "cannotRefundPending": "...",
      "invalidStatus": "...",
      "refundDeclined": "...",
      "refundApiError": "..."
    }
  },
  "wayforpayWidget": {
    "networkError": "...",
    "windowClosed": "...",
    "popupBlocked": "...",
    "redirecting": { ... }
  }
}
```

---

## ✅ 代码质量评价

### 优秀实践 👍

1. **完整的文档** - `PAYMENT_WORKFLOW.md` 详细记录所有状态和设计决策
2. **数据库约束** - CHECK 约束 + 触发器双重保护
3. **双客户端模式** - 匿名客户端(RLS) + 服务客户端(系统级)
4. **签名验证** - WayForPay 签名全面验证
5. **类型安全** - TypeScript 严格模式 + Zod 验证
6. **错误日志** - 完整的 console.log 追踪
7. **用户体验** - 订单分组、状态可视化、文件预览

### 需改进项 ⚠️

1. **前端错误处理** - markDonationFailed 失败时应显示更明确的提示
2. **类型安全** - 避免使用 `as any`
3. **未知状态处理** - 应使用警示色并记录日志
4. **签名验证** - 补充文档说明哪些响应无签名
5. **缩略图失败** - 应通知用户(可选)

---

## 🧪 测试建议

详见 `TEST_PLAN_2025-12-24.md`

---

## 📚 参考文档

- [PAYMENT_WORKFLOW.md](./PAYMENT_WORKFLOW.md) - 支付流程详细设计
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 数据库架构
- [CLAUDE.md](../CLAUDE.md) - 项目总体文档
- [WayForPay 官方文档](https://wiki.wayforpay.com/)

---

**审查人**: Claude (AI Code Reviewer)
**审查日期**: 2025-12-24
**文档版本**: 1.0
