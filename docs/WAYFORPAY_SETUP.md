# WayForPay 集成指南

本指南将帮助你配置 WayForPay（乌克兰支付服务商）以替代 Stripe。

## 📋 为什么使用 WayForPay？

- ✅ **本地支付方式**: 支持乌克兰本地银行卡和支付方式
- ✅ **无地区限制**: 可以在乌克兰境内使用
- ✅ **UAH 货币支持**: 原生支持格里夫纳（UAH）
- ✅ **符合本地法规**: 符合乌克兰支付法规
- ✅ **更低手续费**: 对乌克兰用户通常手续费更低

---

## 🚀 设置步骤

### 步骤 1: 注册 WayForPay 账号

1. **访问 WayForPay 官网**
   - 网址: https://wayforpay.com
   - 点击 "Зареєструватися" (注册) 或 "Register"

2. **填写商户信息**
   - 公司名称
   - 联系人信息
   - 银行账户信息
   - 税务登记信息

3. **提交文件**
   - 公司注册文件
   - 税务登记证
   - 银行账户证明
   - 负责人身份证明

4. **等待审核**
   - 通常需要 1-3 个工作日
   - 审核通过后会收到邮件通知

### 步骤 2: 获取 API 密钥

**登录 WayForPay 控制台后:**

1. 进入 **"Налаштування"** (设置) 或 **"Settings"**
2. 找到 **"API ключі"** (API Keys) 部分
3. 你会看到：

   ```
   Ім'я продавця (Merchant Account): test_merch_n1
   Секретний ключ (Secret Key): flk3409refn54t54t*FNJRET
   ```

4. **复制这两个值**：
   - `WAYFORPAY_MERCHANT_ACCOUNT`: 商户账号
   - `WAYFORPAY_SECRET_KEY`: 密钥

⚠️ **重要**: 密钥非常敏感，妥善保管！

---

### 步骤 3: 配置环境变量

编辑项目根目录的 `.env.local` 文件：

```bash
# WayForPay (Ukrainian Payment Provider)
WAYFORPAY_MERCHANT_ACCOUNT=your_merchant_account
WAYFORPAY_SECRET_KEY=your_secret_key

# 其他已有的环境变量...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**测试环境示例:**
```bash
WAYFORPAY_MERCHANT_ACCOUNT=test_merch_n1
WAYFORPAY_SECRET_KEY=flk3409refn54t54t*FNJRET
```

**生产环境示例:**
```bash
WAYFORPAY_MERCHANT_ACCOUNT=your_production_merch
WAYFORPAY_SECRET_KEY=your_production_secret_key
```

---

### 步骤 4: 运行数据库迁移

应用 WayForPay 支持所需的数据库迁移：

```bash
# 如果使用 Supabase CLI
supabase db push

# 或者手动在 Supabase Dashboard 中执行
# 文件: supabase/migrations/005_wayforpay_support.sql
```

这会创建 `pending_payments` 表来存储支付元数据。

---

### 步骤 5: 配置 Webhook URL

**在 WayForPay 控制台:**

1. 进入 **"Налаштування"** → **"Notification URL"**
2. 设置 Service URL (回调地址)：

   **开发环境（使用 ngrok）:**
   ```
   https://your-ngrok-url.ngrok.io/api/webhooks/wayforpay
   ```

   **生产环境:**
   ```
   https://yourdomain.com/api/webhooks/wayforpay
   ```

3. 保存设置

---

### 步骤 6: 测试支付流程

**启动开发服务器:**

```bash
npm run dev
```

**测试步骤:**

1. 访问 `http://localhost:3000/en/donate`
2. 选择项目
3. 填写捐赠表单
4. 点击提交

**WayForPay 测试卡:**

```
卡号: 4111111111111111
过期日期: 12/25
CVV: 111
持卡人: TEST CARD
```

更多测试卡: https://wiki.wayforpay.com/view/852091

5. 完成支付
6. 检查是否：
   - ✅ 重定向到成功页面
   - ✅ 数据库中创建了捐赠记录
   - ✅ 收到确认邮件

