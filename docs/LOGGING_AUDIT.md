# NGO_web 日志审计报告

> **生成日期**: 2026-01-13
> **总计日志调用**: 257 个
> **涉及文件**: 31 个

---

## 概览统计

### 按类型分布

| 类型 | 数量 | 占比 |
|------|------|------|
| `console.log()` | 184 | 71.6% |
| `console.error()` | 58 | 22.6% |
| `console.warn()` | 15 | 5.8% |

### 按环境分布

| 环境 | 数量 | 占比 |
|------|------|------|
| 服务端 (Server Actions, API Routes, Webhooks) | 220 | 85.6% |
| 客户端 (`'use client'` 组件) | 37 | 14.4% |

### 按必要性分布

| 级别 | 数量 | 占比 | 说明 |
|------|------|------|------|
| 🔴 **Critical (保留)** | 85 | 33% | 安全、支付、关键错误 |
| 🟡 **Useful (优化)** | 132 | 51% | 调试、审计、状态追踪 |
| 🟢 **Unnecessary (移除)** | 40 | 16% | 样板代码、冗余数据 |

---

## 详细文件清单

### 1. Payment Webhooks (高优先级保留)

#### `app/api/webhooks/wayforpay/route.ts` - 35 logs
**类型**: WayForPay 支付回调处理器

| 行号 | 类型 | 消息模板 | 上下文 | 必要性 |
|------|------|----------|--------|--------|
| 27 | log | `[WEBHOOK] Received: {status} for order {reference}` | Webhook 入口 | 🔴 Critical |
| 31 | error | `[WEBHOOK] Invalid signature` | 安全验证 | 🔴 Critical |
| 45 | error | `[WEBHOOK] Database error: {message}` | DB 失败 | 🔴 Critical |
| 51 | warn | `[WEBHOOK] Order not found: {reference}` | 缺失订单 | 🟡 Useful |
| 63-124 | log | 各种状态映射消息 | 状态追踪 | 🟡 Useful |
| 158-159 | error | `[WEBHOOK] Update failed` + `Manual intervention required` | DB 更新失败 | 🔴 Critical |
| 163 | log | `[WEBHOOK] Updated X donations: {old} → {new}` | 更新确认 | 🟡 Useful |
| 205, 238 | log | `Email sent to {email}` | 邮件追踪 | 🟡 Useful |
| 208, 241 | error | `Email failed: {error}` | 邮件失败 | 🟡 Useful |
| 250 | error | `[WEBHOOK] Unexpected error` | 捕获所有错误 | 🔴 Critical |

#### `app/api/webhooks/nowpayments/route.ts` - 35 logs
**类型**: NOWPayments 加密货币回调处理器

| 行号 | 类型 | 消息模板 | 上下文 | 必要性 |
|------|------|----------|--------|--------|
| 40-41 | log | `Received: {status}` + `Payment ID: {id}` | Webhook 入口 | 🔴 Critical |
| 45 | error | `Invalid signature` | 安全验证 | 🔴 Critical |
| 58 | error | `Database error` | DB 失败 | 🔴 Critical |
| 64, 71 | warn | `Order not found` / `Not a NOWPayments donation` | 数据问题 | 🟡 Useful |
| 82-130 | log | 状态映射消息 (waiting, confirming, finished 等) | 状态追踪 | 🟡 Useful |
| 166 | error | `Update failed` | DB 更新失败 | 🔴 Critical |
| 246 | error | `Unexpected error` | 捕获所有错误 | 🔴 Critical |

---

### 2. Server Actions

#### `app/actions/donation.ts` - 27 logs
**类型**: 捐赠创建和小部件失败处理

| 行号 | 类型 | 消息模板 | 必要性 | 建议操作 |
|------|------|----------|--------|----------|
| 241, 269, 299, 605, 632, 662 | error | `Error generating donation ID` | 🟡 Useful | 保留 |
| 327, 690 | error | `Failed to create pending donations` | 🔴 Critical | 保留 |
| 335, 698 | log | `Created X pending records` | 🟡 Useful | 优化格式 |
| 362, 708 | error | `Error creating payment` | 🔴 Critical | 保留 |
| 385 | log | `markDonationWidgetFailed called` | 🟡 Useful | 保留 |
| 391 | log | `Querying for pending donations...` | 🟢 Remove | **移除** |
| 402-403 | error | `Failed to mark as widget_load_failed` | 🟡 Useful | 保留 |
| 417-418 | log | `Successfully marked` + `Updated IDs` | 🟢 Remove | **合并为一条** |
| 422 | error | `Unexpected error` | 🔴 Critical | 保留 |
| 581 | error | `NOWPayments API error` | 🔴 Critical | 保留 |
| 751, 776 | error | `Failed to fetch currencies/minimum` | 🟡 Useful | 保留 |

