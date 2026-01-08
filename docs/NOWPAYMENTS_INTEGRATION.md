# NOWPayments 加密货币支付集成方案

> 本文档记录 NOWPayments 加密货币支付集成的设计决策和实现方案

---

## 1. 概述

### 1.1 集成目标

为 NGO 捐赠平台添加加密货币支付选项，使用 NOWPayments 作为支付网关。

### 1.2 集成方式选择

| 方式 | 优点 | 缺点 |
|------|------|------|
| Donation Widget (iframe) | 简单，直接嵌入 | 无法传递 order_id，无法关联项目 |
| **API 方式** | 完全控制，可追踪 | 需要后端开发 |

**决策：使用 API 方式**

理由：
- 可以传递自定义 `order_id`，与我们的订单系统关联
- 可以关联到具体项目
- 捐赠者信息由我们收集和管理
- UI 完全可控

### 1.3 NOWPayments 特点

| 特点 | 说明 |
|------|------|
| 服务类型 | **非托管** - 资金直接进入你的钱包 |
| 支持币种 | USDT、USDC、BTC、ETH 等多种加密货币 |
| 确认时间 | 依赖区块链确认，通常几分钟到几十分钟 |
| 过期时间 | 7 天（vs WayForPay 几分钟） |
| 退款方式 | 手动从钱包转账（无退款 API） |

### 1.4 环境变量

```bash
# NOWPayments
NOWPAYMENTS_API_KEY=xxx          # API Key（从 Dashboard 获取）
NOWPAYMENTS_IPN_SECRET=xxx       # IPN Secret Key（用于验证 webhook 签名）
```

---

## 2. 数据库设计

### 2.1 结论：无需修改数据库结构

当前 `donations` 表字段已完全支持加密货币支付：

| 字段 | 类型 | 用途 |
|------|------|------|
| `payment_method` | `string` | `'WayForPay'` 或 `'NOWPayments'` |
| `currency` | `string` | 存储 `'USD'`、`'USDT'`、`'USDC'` 等 |
| `amount` | `number` | 捐赠金额 |
| `order_reference` | `string` | 订单号（统一格式） |
| `donation_status` | `string` | 捐赠状态（复用现有 15 种状态） |

### 2.2 payment_method 字段值

| 支付渠道 | payment_method 值 |
|----------|-------------------|
| 银行卡/Apple Pay/Google Pay | `'WayForPay'` |
| 加密货币 | `'NOWPayments'` |

### 2.3 订单号格式

**决策：保持与 WayForPay 相同的格式**

```
DONATE-{project_id}-{timestamp}-{randomSuffix}

示例: DONATE-3-1704567890123-ABC123
```

通过 `payment_method` 字段区分支付渠道，而非订单号前缀。

---

## 3. 支付方式选择器

### 3.1 命名决策

**将 "USDT / USDC" 改为 "加密货币 / Cryptocurrency"**

翻译更新：

```json
// messages/en.json
"crypto": {
  "title": "Cryptocurrency",
  "description": "Pay with USDT, USDC, BTC, ETH and more"
}

// messages/zh.json
"crypto": {
  "title": "加密货币",
  "description": "支持 USDT、USDC、BTC、ETH 等"
}

// messages/ua.json
"crypto": {
  "title": "Криптовалюта",
  "description": "Оплата USDT, USDC, BTC, ETH тощо"
}
```

### 3.2 PaymentMethod 类型

前端选择器使用的类型（UI 层面）：

```typescript
// 前端 UI 选择
export type PaymentMethod = 'card' | 'wechat' | 'alipay' | 'crypto'
```

映射到数据库 `payment_method` 字段：

| 前端 PaymentMethod | 数据库 payment_method |
|--------------------|----------------------|
| `'card'` | `'WayForPay'` |
| `'crypto'` | `'NOWPayments'` |
| `'wechat'` | (未实现) |
| `'alipay'` | (未实现) |

---

## 4. Webhook 状态映射

### 4.1 NOWPayments 支付状态

NOWPayments 有 9 个主要状态 + 2 个额外状态：

| 状态 | 说明 |
|------|------|
| `waiting` | 等待用户发送加密货币（初始状态） |
| `confirming` | 区块链正在确认交易 |
| `confirmed` | 区块链已确认，等待转入钱包 |
| `sending` | 正在发送到商户钱包 |
| `partially_paid` | 用户支付金额不足（资金已到账） |
| `finished` | 支付完成，资金已到账 |
| `failed` | 支付失败 |
| `expired` | 7 天内未支付，已过期 |
| `refunded` | 已退款 |
| `wrong_asset_confirmed` | 用户发送了错误币种/网络 |
| `cancelled` | 手动取消 |

### 4.2 状态映射表

| NOWPayments 状态 | → donation_status | 发送邮件 | 说明 |
|-----------------|-------------------|---------|------|
| `waiting` | 保持 `pending` | 否 | 等待用户支付，无需更新 |
| `confirming` | `processing` | 否 | 区块链确认中 |
| `confirmed` | `processing` | 否 | 等待转入钱包 |
| `sending` | `processing` | 否 | 正在转入钱包 |
| `finished` | `paid` | **是** | 支付成功 |
| `partially_paid` | `failed` | 否 | 金额不足，需人工退款 |
| `failed` | `failed` | 否 | 支付失败 |
| `expired` | `expired` | 否 | 7 天未支付 |
| `refunded` | `refunded` | **是** | 已退款 |
| `wrong_asset_confirmed` | `failed` | 否 | 错误币种，需人工处理 |
| `cancelled` | `failed` | 否 | 已取消 |