---

## 📊 数据库架构

### 使用现有 `donations` 表

WayForPay 集成**不需要创建额外的表**，直接使用现有的 `donations` 表。

**新增字段:**
- `order_reference` - WayForPay 订单号 (格式: `DONATE-{project_id}-{timestamp}`)

**新增状态:**
- `pending` - 支付前创建的待处理捐赠
- `paid` - 支付成功后的状态
- 其他状态保持不变

**工作流程:**
1. **用户提交表单** → 创建 `pending` 状态的捐赠记录
2. **用户完成支付** → WayForPay 回调 webhook
3. **Webhook 更新** → 将 `pending` 状态更新为 `paid`
4. **发送邮件** → 确认邮件发送给捐赠者

**优势:**
- ✅ 无需额外的表
- ✅ 数据模型简单
- ✅ 更少的数据库操作
- ✅ 更容易维护

## 🔧 配置详解

### WayForPay 支持的货币

默认使用 **UAH (格里夫纳)**，也支持：
- USD (美元)
- EUR (欧元)
- RUB (卢布) - 视地区而定

**在代码中配置货币:**
```typescript
// lib/wayforpay/server.ts 或 app/actions/donation.ts
currency: 'UAH', // 可改为 'USD', 'EUR'
```

### 支付流程说明

1. **用户填写表单** → DonationFormCard
2. **创建待处理捐赠** → Server Action (`createWayForPayDonation`)
   - 生成 `orderReference`
   - 创建 `pending` 状态的捐赠记录
3. **显示支付组件** → WayForPayWidget
   - 加载 WayForPay script
   - 初始化支付表单
4. **用户完成支付** → WayForPay 服务器
5. **Webhook 回调** → `/api/webhooks/wayforpay`
   - 验证签名
   - 查询 `pending` 状态的捐赠记录
   - 更新状态为 `paid`
   - 发送确认邮件
6. **重定向到成功页** → `/[locale]/donate/success`

### Webhook 安全

Webhook 使用 **MD5 签名验证**：

```typescript
// 自动在 webhook 中验证
const isValid = verifyWayForPaySignature(body, receivedSignature)
```

签名字段顺序（重要！）：
```
merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
```

---

## 🧪 测试清单

### 本地测试

- [ ] WayForPay Widget 正确加载
- [ ] 可以选择项目和数量
- [ ] 表单验证正常工作
- [ ] 使用测试卡完成支付
- [ ] Webhook 收到回调
- [ ] 签名验证成功
- [ ] 捐赠记录创建成功
- [ ] 邮件发送成功
- [ ] 成功页面显示捐赠 ID

### 生产前测试

- [ ] 配置生产环境 Webhook URL
- [ ] 测试真实支付流程
- [ ] 确认手续费设置
- [ ] 测试退款流程 (如需要)
- [ ] 检查邮件送达率
- [ ] 监控错误日志

---

## 🔍 故障排除

### 问题 1: WayForPay Widget 未加载

**症状:**
- 支付页面空白
- Console 显示 script 加载错误

**解决方法:**
1. 检查网络连接
2. 确认 WayForPay script URL 正确:
   ```
   https://secure.wayforpay.com/server/pay-widget.js
   ```
3. 检查浏览器 Console 错误

### 问题 2: Webhook 签名验证失败

**症状:**
- Webhook 返回 400 错误
- 日志显示 "Invalid signature"

**解决方法:**
1. 检查 `WAYFORPAY_SECRET_KEY` 是否正确
2. 确认签名字段顺序正确
3. 检查是否有多余空格或换行
4. 查看 WayForPay 日志中的签名参数

### 问题 3: 捐赠状态未更新

**症状:**
- Webhook 成功但捐赠状态仍为 `pending`

**解决方法:**
1. 检查 `donations` 表是否有对应的 `pending` 状态记录
2. 确认 `order_reference` 值匹配
3. 查看 webhook 日志中的更新错误
4. 确认 Service Role Key 配置正确
5. 检查 RLS 策略是否阻止更新

### 问题 4: 货币不匹配