#### `app/actions/donation-result.ts` - 28 logs ⚠️ 需大量清理
**类型**: 捐赠结果文件检索

| 行号 | 类型 | 消息模板 | 必要性 | 建议操作 |
|------|------|----------|--------|----------|
| 23 | log | `Starting for donation: {id}` | 🟢 Remove | **移除** |
| 27 | log | `Invalid donation ID` | 🟢 Remove | **移除** |
| 38 | log | `Donation query result: {result}` | 🟢 Remove | **移除** |
| 41 | log | `Donation not found` | 🟢 Remove | **移除** |
| 46 | log | `Donation not completed, status: {status}` | 🟡 Useful | 保留 |
| 51 | log | `Listing files in folder` | 🟢 Remove | **移除** |
| 60 | log | `Storage list result: {result}` | 🟢 Remove | **移除** |
| 63 | error | `Storage error: {error}` | 🟡 Useful | 保留 |
| 69 | log | `No files found in folder` | 🟢 Remove | **移除** |
| 73 | log | `Found files: {names}` | 🟡 Useful | 保留 |
| 77, 84 | log | `Getting public URL` / `Public URL result` | 🟢 Remove | **移除** |
| 87 | log | `Failed to get public URL` | 🟢 Remove | **移除** |
| 91 | log | `Success! URL: {url}` | 🟡 Useful | 保留 |
| 98 | error | `Error: {error}` | 🔴 Critical | 保留 |
| 117-232 | 同上 | `getAllDonationResultFiles` 中类似模式 | 同上 | 同样处理 |

**评估**: 此文件日志过度冗余，28 条日志中约 15 条可移除。

#### `app/actions/track-donation.ts` - 18 logs
**类型**: 捐赠追踪和退款处理

| 行号 | 类型 | 消息模板 | 必要性 |
|------|------|----------|--------|
| 56, 171, 183, 317 | error | 各种 DB 错误 | 🟡 Useful |
| 86, 358, 388 | error | 捕获所有错误 | 🔴 Critical |
| 226 | error | `Error updating NOWPayments donation status` | 🟡 Useful |
| 230 | log | `NOWPayments: Marked X donations as 'refunding'` | 🟡 Useful |
| 267 | warn | `Unknown WayForPay refund status` | 🟡 Useful |
| 284, 299 | log | `All donations already refunded` | 🟡 Useful |
| 342 | log | `Refund success email sent` | 🟡 Useful |
| 345, 375 | error | 邮件/状态更新失败 | 🟡 Useful |
| 373 | log | `Updated X donations to 'refunding'` | 🟡 Useful |

#### `app/actions/admin.ts` - 16 logs
**类型**: 管理员操作

| 行号 | 类型 | 消息模板 | 必要性 |
|------|------|----------|--------|
| 198, 231 | error | 文件列表/获取错误 | 🟡 Useful |
| 220 | log | `Result image URL: {url}` | 🟡 Useful |
| 222, 226 | warn | 仅视频/无文件警告 | 🟡 Useful |
| 273 | log | `Donation completed email sent` | 🟡 Useful |
| 276 | error | `Failed to send completion email` | 🟡 Useful |
| 345, 363, 403, 451, 490 | log | 文件上传追踪 | 🟡 Useful |
| 405, 410, 453, 492 | error/warn | 处理失败/配置问题 | 🟡 Useful |

---

### 3. API Routes

#### `app/api/donate/success-redirect/route.ts` - 8 logs
| 行号 | 类型 | 消息模板 | 必要性 |
|------|------|----------|--------|
| 26, 76 | log | `GET/POST received: {details}` | 🟡 Useful |
| 33, 84 | error | `No order reference found` | 🟡 Useful |
| 44, 95 | log | `Redirecting to: {url}` | 🟡 Useful |
| 48, 99 | error | `Error handling GET/POST` | 🟡 Useful |

