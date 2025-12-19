# Resend 域名配置指南 - waytofutureua.org.ua

本指南将帮助你在 Resend 中配置你的域名 `waytofutureua.org.ua`，以便从你自己的域名发送邮件。

## 为什么需要配置域名？

- ✅ **提高送达率**：从你自己的域名发送邮件更可信
- ✅ **专业形象**：使用 `noreply@waytofutureua.org.ua` 而不是 `onboarding@resend.dev`
- ✅ **无限制发送**：验证域名后可以发送无限量邮件（免费版每月3000封）
- ✅ **品牌一致性**：邮件地址与你的网站域名匹配

## 步骤 1: 在 Resend 添加域名

1. 登录 [Resend Dashboard](https://resend.com/login)
2. 点击左侧菜单的 **"Domains"**
3. 点击 **"Add Domain"** 按钮
4. 输入你的域名：`waytofutureua.org.ua`
5. 点击 **"Add"**

## 步骤 2: 获取 DNS 记录

添加域名后，Resend 会显示需要添加的 DNS 记录。你会看到类似这样的记录：

### SPF 记录（必需）
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

### DKIM 记录（必需）
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN... (很长的字符串)
```

### DMARC 记录（推荐）
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@waytofutureua.org.ua
```

**重要提示**：实际的值会在 Resend 仪表板中显示，请使用 Resend 提供的确切值。

## 步骤 3: 添加 DNS 记录到你的域名注册商

你需要在你购买 `waytofutureua.org.ua` 域名的地方添加这些 DNS 记录。

### 常见域名注册商设置方法：

#### 如果你在 Namecheap
1. 登录 Namecheap
2. 进入 "Domain List" → 选择 `waytofutureua.org.ua`
3. 点击 "Manage"
4. 选择 "Advanced DNS" 标签
5. 点击 "Add New Record"
6. 逐个添加上面的 DNS 记录

#### 如果你在 Cloudflare
1. 登录 Cloudflare
2. 选择 `waytofutureua.org.ua` 域名
3. 进入 "DNS" 标签
4. 点击 "Add record"
5. 逐个添加上面的 DNS 记录
6. **重要**：确保 "Proxy status" 设置为 "DNS only"（灰色云朵）

#### 如果你在 GoDaddy
1. 登录 GoDaddy
2. 进入 "My Products" → "Domains"
3. 点击你的域名 `waytofutureua.org.ua` 旁边的 "DNS"
4. 滚动到 "Records" 部分
5. 点击 "Add"
6. 逐个添加上面的 DNS 记录

#### 如果你在其他注册商
一般步骤都类似：
1. 找到 DNS 管理或 DNS 设置页面
2. 添加新的 TXT 记录
3. 输入 Name 和 Value
4. 保存

### DNS 记录添加示例

**SPF 记录：**
- Record Type: `TXT`
- Host/Name: `@` 或留空
- Value: `v=spf1 include:_spf.resend.com ~all`
- TTL: `Auto` 或 `3600`

**DKIM 记录：**
- Record Type: `TXT`
- Host/Name: `resend._domainkey`
- Value: (从 Resend 复制的长字符串)
- TTL: `Auto` 或 `3600`

**DMARC 记录：**
- Record Type: `TXT`
- Host/Name: `_dmarc`
- Value: `v=DMARC1; p=none; rua=mailto:dmarc@waytofutureua.org.ua`
- TTL: `Auto` 或 `3600`

## 步骤 4: 等待 DNS 传播

添加 DNS 记录后：
- ⏱️ **通常需要 5-30 分钟**才能生效
- 🌍 有时可能需要长达 48 小时（但很少见）
- 🔍 你可以使用在线工具检查：[DNSChecker.org](https://dnschecker.org)

## 步骤 5: 在 Resend 验证域名

1. 返回 Resend Dashboard 的 Domains 页面
2. 找到 `waytofutureua.org.ua`
3. 点击 **"Verify"** 按钮
4. 如果 DNS 记录正确，状态会变为 **"Verified"** ✅
5. 如果验证失败，等待几分钟后再试

## 步骤 6: 测试邮件发送

验证成功后，测试发送邮件：

### 方法 1: 使用 Resend Dashboard
1. 在 Resend Dashboard 点击 "Emails" → "Send Email"
2. From: `noreply@waytofutureua.org.ua`
3. To: 你的个人邮箱
4. Subject: `Test Email`
5. Body: `This is a test`
6. 点击 Send
7. 检查邮箱是否收到

### 方法 2: 使用你的应用
1. 确保 `.env.local` 已设置：
   ```bash
   RESEND_FROM_EMAIL=noreply@waytofutureua.org.ua
   ```
2. 启动应用并完成一次测试捐赠
3. 检查是否收到确认邮件

## 常见问题

### Q: 验证一直失败怎么办？

**A: 请检查：**
1. DNS 记录的值是否完全一致（包括空格）
2. Record Name 是否正确（有些注册商需要完整域名，如 `resend._domainkey.waytofutureua.org.ua`）
3. 是否已等待足够时间（至少 30 分钟）
4. 使用 [MXToolbox](https://mxtoolbox.com/TXTLookup.aspx) 检查 DNS 记录

### Q: 我的域名注册商没有列在上面？

**A:** 所有域名注册商都支持添加 TXT 记录，只是界面不同。查找：
- "DNS Settings"
- "DNS Management"
- "Advanced DNS"
- "Name Server"
类似的菜单，通常都能找到添加记录的地方。

### Q: 可以使用子域名吗？

**A:** 可以！如果你想用子域名（如 `mail.waytofutureua.org.ua`），可以这样：
1. 在 Resend 添加 `mail.waytofutureua.org.ua`
2. DNS 记录的 Name 会稍有不同
3. 发送邮件地址变为 `noreply@mail.waytofutureua.org.ua`

### Q: DMARC 记录是必需的吗？

**A:** 不是必需，但**强烈推荐**：
- 提高邮件送达率
- 防止他人冒用你的域名发送垃圾邮件
- 接收滥用报告

### Q: 验证成功后多久能发送邮件？

**A:** 立即！验证成功后就可以从 `noreply@waytofutureua.org.ua` 发送邮件了。

### Q: 邮件会进入垃圾箱吗？

**A:** 如果正确配置 SPF、DKIM 和 DMARC，进入垃圾箱的概率很低。建议：
- 从小量开始发送（逐步增加）
- 避免垃圾邮件常用词
- 内容有价值且专业
- 提供取消订阅选项（如适用）

## 推荐的邮件地址设置

验证域名后，你可以使用以下邮件地址：

### 自动化邮件（推荐用于捐赠确认）
```
noreply@waytofutureua.org.ua
```
- 清楚表明这是自动邮件
- 不需要处理回复

### 捐赠相关
```
donations@waytofutureua.org.ua
```
- 用于捐赠确认和收据
- 可以设置为转发到真实邮箱接收回复

### 客服支持
```
support@waytofutureua.org.ua
```
- 用于客户服务邮件
- 应该设置转发以便接收回复

### 通用信息
```
info@waytofutureua.org.ua
contact@waytofutureua.org.ua
```
- 用于一般性通知
- 可以在网站上公开显示

**注意**：你不需要真正创建这些邮箱，Resend 只负责发送。如果需要接收回复，可以在你的域名注册商或邮箱服务商设置邮件转发。

## 后续步骤

✅ **完成域名验证后：**
1. 更新 `.env.local`:
   ```bash
   RESEND_FROM_EMAIL=noreply@waytofutureua.org.ua
   ```
2. 在 Vercel 添加环境变量（生产环境）
3. 测试完整的捐赠流程
4. 监控邮件发送日志

## 需要帮助？

- 📚 Resend 文档：https://resend.com/docs/dashboard/domains/introduction
- 💬 Resend Discord：https://resend.com/discord
- 📧 Resend 支持：support@resend.com
- 🔍 DNS 检查工具：https://dnschecker.org

---

**你的域名**：`waytofutureua.org.ua`
**推荐发送地址**：`noreply@waytofutureua.org.ua`
**最后更新**：2024-12-19