**症状:**
- 显示金额不正确

**解决方法:**
```typescript
// 确保前端和后端货币一致
// wayforpay-widget.tsx
{paymentParams.currency === 'UAH' ? '₴' : '$'}

// app/actions/donation.ts
currency: 'UAH',
```

### 问题 5: order_reference 字段不存在

**症状:**
- Server Action 或 Webhook 报错 "column does not exist"

**解决方法:**
```bash
# 运行数据库迁移
supabase db push

# 或手动执行 SQL 迁移
# supabase/migrations/005_wayforpay_support.sql
```

---

## 📈 监控和维护

### 日志检查

**查看 Webhook 日志:**
```bash
# Vercel
vercel logs

# 本地
检查 terminal 输出
```

**关键日志点:**
- ✅ Payment approved
- ✅ Donations created
- ✅ Email sent
- ❌ Signature verification failed
- ❌ Pending payment not found

### 定期任务（可选）

**清理过期的 pending 捐赠 (建议每天执行):**
```sql
SELECT cleanup_expired_pending_donations();
```

这会删除 24 小时前创建的 `pending` 状态捐赠（未完成支付的记录）。

可以在 Supabase Dashboard 创建定时任务或使用 Vercel Cron Jobs。

### 监控指标

- 支付成功率
- Webhook 响应时间
- Pending → Paid 状态转换成功率
- 邮件发送成功率
- Pending 捐赠数量（监控未完成支付）

---

## 🌐 生产环境部署

### Vercel 环境变量

在 Vercel Dashboard 添加：

```
WAYFORPAY_MERCHANT_ACCOUNT=your_production_merchant
WAYFORPAY_SECRET_KEY=your_production_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Webhook URL 配置

在 WayForPay Dashboard 设置：

```
https://yourdomain.com/api/webhooks/wayforpay
```

### SSL/HTTPS

WayForPay 要求 Webhook URL 必须使用 HTTPS。Vercel 自动提供。

---

## 💰 费用和手续费

**WayForPay 手续费 (参考):**
- Visa/Mastercard: 通常 2.5% + 固定费用
- 具体费率取决于你的商户协议

**查询账单:**
- WayForPay Dashboard → Reports → Transactions

---

## 📞 支持资源

**WayForPay 官方:**
- 📚 文档: https://wiki.wayforpay.com
- 📧 邮箱: support@wayforpay.com
- 📞 电话: +380 44 364 24 05
- 💬 在线聊天: wayforpay.com

**API 文档:**
- Widget API: https://wiki.wayforpay.com/view/852091
- Webhook API: https://wiki.wayforpay.com/view/852102

---

## 🔄 从 Stripe 迁移

如果你之前使用 Stripe，主要变化：

| 方面 | Stripe | WayForPay |
|------|--------|-----------|
| **支付组件** | `<PaymentElement>` | `<WayForPayWidget>` |
| **Server Action** | `createDonationIntent` | `createWayForPayDonation` |
| **返回数据** | `clientSecret` | `paymentParams` |
| **Webhook URL** | `/api/webhooks/stripe` | `/api/webhooks/wayforpay` |
| **货币** | USD | UAH (可选 USD/EUR) |
| **元数据** | Payment Intent metadata | `pending_payments` 表 |

**已完成的迁移:**
✅ 移除 Stripe Elements
✅ 替换为 WayForPay Widget
✅ 更新 Server Action
✅ 创建 WayForPay Webhook
✅ 添加 pending_payments 表
✅ 保持表单结构不变

---

## ✅ 完成清单

部署前确认：

- [ ] WayForPay 账号已激活
- [ ] 获取了生产环境 API 密钥
- [ ] 配置了环境变量
- [ ] 运行了数据库迁移
- [ ] 设置了 Webhook URL
- [ ] 测试了完整支付流程
- [ ] 配置了邮件服务
- [ ] 设置了定期清理任务
- [ ] 配置了错误监控

---

**文档版本**: 1.0
**最后更新**: 2024-12-19
**适用系统**: NGO Platform v0.3.0+