### 4.3 与 WayForPay 流程对比

```
WayForPay 流程（即时）:
pending → processing/fraud_check → paid

NOWPayments 流程（区块链）:
pending → confirming → confirmed → sending → finished (paid)
         └─────────── 都映射为 processing ───────────┘
```

### 4.4 partially_paid 处理决策

**决策：标记为 `failed`，需人工退款**

理由：
- 用户的捐赠意图是特定金额，部分支付不符合意愿
- NOWPayments 无法自动退款（资金已在我们钱包）
- 需要管理员手动从钱包转账退款

---

## 5. 退款流程

### 5.1 WayForPay vs NOWPayments 退款对比

| 特点 | WayForPay | NOWPayments |
|------|-----------|-------------|
| 资金托管 | 是（托管在 WayForPay） | 否（直接进入你的钱包） |
| 退款 API | 有 | **没有** |
| 退款方式 | 调用 API 自动退款 | **手动从钱包转账** |

### 5.2 加密货币退款流程

```
1. 用户申请退款 → 状态变为 `refunding`
2. 管理员在后台看到退款申请
3. 管理员手动从加密货币钱包转账给用户
4. 管理员确认完成 → 手动将状态改为 `refunded`
```

### 5.3 UI 处理

- 加密货币捐赠的退款申请按钮保持显示
- 用户可以正常申请退款
- 但后端不会调用任何退款 API，仅更新状态为 `refunding`
- 管理员需要手动处理并更新状态

---

## 6. 实现清单

### 6.1 后端

- [ ] 创建 `lib/nowpayments/` 目录
  - [ ] `client.ts` - NOWPayments API 客户端
  - [ ] `server.ts` - 服务端工具函数（签名验证等）
  - [ ] `types.ts` - TypeScript 类型定义
- [ ] 创建 `app/api/webhooks/nowpayments/route.ts` - Webhook 处理
- [ ] 修改 `app/actions/donation.ts` - 添加 `createNowPaymentsDonation()` 函数
- [ ] 修改 `app/actions/track-donation.ts` - 退款逻辑区分支付渠道

### 6.2 前端

- [ ] 修改 `components/donate/PaymentMethodSelector.tsx` - 启用 crypto 选项
- [ ] 修改 `components/donate/DonationFormCard.tsx` - 处理 crypto 支付流程
- [ ] 创建加密货币支付页面/组件（显示钱包地址、二维码等）

### 6.3 翻译

- [ ] 更新 `messages/en.json` - crypto 相关文案
- [ ] 更新 `messages/zh.json` - crypto 相关文案
- [ ] 更新 `messages/ua.json` - crypto 相关文案

### 6.4 管理后台

- [ ] 修改 `components/admin/DonationsTable.tsx` - 显示支付方式
- [ ] 修改退款流程 - 区分自动退款和手动退款

---

## 7. API 参考

### 7.1 创建支付

```typescript
// POST https://api.nowpayments.io/v1/payment
{
  price_amount: 100,           // 价格金额
  price_currency: "usd",       // 价格货币
  pay_currency: "usdttrc20",   // 支付货币（可选，让用户选择）
  ipn_callback_url: "https://example.com/api/webhooks/nowpayments",
  order_id: "DONATE-3-xxx",    // 我们的订单号
  order_description: "Donation to Project X"
}
```

### 7.2 Webhook 请求体

```typescript
{
  payment_id: 123456789,
  payment_status: "finished",
  pay_address: "TXxx...",
  price_amount: 100,
  price_currency: "usd",
  pay_amount: 100.5,
  actually_paid: 100.5,        // 实际支付金额
  pay_currency: "usdttrc20",
  order_id: "DONATE-3-xxx",
  order_description: "...",
  purchase_id: "...",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:05:00.000Z"
}
```

### 7.3 Webhook 签名验证

```typescript
import crypto from 'crypto'

function verifyNowPaymentsSignature(body: object, signature: string): boolean {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET!

  // 1. 按字母顺序排序 body 的 key
  const sortedBody = JSON.stringify(sortObjectKeys(body))

  // 2. 使用 HMAC-SHA512 生成签名
  const hmac = crypto.createHmac('sha512', ipnSecret)
  hmac.update(sortedBody)
  const calculatedSignature = hmac.digest('hex')

  // 3. 比较签名
  return calculatedSignature === signature
}
```

---

## 8. 参考资料

- [NOWPayments API 文档](https://documenter.getpostman.com/view/7907941/2s93JusNJt)
- [NOWPayments IPN 设置](https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup)
- [NOWPayments 支付状态](https://nowpayments.zendesk.com/hc/en-us/articles/18395434917149-Payment-statuses)
- [NOWPayments 退款政策](https://nowpayments.io/help/payments/common/refund-policy)

---

**文档版本**: 1.0.0
**创建日期**: 2026-01-07
**最后更新**: 2026-01-07
