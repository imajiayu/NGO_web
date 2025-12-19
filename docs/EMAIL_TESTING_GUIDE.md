# 📧 邮件功能测试指南

## ✅ 当前状态

邮件功能已完整实现并集成到支付流程中：

1. ✅ Resend 配置完成
2. ✅ 域名验证完成 (waytofutureua.org.ua)
3. ✅ 发送地址: noreply@waytofutureua.org.ua
4. ✅ 三语言支持 (English, 中文, Українська)
5. ✅ Webhook 集成完成

## 🧪 测试方法

### 方法 1: 使用测试脚本（推荐）

#### 步骤 1: 安装依赖

```bash
npm install
```

#### 步骤 2: 修改测试邮箱

编辑 `scripts/test-email.ts`，将测试邮箱改为你自己的：

```typescript
const testParams = {
  to: 'your-email@example.com', // 👈 改成你的邮箱
  donorName: 'Test Donor 测试捐赠者',
  projectName: 'Clean Water Project 清洁水源项目',
  donationIds: ['1-ABC123', '1-DEF456', '1-GHI789'],
  totalAmount: 150.00,
  currency: 'UAH',
  locale: 'en' as const, // 可以改成 'zh' 或 'ua' 测试其他语言
}
```

#### 步骤 3: 运行测试

```bash
npm run test:email
```

#### 预期结果

你应该看到：

```
🧪 Testing email functionality...

📧 Sending test email with params:
{
  "to": "your-email@example.com",
  "donorName": "Test Donor 测试捐赠者",
  ...
}

✅ Email sent successfully!
📬 Email ID: xxx-xxx-xxx
✨ Check your inbox at: your-email@example.com
```

然后检查你的邮箱，应该收到一封精美的捐赠确认邮件。

---

### 方法 2: 实际捐赠流程测试

#### 步骤 1: 启动开发服务器

```bash
npm run dev
```

#### 步骤 2: 访问捐赠页面

```
http://localhost:3000/en/donate
```

#### 步骤 3: 填写捐赠表单

- 选择一个项目
- 输入数量
- **重要**: 填写你的真实邮箱地址
- 填写其他信息

#### 步骤 4: 使用测试卡完成支付

使用 WayForPay 测试卡号完成支付（具体测试卡信息参考 WayForPay 文档）

#### 步骤 5: 检查邮箱

支付成功后，你应该在几秒钟内收到确认邮件。

---

## 📧 邮件内容

确认邮件包含：

### 英文版 (locale: 'en')
- **Subject**: Thank You for Your Donation - {项目名称}
- **内容**:
  - 感谢信息
  - 项目名称
  - 捐赠金额
  - 捐赠 ID 列表（可用于追踪）
  - 后续流程说明
  - 联系信息

### 中文版 (locale: 'zh')
- **主题**: 感谢您的捐赠 - {项目名称}
- 内容与英文版对应，完全本地化

### 乌克兰语版 (locale: 'ua')
- **Тема**: Дякуємо за ваше пожертвування - {项目名称}
- 内容与英文版对应，完全本地化

---

## 🎨 邮件模板预览

邮件使用精美的 HTML 模板，包含：

1. **渐变色标题栏** - 紫色渐变背景
2. **详细信息框** - 项目名称、金额
3. **捐赠 ID 列表** - 灰色背景，等宽字体显示
4. **重要提示** - 黄色背景提示保存 ID
5. **后续流程** - 蓝色背景说明框
6. **专业签名** - NGO 团队签名

同时提供纯文本版本作为备选。

---

## 🔍 测试不同语言

### 测试英文邮件
```typescript
locale: 'en' as const
```

### 测试中文邮件
```typescript
locale: 'zh' as const
```

### 测试乌克兰语邮件
```typescript
locale: 'ua' as const
```

---

## ⚠️ 常见问题

### 1. 邮件没有收到

**检查项**:
- ✅ 检查垃圾邮件文件夹
- ✅ 确认 Resend API Key 正确
- ✅ 确认发送邮箱地址正确
- ✅ 查看终端日志是否有错误

**解决方案**:
```bash
# 检查环境变量
cat .env.local | grep RESEND
```

应该显示：
```
RESEND_API_KEY=re_hPcXoJyh_NuLS8QspviGxiR1mCG6Nw6d2
RESEND_FROM_EMAIL=noreply@waytofutureua.org.ua
```

### 2. Resend API 错误

**常见错误**:
- `Invalid API key` - 检查 API key 是否正确
- `Domain not verified` - 确认域名 DNS 记录已验证
- `Invalid from address` - 确认发送地址使用已验证的域名

**查看 Resend Dashboard**:
https://resend.com/emails

可以看到所有发送的邮件和状态。

### 3. 邮件发送成功但样式不对

某些邮件客户端不支持所有 CSS。我们的模板已经针对主流邮件客户端优化：
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ 移动端邮件应用

---

## 📊 监控邮件发送

### Resend Dashboard

访问 [Resend Dashboard](https://resend.com/emails) 查看：
- 发送历史
- 送达率
- 打开率（如果启用）
- 错误日志

### 代码日志

Webhook 和测试脚本都会输出日志：

```
✅ Email sent successfully!
📬 Email ID: xxx-xxx-xxx
```

邮件发送失败不会阻止支付流程，只会记录错误：

```
❌ Failed to send confirmation email: [error details]
```

---

## 🚀 下一步

1. ✅ 测试三种语言的邮件
2. ✅ 检查邮件在不同邮箱客户端的显示效果
3. ✅ 完成一次完整的捐赠流程测试
4. ⏳ 生产环境上线后监控邮件送达率

---

## 📝 相关文件

- **邮件服务**: `lib/email/server.ts`
- **Webhook 集成**: `app/api/webhooks/wayforpay/route.ts`
- **测试脚本**: `scripts/test-email.ts`
- **环境配置**: `.env.local`

---

**最后更新**: 2025-12-19
**测试状态**: ✅ 已实现，待测试
