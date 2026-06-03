# QmmPay（微信/支付宝）接入执行文档

> 在现有 WayForPay（法币）和 NOWPayments（加密货币）基础上，新增 qmmpay 作为第三种支付渠道，面向中国大陆用户提供人民币（CNY）捐赠通道。

**状态**: 待开始  
**创建时间**: 2026-06-03  
**文档版本**: 1.1（所有待确认问题已关闭）

---

## 背景与约束

### 现有架构模式

两条现有支付链路遵循完全相同的模式，qmmpay 接入将沿用此模式：

```
用户点击提交
  → DonationFormCard.handleSubmit()
  → validateForm()
  → PaymentMethodSelector（三选一）
  → handlePaymentMethodSelect('wechatAlipay')
  → createQmmPayDonation()  ← 新增 Server Action
      → prepareDonationContext()  ← 复用
      → createQmmPayPayment()    ← 新增
      → insertPendingDonations() ← 复用（需新增 payment_method 值）
  → 前端 Widget（重定向 / 显示二维码）
  → 用户完成支付
  → 平台 GET 回调 notify_url
  → /api/webhooks/qmmpay/route.ts ← 新增
      → 验签（RSA SHA256）
      → 更新 donation 状态为 paid
      → 发送成功邮件
      → 返回纯文本 "success"
```

### qmmpay v2 接口关键差异（对比现有两家）

| 维度 | WayForPay | NOWPayments | **qmmpay** |
|---|---|---|---|
| 签名算法 | HMAC-MD5 | HMAC-SHA512 | **RSA SHA256WithRSA** |
| Webhook 方式 | POST JSON | POST JSON | **GET Query String** |
| Webhook 响应 | 签名 JSON | `{status:'ok'}` | **纯文本 `success`** |
| 退款 | 异步回调 | 无（手动） | **同步返回结果** |
| 支付 UI | JS Widget 嵌入 | 显示地址+二维码 | **页面跳转（jump）** |
| 货币 | UAH/USD | 多币种 | **CNY（人民币）** |

### API 端点（已确认）

| 功能 | 地址 | 方式 |
|---|---|---|
| 创建订单 | `https://yzf.qmmpay.com/api/pay/create` | POST |
| 页面跳转支付 | `https://yzf.qmmpay.com/api/pay/submit` | POST/GET |
| 支付结果通知 | 由 `notify_url` 参数指定 | GET（平台发过来） |
| 订单查询 | `https://yzf.qmmpay.com/api/pay/query` | POST |
| 退款 | `https://yzf.qmmpay.com/api/pay/refund` | POST |
| 退款查询 | `https://yzf.qmmpay.com/api/pay/refundquery` | POST |

### 环境变量（需配置）

```bash
QMMPAY_PID=                  # 商户 ID（整数）
QMMPAY_MERCHANT_PRIVATE_KEY= # 商户私钥（PEM 格式，用于签名请求）
QMMPAY_PLATFORM_PUBLIC_KEY=  # 平台公钥（PEM 格式，用于验证回调签名）
```

---

## UI 现状（已完成，无需改动）

调研确认以下内容**已就绪**，接入时不需要修改：

- `PaymentMethod` 类型已包含 `'wechatAlipay'`（`PaymentMethodSelector.tsx:5`）
- `messages/zh.json` 已有完整的 `paymentMethod.wechatAlipay` 翻译键
- `messages/en.json`、`messages/ua.json` 同步就绪
- `PaymentMethodSelector` 已渲染 `wechatAlipay` 选项，当前标注为"即将推出"（`available: false`）

接入完成后只需将 `available: false` 改为 `true`。

---

## 执行步骤

### Phase 1 — 后端基础库

#### 1.1 RSA 签名工具 `lib/payment/qmmpay/crypto.ts`

- [ ] 实现 `buildSignString(params: Record<string, string>): string`
  - 过滤掉空值字段、二进制字段、`sign`、`sign_type`
  - 按 key 的 ASCII 码升序排序（同 key 再按 value 排序）
  - 拼接为 `key=value&key=value` 格式
- [ ] 实现 `signRequest(params, privateKey): string`
  - 调用 `buildSignString()`
  - 使用 Node.js `crypto.createSign('SHA256')` + 商户私钥
  - 返回 Base64 编码的签名
