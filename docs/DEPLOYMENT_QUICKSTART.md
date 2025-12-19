# 🚀 快速部署指南 / Quick Deployment Guide

## 一键准备部署 / One-Click Deployment Preparation

只需运行一个命令，即可自动检查和准备部署：

```bash
npm run prepare:deploy
```

这个命令会自动：
1. ✅ 检查所有必需的环境变量
2. ✅ 测试项目构建
3. ✅ 检查 Git 状态
4. ✅ 提交并推送代码（如果需要）
5. ✅ 显示 Vercel 配置的环境变量列表

---

## 📋 部署步骤（3步完成）

### 步骤 1：准备代码

```bash
# 1. 运行准备脚本
npm run prepare:deploy

# 按照提示操作，脚本会自动检查和提交代码
```

### 步骤 2：在 Vercel 导入项目

1. 访问 **https://vercel.com**
2. 使用 GitHub 账号登录
3. 点击 **"Add New..."** → **"Project"**
4. 选择你的 `NGO_web` 仓库
5. 点击 **"Import"**

### 步骤 3：配置环境变量

在 Vercel 项目设置页面，添加以下环境变量：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...

# WayForPay
WAYFORPAY_MERCHANT_ACCOUNT=你的商户账号
WAYFORPAY_SECRET_KEY=你的密钥

# Resend
RESEND_API_KEY=re_你的API密钥
RESEND_FROM_EMAIL=noreply@send.waytofutureua.org.ua

# App URL（部署后更新为实际域名）
NEXT_PUBLIC_APP_URL=https://你的项目名.vercel.app
```

**然后点击 "Deploy" 按钮！** 🎉

---

## 🔒 关于 HTTPS

### ✅ 完全自动化！

Vercel 会自动为你的项目：
- ✅ 提供免费 SSL/TLS 证书（Let's Encrypt）
- ✅ 启用 HTTPS
- ✅ 自动续期证书
- ✅ 将所有 HTTP 流量重定向到 HTTPS

**你不需要任何额外配置！** 部署完成后，你的网站就已经是 HTTPS 了。

---

## 🌐 使用自定义域名

如果你想使用 `waytofutureua.org.ua` 而不是 Vercel 默认域名：

### 在 Vercel 中添加域名

1. 进入项目 → Settings → Domains
2. 输入 `waytofutureua.org.ua`
3. 点击 "Add"

### 配置 DNS（选择其中一种）

**方式 A：A 记录**
```
类型: A
名称: @
值: 76.76.21.21
TTL: 自动
```

**方式 B：CNAME 记录**
```
类型: CNAME
名称: www
值: cname.vercel-dns.com
TTL: 自动
```

### 等待生效

- DNS 传播需要 5-10 分钟
- Vercel 会自动为你的域名签发 SSL 证书
- 完成后你的网站就可以通过 `https://waytofutureua.org.ua` 访问了

---

## ⚙️ 部署后必做事项

### 1. 更新 APP_URL

在 Vercel 项目设置中，更新环境变量：

```bash
NEXT_PUBLIC_APP_URL=https://你的实际域名.vercel.app
```

然后在 Vercel 界面点击 "Redeploy" 重新部署。

### 2. 更新 WayForPay Webhook

在 WayForPay 商户后台，更新 webhook URL：

```
https://你的域名.vercel.app/api/webhooks/wayforpay
```

### 3. 验证 Resend 域名

如果使用自定义域名发送邮件，需要在 DNS 中添加：

```
# SPF 记录
类型: TXT
名称: @
值: v=spf1 include:_spf.resend.com ~all

# DKIM 记录（从 Resend 后台获取）
类型: TXT
名称: resend._domainkey
值: [Resend 提供的值]

# DMARC 记录（推荐）
类型: TXT
名称: _dmarc
值: v=DMARC1; p=none; rua=mailto:admin@waytofutureua.org.ua
```

---

## ✅ 测试清单

部署完成后，逐项测试：

- [ ] 访问首页：`https://你的域名/en`
- [ ] 访问捐赠页面：`https://你的域名/en/donate`
- [ ] 语言切换（en/zh/ua）
- [ ] 完成一笔测试捐赠
- [ ] 验证 HTTPS（浏览器显示🔒）
- [ ] 检查邮件是否收到
- [ ] 测试所有页面
- [ ] 检查浏览器控制台是否有错误

---

## 🆘 遇到问题？

### 构建失败
```bash
# 本地测试构建
npm run build

# 检查是否有 TypeScript 错误
npm run type-check
```

### 页面 500 错误
1. 检查 Vercel 函数日志
2. 验证环境变量是否正确
3. 确认 Supabase 连接正常

### 支付失败
1. 确认 WayForPay webhook URL 已更新
2. 检查 `WAYFORPAY_SECRET_KEY` 是否正确
3. 查看 Vercel 函数日志

### 邮件发送失败
1. 验证 Resend 域名
2. 添加必需的 DNS 记录
3. 等待 DNS 传播（最多 48 小时）

---

## 📚 详细文档

需要更多信息？查看完整指南：

- **完整部署指南**：[docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)
- **技术文档**：[CLAUDE.md](CLAUDE.md)
- **Supabase 配置**：[docs/SUPABASE_CLI_GUIDE.md](docs/SUPABASE_CLI_GUIDE.md)
- **故障排除**：[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🎉 完成！

恭喜！你的 NGO 平台现在已经：
- ✅ 部署在 Vercel 全球 CDN
- ✅ 使用 HTTPS 加密保护
- ✅ 自动续期 SSL 证书
- ✅ 支持多语言访问
- ✅ 集成支付和邮件功能

**你的网站**：`https://你的域名.vercel.app` 🚀
