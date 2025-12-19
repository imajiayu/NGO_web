# DNS 验证 - 下一步操作

你已经成功在 nic.ua 添加了所有 DNS 记录！现在需要等待 DNS 生效并完成验证。

## ✅ 已完成的配置

你已经正确添加了以下 DNS 记录：

```
✅ resend._domainkey (TXT)  - DKIM 认证
✅ send (MX)                - 邮件路由
✅ send (TXT)               - SPF 认证
✅ _dmarc (TXT)             - DMARC 策略
```

## 🎯 你的发件域名

**重要信息**：你配置的发件域名是**子域名**：

```
send.waytofutureua.org.ua
```

**这意味着邮件将从以下地址发送：**
- ✅ `noreply@send.waytofutureua.org.ua`
- ✅ `donations@send.waytofutureua.org.ua`
- ✅ `support@send.waytofutureua.org.ua`

**为什么使用子域名？**
- 保护主域名 `waytofutureua.org.ua` 的邮件声誉
- 更好的邮件管理和监控
- 符合邮件发送最佳实践
- 如果邮件有问题不会影响主域名

## 📋 接下来的步骤

### 步骤 1: 等待 DNS 传播 ⏱️

**需要时间**: 15-60 分钟（通常 30 分钟）

你可以在等待期间继续下面的步骤。

### 步骤 2: 检查 DNS 是否生效 🔍

**方法 1: 使用在线工具**

访问 https://dnschecker.org

1. 输入：`resend._domainkey.waytofutureua.org.ua`
2. 类型选择：`TXT`
3. 点击 Search
4. 应该看到 DKIM 记录的值（`p=MIGfMA0GCSqG...`）

**方法 2: 使用命令行**

打开终端，运行：

```bash
# 检查 DKIM 记录
dig resend._domainkey.waytofutureua.org.ua TXT +short

# 检查 SPF 记录
dig send.waytofutureua.org.ua TXT +short

# 检查 DMARC 记录
dig _dmarc.waytofutureua.org.ua TXT +short
```

**期望结果：**

```bash
# DKIM 应该返回：
"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCql52Xkidcix1uIAu5XKdFJTdwRPke4n+Dmsfc6UYvEqNfm2YwGdcY0yFv84mBjkuYwQ9ohP5VAV4JLnX3kD1eZUhyEaB3J38qnlmIq2m0RDU1PJJAKdKYmTWRguQOPfQ5fuNx/dUHyh3JARD1g8UNqRr2YAbq2sDAdCJRUrUJlwIDAQAB"

# SPF 应该返回：
"v=spf1 include:amazonses.com ~all"

# DMARC 应该返回：
"v=DMARC1; p=none;"
```

### 步骤 3: 获取 Resend API Key 🔑

如果还没有获取 API Key：

1. 登录 Resend Dashboard
2. 点击左侧菜单 **"API Keys"**
3. 点击 **"Create API Key"**
4. 填写：
   - Name: `NGO Platform - Development`
   - Permission: **Sending access**
5. 点击 **"Create"**
6. **复制 API Key**（格式：`re_xxxxxxxxxx`）

⚠️ **重要**：API Key 只显示一次，请妥善保存！

### 步骤 4: 配置环境变量 ⚙️

编辑项目根目录的 `.env.local` 文件：

```bash
# 添加或更新这两行：
RESEND_API_KEY=re_你复制的实际API密钥
RESEND_FROM_EMAIL=noreply@send.waytofutureua.org.ua
```

**完整的 .env.local 示例：**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend (Email)
RESEND_API_KEY=re_你的实际密钥
RESEND_FROM_EMAIL=noreply@send.waytofutureua.org.ua

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 步骤 5: 在 Resend 验证域名 ✅

**等待 30 分钟后：**

1. 返回 Resend Dashboard
2. 点击左侧 **"Domains"**
3. 找到你的域名配置（应该显示 `send.waytofutureua.org.ua` 或类似）
4. 点击 **"Verify"** 按钮

**验证结果：**

✅ **成功**：
- 状态变为 **"Verified"**（绿色勾号）
- 可以开始发送邮件了！