- [ ] 实现 `verifyWebhook(params, platformPublicKey): boolean`
  - 调用 `buildSignString()`
  - 使用 `crypto.createVerify('SHA256')` + 平台公钥验签
  - 返回验签结果

**注意**：私钥/公钥从环境变量读取，需处理 PEM 格式换行（`\\n` → `\n`）。

---

#### 1.2 类型定义 `lib/payment/qmmpay/types.ts`

- [ ] `QmmPayCreateRequest` — 创建订单请求参数
  ```typescript
  {
    pid: number          // 商户 ID
    type: 'alipay' | 'wxpay' | 'qqpay'
    out_trade_no: string // 商户订单号（= orderReference）
    notify_url: string
    return_url: string
    name: string         // 商品名称（捐赠描述）
    money: string        // 金额，单位元，最多 2 位小数
    clientip: string     // 用户 IP
    param?: string       // 透传参数（可存 locale）
    timestamp: string    // 10 位时间戳
    sign: string
    sign_type: 'RSA'
  }
  ```
- [ ] `QmmPayCreateResponse` — 创建订单响应
  ```typescript
  {
    code: number         // 0=成功
    msg?: string
    trade_no: string     // 平台订单号
    pay_type: 'jump' | 'qrcode' | 'html' | 'scan' | ...
    pay_info: string     // 支付 URL 或二维码链接
    timestamp: string
    sign: string
    sign_type: string
  }
  ```
- [ ] `QmmPayWebhookParams` — notify_url 回调参数（GET query string）
  ```typescript
  {
    pid: string
    trade_no: string
    out_trade_no: string
    api_trade_no: string // 微信/支付宝返回的单号
    type: string
    trade_status: 'TRADE_SUCCESS'
    addtime: string
    endtime: string
    name: string
    money: string
    param?: string
    buyer: string        // 支付用户标识（openid）
    timestamp: string
    sign: string
    sign_type: string
  }
  ```
- [ ] `QmmPayRefundRequest` / `QmmPayRefundResponse`
- [ ] `QmmPayQueryResponse`（含 `status: 0|1|2|3|4`）

---

#### 1.3 API 客户端 `lib/payment/qmmpay/server.ts`

- [ ] 实现 `createQmmPayPayment(params): Promise<QmmPayCreateResponse>`
  - 读取环境变量（pid、private_key）
  - 生成 `out_trade_no`（复用 `orderReference`）
  - 生成 `timestamp`（10 位秒级时间戳）
  - 调用 `signRequest()` 生成 `sign`
  - POST 到 `https://yzf.qmmpay.com/api/pay/create`（`application/x-www-form-urlencoded`）
  - 验证响应签名（`verifyWebhook(response, platformPublicKey)`）
  - 抛出语义化错误（code !== 0 时）

- [ ] 实现 `queryQmmPayOrder(out_trade_no): Promise<QmmPayQueryResponse>`
  - 用于退款前确认订单已支付

- [ ] 实现 `refundQmmPayOrder(params): Promise<QmmPayRefundResponse>`
  - 传入 `out_trade_no`（或 `trade_no`）和 `money`
  - **同步返回**退款结果，无需等待回调
  - code=0 表示退款成功

---

### Phase 2 — Server Action

#### 2.1 新增 `createQmmPayDonation()` (`app/actions/donation.ts`)

- [ ] 函数签名与 `createWayForPayDonation` / `createNowPaymentsDonation` 保持一致
  ```typescript
  export async function createQmmPayDonation(
    input: DonationCreationInput & { payType: 'alipay' | 'wxpay' }
  ): Promise<{ payUrl: string; orderReference: string } | { error: string }>
  ```
- [ ] 内部流程：
  1. `prepareDonationContext(input)` — 复用验证和金额计算
  2. 获取用户 IP（从 `headers()` 读取 `x-forwarded-for`）
  3. 构造 `notify_url = ${NEXT_PUBLIC_APP_URL}/api/webhooks/qmmpay`
  4. 构造 `return_url = ${NEXT_PUBLIC_APP_URL}/${locale}/donate/success?order=${orderReference}`
  5. 调用 `createQmmPayPayment()` — 金额换算：`money = (usdAmount * parseFloat(process.env.QMMPAY_USD_CNY_RATE!)).toFixed(2)`
  6. `insertPendingDonations({ ...context, payment_method: 'QmmPay' })` — 复用
  7. 返回 `{ payUrl: response.pay_info, orderReference }`