#### `app/api/webhooks/resend-inbound/route.ts` - 3 logs
| 行号 | 类型 | 消息模板 | 必要性 |
|------|------|----------|--------|
| 17 | log | `📧 Received inbound email webhook` | 🟡 Useful |
| 82 | log | `✅ Email forwarded successfully` | 🟡 Useful |
| 96 | error | `❌ Error forwarding email` | 🟡 Useful |

#### 其他 API Routes - 8 logs total
- `app/api/donations/project-public/[projectId]/route.ts`: 2 error logs
- `app/api/donations/order/[orderReference]/route.ts`: 2 error logs
- `app/api/unsubscribe/route.ts`: 4 error logs

---

### 4. 工具库

#### `lib/cloudinary.ts` - 14 logs
| 行号 | 类型 | 消息模板 | 必要性 | 建议操作 |
|------|------|----------|--------|----------|
| 41, 69 | log | `Fetching/Successfully fetched` | 🟡 Useful | 保留 |
| 76 | warn | `Fetch attempt X failed` | 🟡 Useful | 保留 |
| 82 | log | `Retrying in {delay}ms...` | 🟡 Useful | 保留 |
| 148 | log | `Uploaded: {id}` | 🟡 Useful | 保留 |
| 171 | log | `Transform URL: {url}` | 🟢 Remove | **移除** |
| 182 | log | `Processed: X → Y bytes` | 🟡 Useful | 保留 |
| 190 | log | `Deleted temp file` | 🟢 Remove | **移除** |
| 193 | warn | `Failed to delete temp file` | 🟡 Useful | 保留 |
| 209, 236 | error | `Processing/Fallback failed` | 🔴 Critical | 保留 |
| 210, 238 | warn | `Falling back to...` | 🟡 Useful | 保留 |
| 224 | log | `Fallback compression successful` | 🟡 Useful | 保留 |

#### `lib/payment/nowpayments/server.ts` - 10 logs
| 行号 | 类型 | 消息模板 | 必要性 |
|------|------|----------|--------|
| 10, 14 | warn | `API_KEY/IPN_SECRET is not set` | 🔴 Critical |
| 52, 69 | error | `IPN secret not configured` / `Signature verification error` | 🔴 Critical |
| 85 | log | `Creating payment: {details}` | 🟡 Useful |
| 103 | error | `Create payment error` | 🔴 Critical |
| 113 | log | `Payment created: {details}` | 🟡 Useful |

#### `lib/payment/wayforpay/server.ts` - 6 logs
| 行号 | 类型 | 消息模板 | 必要性 |
|------|------|----------|--------|
| 301 | log | `[WAYFORPAY REFUND] API Request` | 🟡 Useful |
| 323 | error | `HTTP Error` | 🟡 Useful |
| 334 | log | `API Response` | 🟡 Useful |
| 347 | error | `Invalid signature` | 🔴 Critical |
| 353 | log | `Signature verified successfully` | 🟡 Useful |

#### Email Senders - 12 logs total (4 logs × 3 files)
⚠️ **重复代码问题**: `payment-success.ts`, `refund-success.ts`, `donation-completed.ts` 有相同模式

```typescript
// 当前重复模式 (每个文件)
try {
  const result = await resend.emails.send(...)
  if (result.error) {
    console.error('Error sending email:', result.error)  // 行25
  }
  console.log('Email sent successfully:', result.data?.id)  // 行29
} catch (error) {
  console.error('Failed to send email:', error)  // 行32 - 与行25重复
}
```

**建议**: 合并为统一的邮件发送器

---

### 5. 客户端组件

#### `components/donate/widgets/WayForPayWidget.tsx` - 8 logs
| 行号 | 类型 | 消息模板 | 必要性 | 建议操作 |
|------|------|----------|--------|----------|
| 54 | log | `Already marked as widget_load_failed` | 🟡 Useful | 保留 |
| 58 | log | `Marking as widget_load_failed - Reason` | 🟡 Useful | 保留 |
| 63 | error | `Failed to mark as widget_load_failed` | 🟡 Useful | 保留 |
| 71 | error | `Window error detected` | 🟡 Useful | 保留 |
| 208 | log | `Early detection: widget found in DOM` | 🟢 Remove | **移除** |
| 247 | log | `Widget check already completed` | 🟢 Remove | **移除** |
| 255 | log | `Widget was previously detected` | 🟢 Remove | **移除** |
| 260 | log | `Widget detected in DOM - marking as opened` | 🟡 Useful | 保留 |
| 264, 296 | error | Widget 失败/初始化错误 | 🟡 Useful | 保留 |