❌ **失败**：
- 显示错误信息
- 可能需要再等待 30 分钟
- 检查 DNS 记录是否完全一致

### 步骤 6: 测试邮件发送 🧪

**启动开发服务器：**

```bash
npm run dev
```

**测试捐赠流程：**

1. 打开浏览器访问 `http://localhost:3000`
2. 进入捐赠页面
3. 填写捐赠信息（使用你的真实邮箱）
4. 使用 Stripe 测试卡支付：
   ```
   卡号: 4242 4242 4242 4242
   过期: 12/25
   CVC: 123
   邮编: 12345
   ```
5. 完成支付

**检查结果：**

1. ✅ 支付成功页面显示捐赠 ID
2. ✅ 收到确认邮件
3. ✅ 发件人显示：`noreply@send.waytofutureua.org.ua`
4. ✅ 邮件内容包含所有捐赠 ID
5. ✅ 邮件语言正确（英语/中文/乌克兰语）

**在 Resend Dashboard 检查：**

1. 访问 Resend Dashboard → Emails
2. 查看发送记录
3. 状态应该是 **"Delivered"**

## 🎉 完成！

验证成功并测试通过后，你的邮件系统就完全配置好了！

**你现在可以：**
- ✅ 从专业的邮件地址发送确认邮件
- ✅ 支持三种语言（英语、中文、乌克兰语）
- ✅ 自动在支付成功后发送邮件
- ✅ 包含所有捐赠 ID 和详细信息

## 📊 监控邮件发送

**在 Resend Dashboard 你可以：**

1. **查看所有已发送的邮件**
   - Dashboard → Emails

2. **监控发送状态**
   - Delivered（已送达）
   - Opened（已打开）
   - Bounced（退回）
   - Failed（失败）

3. **查看详细日志**
   - 点击具体邮件查看详情
   - 查看错误原因（如果有）

## 🔧 故障排除

### 问题 1: DNS 验证一直失败

**解决方法：**
1. 再等待 1-2 小时（DNS 传播需要时间）
2. 使用 `dig` 命令检查 DNS 是否生效
3. 检查 nic.ua 中的记录值是否完全一致
4. 确保没有多余的空格或引号

### 问题 2: 邮件发送失败

**检查清单：**
- [ ] API Key 是否正确配置
- [ ] 域名是否已验证（Resend Dashboard 显示 Verified）
- [ ] `RESEND_FROM_EMAIL` 是否使用 `send.waytofutureua.org.ua` 子域名
- [ ] Resend 是否有足够的发送额度

### 问题 3: 邮件进垃圾箱

**改善方法：**
1. ✅ 确认 DMARC 记录已添加
2. ✅ 从小量开始发送
3. ✅ 让测试用户添加发件人到通讯录
4. ✅ 确保邮件内容专业且有价值

### 问题 4: 收不到测试邮件

**排查步骤：**
1. 检查垃圾邮件文件夹
2. 在 Resend Dashboard 查看发送状态
3. 确认 webhook 成功执行（查看 Vercel 或本地日志）
4. 确认 `.env.local` 中的配置正确

## 📞 需要帮助？

**Resend 支持：**
- 📚 文档：https://resend.com/docs
- 💬 Discord：https://resend.com/discord
- 📧 邮箱：support@resend.com

**nic.ua 支持：**
- 📧 邮箱：support@nic.ua
- 📞 电话：+380 44 583 5861

---

## 🎯 快速命令参考

**检查 DNS：**
```bash
dig resend._domainkey.waytofutureua.org.ua TXT +short
dig send.waytofutureua.org.ua TXT +short
dig _dmarc.waytofutureua.org.ua TXT +short
```

**启动开发服务器：**
```bash
npm run dev
```

**查看环境变量：**
```bash
cat .env.local
```

---

**你的配置：**
- **域名**: `waytofutureua.org.ua`
- **发件子域名**: `send.waytofutureua.org.ua`
- **推荐发件地址**: `noreply@send.waytofutureua.org.ua`
- **DNS 提供商**: nic.ua
- **邮件服务**: Resend

**最后更新**: 2024-12-19