**货币处理**（已确认）：
- 系统内部保持 USD，调用 qmmpay API 时按固定汇率换算为 CNY
- 汇率存在环境变量 `QMMPAY_USD_CNY_RATE`（如 `7.25`），人工定期更新
- 金额转换：`money = (usdAmount * rate).toFixed(2)`（单位：元，保留 2 位小数）
- 需新增环境变量：`QMMPAY_USD_CNY_RATE=7.25`

---

#### 2.2 更新 `insertPendingDonations()` (`app/actions/donation/_shared.ts`)

- `payment_method` 字段已确认为 `varchar(50)` 自由文本（非枚举），直接存 `'QmmPay'` 即可，**无需数据库迁移**

---

### Phase 3 — Webhook 处理

#### 3.1 新建 `app/api/webhooks/qmmpay/route.ts`

- [ ] 创建 `GET` handler（注意：qmmpay 回调是 GET，不是 POST）
  ```typescript
  export async function GET(request: NextRequest) { ... }
  ```
- [ ] 解析 query string：`request.nextUrl.searchParams`
- [ ] 提取 `sign`、`sign_type` 字段，其余字段进行验签
- [ ] 调用 `verifyWebhook(params, platformPublicKey)`
  - 验签失败：返回 `400` 并记录日志，**不返回 "success"**（触发平台重试）
- [ ] 检查 `trade_status === 'TRADE_SUCCESS'`
- [ ] 通过 `out_trade_no`（= `orderReference`）查询对应的所有 donations
  - 使用 `createServiceClient()`（service role，绕过 RLS 用于 webhook）
- [ ] 检查当前 `donation_status` 是否在允许更新的源状态内
  - 复用 `PAYMENT_WEBHOOK_SOURCE_STATUSES`（`lib/donation-status.ts`）
  - 防止重复回调重复更新
- [ ] 批量更新 `donation_status = 'paid'`
- [ ] 调用 `sendPaymentSuccessEmail()`（复用现有邮件逻辑）
- [ ] 返回纯文本 `success`（HTTP 200）— 平台收到此响应后停止重试

**注意**：webhook 处理中任何数据库/邮件错误不应导致返回非 200（否则触发无限重试），应记录日志后仍返回 `success`。

---

### Phase 4 — 前端 Widget

#### 4.1 新建 `components/donate-form/widgets/QmmPayWidget.tsx`

qmmpay 最简实现：创建订单后服务器返回 `pay_url`，前端直接跳转，无需嵌入 JS。

- [ ] Props：`{ payUrl: string; orderReference: string; onError: () => void }`
- [ ] 组件挂载后立即执行 `window.location.href = payUrl`（或 `router.push(payUrl)`）
- [ ] 跳转前显示"正在跳转到支付页面..."过渡 UI（复用现有 loading 样式）
- [ ] 处理 `payUrl` 为空的错误状态

**备选方案**（如平台返回二维码）：
- 若 `pay_type === 'qrcode'`：`pay_info` 是二维码图片 URL，用 `<img>` 渲染
- 若 `pay_type === 'jump'`：`pay_info` 是跳转 URL，直接跳转
- 建议在请求中指定 `method: 'web'` 让平台自动判断，或固定 `method: 'jump'` 最简单

---

#### 4.2 修改 `DonationFormCard.tsx`

- [ ] 在 `handlePaymentMethodSelect` 中新增 `'wechatAlipay'` 分支：
  ```typescript
  case 'wechatAlipay':
    // 让用户选择微信还是支付宝（可选，或默认用 type='wxpay'/'alipay'）
    // 或直接展示两个按钮
    const result = await createQmmPayDonation({ ...formData, payType: selectedSubMethod })
    if ('error' in result) { /* 错误处理 */ }
    setQmmPayData(result)
    setProcessingState('qmmpay_widget')
  ```
- [ ] 新增状态 `'qmmpay_widget'` 到 `processingState` 类型
- [ ] 在渲染部分新增：
  ```tsx
  {processingState === 'qmmpay_widget' && qmmPayData && (
    <QmmPayWidget payUrl={qmmPayData.payUrl} ... />
  )}
  ```