#### 其他客户端组件 - 约 15 logs
所有都是 `console.error()` 用于错误处理，均标记为 🟡 Useful

- `DonationFormCard.tsx`: 4 error logs (支付创建失败)
- `NowPaymentsWidget.tsx`: 1 error log (复制失败)
- `CopyButton.tsx`: 1 error log (复制失败)
- `ProjectDonationList.tsx`: 1 error log (获取捐赠失败)
- `DonationDetails.tsx`: 1 error log (获取捐赠失败)
- `DonationResultViewer.tsx`: 2 error logs (下载失败)
- `track-donation-form.tsx`: 1 error log (退款请求失败)
- `DonationEditModal.tsx`: 1 error log (加载文件失败)
- `BroadcastModal.tsx`: 1 error log (加载模板失败)

---

## 问题总结

### 1. 过度样板日志 (40+ 条待移除)

主要集中在:
- `app/actions/donation-result.ts` - 约 15 条 "starting/not found/getting URL" 样板日志
- `lib/cloudinary.ts` - 2 条过于详细的调试日志
- `components/donate/widgets/WayForPayWidget.tsx` - 3 条开发调试日志

### 2. 重复错误处理

Email senders 有重复的 try-catch 错误日志模式，应合并。

### 3. 不一致的前缀命名

| 当前使用 | 建议统一 |
|----------|----------|
| `[WEBHOOK]` | ✅ 保持 |
| `[DONATION]` | ✅ 保持 |
| `[NOWPAYMENTS WEBHOOK]` | → `[WEBHOOK:NOWPAYMENTS]` |
| `[WAYFORPAY REFUND]` | → `[PAYMENT:WAYFORPAY:REFUND]` |
| `[Upload]` | → `[ADMIN:UPLOAD]` |
| `[Cloudinary]` | → `[MEDIA:CLOUDINARY]` |
| `[Success Redirect]` | → `[REDIRECT]` |
| `[ADMIN]` | ✅ 保持 |
| `[REFUND]` | ✅ 保持 |

### 4. 缺少结构化日志

当前日志使用字符串插值，建议改用结构化格式:

```typescript
// 当前
console.log(`[WEBHOOK] Received: ${status} for order ${reference}`)

// 建议
logger.info('WEBHOOK', 'Payment received', { status, orderReference: reference })
```

### 5. 无环境过滤

所有日志在开发和生产环境都会输出，应实现环境感知的日志级别控制。

---

## 清理行动清单

### 高优先级 (立即执行)

- [ ] `donation-result.ts`: 移除 15 条样板日志
- [ ] `WayForPayWidget.tsx`: 移除 3 条开发调试日志
- [ ] `cloudinary.ts`: 移除 2 条详细调试日志
- [ ] 合并 email senders 重复错误处理

### 中优先级 (实现 Logger)

- [ ] 创建统一的 `lib/logger.ts` (服务端)
- [ ] 创建统一的 `lib/logger-client.ts` (客户端)
- [ ] 实现结构化日志格式
- [ ] 实现环境感知日志级别
- [ ] 统一前缀命名规范

### 低优先级 (后续优化)

- [ ] 为关键操作添加更多上下文信息
- [ ] 考虑集成外部日志服务 (如 Axiom, LogRocket)
- [ ] 添加请求追踪 ID

---

## 统一 Logger 设计方案

### 服务端 Logger (`lib/logger.ts`)

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogCategory =
  | 'WEBHOOK' | 'WEBHOOK:WAYFORPAY' | 'WEBHOOK:NOWPAYMENTS'
  | 'PAYMENT' | 'PAYMENT:WAYFORPAY' | 'PAYMENT:NOWPAYMENTS'
  | 'DONATION' | 'ADMIN' | 'EMAIL' | 'MEDIA' | 'REDIRECT' | 'REFUND'

interface LogContext {
  [key: string]: unknown
}

function log(level: LogLevel, category: LogCategory, message: string, context?: LogContext): void
```

### 客户端 Logger (`lib/logger-client.ts`)

```typescript
type ClientLogCategory = 'WIDGET' | 'FORM' | 'UI' | 'API'

// 生产环境只输出 error，开发环境输出所有
function log(level: LogLevel, category: ClientLogCategory, message: string, context?: LogContext): void
```

### 环境配置

```typescript
// 开发环境: debug, info, warn, error
// 生产环境: warn, error (默认)
// 可通过环境变量 LOG_LEVEL 覆盖
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-13