**子支付方式选择**（已确认：两个独立按钮）：
- 用户在 `PaymentMethodSelector` 选中"微信 / 支付宝"后，展示两个子按钮
- "微信支付"按钮 → 直接触发 `createQmmPayDonation({ payType: 'wxpay' })` → 跳转
- "支付宝"按钮 → 直接触发 `createQmmPayDonation({ payType: 'alipay' })` → 跳转
- 交互模式：与 crypto 流程类似（选大类 → 选子类 → 发起支付），无中间确认页
- 新增 `processingState: 'selecting_qmmpay_submethod'` 状态展示两个子按钮

---

### Phase 5 — 退款流程集成

当前退款入口：`app/actions/track-donation.ts` → `requestRefund()`

- [ ] 在退款逻辑中识别 `payment_method === 'QmmPay'` 的订单
- [ ] 调用 `refundQmmPayOrder({ out_trade_no, money })` — 同步返回
- [ ] 根据返回的 `code` 直接更新 `donation_status`：
  - `code === 0`：更新为 `refunded`，发送退款邮件
  - `code !== 0`：记录错误，保持 `refunding` 状态，人工处理
- [ ] **无需**新增 webhook 端点（退款不走回调）

---

### Phase 6 — UI 上线开关

- [ ] 在 `PaymentMethodSelector.tsx` 中将 `wechatAlipay` 的 `available` 改为 `true`
  - 当前代码中该选项的 `available: false` 负责显示"即将推出"标签
  - 这是最后一步，确保所有后端都测试通过后再开启

---

### Phase 7 — 测试清单

> 测试策略：直接使用生产账号小额（0.01 CNY ≈ $0.001）测试，测试后退款。

#### 功能测试
- [ ] 使用生产账号测试支付宝小额支付 → 确认返回 `payUrl` → 跳转成功 → `notify_url` 触发 → donation 状态 = `paid`
- [ ] 使用生产账号测试微信支付小额支付 → 同上
- [ ] 确认成功邮件发送（检查收件箱）
- [ ] 测试退款流程 → 确认同步返回 code=0 → 状态更新为 `refunded` → 退款邮件发送
- [ ] 测试重复回调（curl 同一 notify 参数两次）→ 确认幂等，第二次不重复更新

#### 安全测试
- [ ] 伪造签名的回调 → 确认返回 400，不更新数据库
- [ ] 篡改金额的回调 → 确认签名验证失败
- [ ] 直接访问 `GET /api/webhooks/qmmpay` 无参数 → 确认返回 400

#### 边界测试
- [ ] 网络超时（createQmmPayPayment 调用失败）→ 确认用户看到错误提示
- [ ] 用户返回（未完成支付直接关闭支付页）→ 订单保持 `pending`，不影响其他功能

---

## 文件清单（新建/修改）

### 新建
```
lib/payment/qmmpay/
  ├── crypto.ts           # RSA 签名工具
  ├── types.ts            # 类型定义
  └── server.ts           # API 客户端

app/api/webhooks/qmmpay/
  └── route.ts            # GET webhook handler

components/donate-form/widgets/
  └── QmmPayWidget.tsx    # 支付跳转 widget
```

### 修改
```
app/actions/donation.ts          # 新增 createQmmPayDonation()
components/donate-form/
  └── DonationFormCard.tsx       # 新增 wechatAlipay 两按钮分支
components/donate-form/
  └── PaymentMethodSelector.tsx  # available: false → true（最后一步）
```

### 不需要修改
```
messages/*.json                  # 翻译已就绪
components/donate-form/PaymentMethodSelector.tsx  # UI 已就绪（只改 available）
lib/donation-status.ts           # 状态定义复用
app/actions/donation/_shared.ts  # prepareDonationContext / insertPendingDonations 复用
```

---

## 已确认事项

| # | 问题 | 决策 |
|---|---|---|
| 1 | 货币计价方式 | 系统保持 USD，调用 API 时按固定汇率换算 CNY |
| 2 | 汇率来源 | 固定汇率，存环境变量 `QMMPAY_USD_CNY_RATE`，人工更新 |
| 3 | 微信 vs 支付宝选择方式 | 两个独立按钮，点击直接触发对应支付并跳转 |
| 4 | 数据库 `payment_method` 字段类型 | `varchar(50)` 自由文本，无需迁移 |
| 5 | 测试策略 | 生产账号小额测试（0.01 CNY），测完退款 |

---

*文档版本: 1.0 | 最后更新: 2026-06-03*
