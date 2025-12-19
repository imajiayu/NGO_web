# Vercel 部署指南 / Vercel Deployment Guide

## 🚀 部署步骤 / Deployment Steps

### 第一步：准备代码仓库

1. **提交所有更改到 Git**

```bash
# 查看修改的文件
git status

# 添加所有修改
git add .

# 提交更改
git commit -m "🚀 Ready for Vercel deployment with HTTPS"

# 推送到 GitHub（如果还没有推送）
git push origin master
```

2. **确保代码已推送到 GitHub**
   - 如果还没有 GitHub 仓库，需要先创建一个
   - 访问 https://github.com/new 创建新仓库
   - 按照 GitHub 提示将本地仓库推送到远程

---

### 第二步：导入项目到 Vercel

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `NGO_web`
   - 点击 "Import"

3. **配置项目**
   - **Project Name**: 可以保持默认或自定义
   - **Framework Preset**: 应该自动检测为 "Next.js"
   - **Root Directory**: 保持默认 `./`
   - **Build Command**: 保持默认 `npm run build`
   - **Output Directory**: 保持默认 `.next`

---

### 第三步：配置环境变量 ⚠️ 重要！

在 Vercel 项目设置中，添加以下环境变量：

#### Supabase 配置

```bash
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### WayForPay 配置

```bash
WAYFORPAY_MERCHANT_ACCOUNT=你的商户账号
WAYFORPAY_SECRET_KEY=你的密钥
```

#### Resend 邮件配置

```bash
RESEND_API_KEY=re_你的API密钥
RESEND_FROM_EMAIL=noreply@send.waytofutureua.org.ua
```

#### 应用 URL

```bash
NEXT_PUBLIC_APP_URL=https://你的域名.vercel.app
```

**注意**：部署后，你会得到一个 Vercel 域名（如 `your-project.vercel.app`），需要将这个域名填入 `NEXT_PUBLIC_APP_URL`。

---

### 第四步：部署

点击 "Deploy" 按钮，Vercel 会自动：
1. ✅ 克隆你的代码
2. ✅ 安装依赖 (`npm install`)
3. ✅ 构建项目 (`npm run build`)
4. ✅ 部署到全球 CDN
5. ✅ **自动启用 HTTPS**（使用 Let's Encrypt 免费证书）

部署通常需要 2-3 分钟。

---

## 🔒 HTTPS 配置

### Vercel 默认 HTTPS

Vercel 为所有项目自动提供：
- ✅ 免费的 SSL/TLS 证书（Let's Encrypt）
- ✅ 自动续期证书
- ✅ HTTP 自动重定向到 HTTPS
- ✅ 现代 TLS 1.3 支持
- ✅ HSTS（HTTP Strict Transport Security）

**你不需要做任何额外配置！** 所有流量都会自动通过 HTTPS 加密。

### 自定义域名的 HTTPS

如果你想使用自己的域名（如 `waytofutureua.org.ua`）：

1. **在 Vercel 项目设置中添加域名**
   - 进入项目 → Settings → Domains
   - 输入你的域名
   - 点击 "Add"

2. **配置 DNS 记录**

   在你的域名注册商处（如 Cloudflare, GoDaddy 等）添加：

   **选项 A：使用 A 记录**
   ```
   类型: A
   名称: @
   值: 76.76.21.21
   ```

   **选项 B：使用 CNAME 记录**
   ```
   类型: CNAME
   名称: www
   值: cname.vercel-dns.com
   ```

3. **等待 DNS 传播**
   - 通常需要 5-10 分钟
   - 最多可能需要 24-48 小时

4. **Vercel 自动配置 HTTPS**
   - DNS 生效后，Vercel 会自动为你的域名签发 SSL 证书
   - 证书会自动续期

---

## ⚙️ 部署后配置

### 1. 更新 WayForPay Webhook URL

在 WayForPay 商户后台，更新 webhook URL：

```
旧: http://localhost:3000/api/webhooks/wayforpay
新: https://你的域名.vercel.app/api/webhooks/wayforpay
```

### 2. 更新 Resend 域名验证

如果你使用自定义域名，需要在 DNS 中添加 Resend 的验证记录：

```
类型: TXT
名称: resend._domainkey
值: [Resend 提供的值]

类型: TXT
名称: @
值: v=spf1 include:_spf.resend.com ~all
```

### 3. 更新环境变量中的 APP_URL

在 Vercel 项目设置中，更新 `NEXT_PUBLIC_APP_URL`：

```bash
NEXT_PUBLIC_APP_URL=https://你的实际域名.vercel.app
```

然后重新部署（Vercel → Deployments → 最新部署 → 右上角菜单 → Redeploy）

---

## ✅ 测试清单

部署完成后，测试以下功能：

- [ ] 访问首页 `https://你的域名/en`
- [ ] 访问捐赠页面 `https://你的域名/en/donate`
- [ ] 测试语言切换（en/zh/ua）
- [ ] 测试捐赠流程（使用测试卡）
- [ ] 验证 HTTPS 证书（浏览器地址栏显示🔒）
- [ ] 测试 WayForPay webhook（完成一笔测试支付）
- [ ] 验证邮件发送（检查收件箱）
- [ ] 测试项目页面
- [ ] 检查所有图片加载正常

---

## 🔧 常见问题

### Q1: 部署失败，提示 "Build failed"

**原因**：可能是缺少环境变量或构建错误

**解决方案**：
1. 检查 Vercel 构建日志
2. 确保所有环境变量都已配置
3. 本地运行 `npm run build` 检查是否有错误

### Q2: 页面显示 500 错误

**原因**：Supabase 连接失败或环境变量配置错误

**解决方案**：
1. 检查 Vercel 项目设置中的环境变量
2. 验证 Supabase URL 和密钥是否正确
3. 查看 Vercel 函数日志（Functions → Logs）

### Q3: WayForPay 支付失败

**原因**：Webhook URL 未更新或签名验证失败

**解决方案**：
1. 在 WayForPay 后台更新 webhook URL 为 HTTPS 地址
2. 检查 `WAYFORPAY_SECRET_KEY` 是否正确
3. 查看 Vercel 函数日志检查 webhook 请求

### Q4: 邮件发送失败

**原因**：Resend API 密钥错误或域名未验证

**解决方案**：
1. 在 Resend 后台验证域名
2. 添加所需的 DNS 记录（SPF, DKIM, DMARC）
3. 等待 DNS 传播（最多 48 小时）
4. 测试邮件发送：`npm run test:email`

### Q5: 图片无法加载

**原因**：Supabase Storage 配置或 CORS 问题

**解决方案**：
1. 检查 `next.config.js` 中的 `remotePatterns` 配置
2. 在 Supabase 项目中配置 Storage CORS
3. 确保图片 bucket 是公开的（或配置了正确的 RLS 策略）

### Q6: 自定义域名显示 "域名配置错误"

**原因**：DNS 配置未生效或配置错误

**解决方案**：
1. 使用 `dig` 或 `nslookup` 检查 DNS 记录
   ```bash
   dig 你的域名.com
   ```
2. 等待 DNS 传播（可能需要 24-48 小时）
3. 确保 DNS 记录指向正确的 Vercel IP 或 CNAME

---

## 📊 监控和维护

### Vercel 自带的监控工具

1. **Analytics（分析）**
   - 访问量统计
   - 页面性能指标
   - Web Vitals

2. **Logs（日志）**
   - 实时函数日志
   - 错误追踪
   - Webhook 请求日志

3. **Speed Insights（速度洞察）**
   - 真实用户性能数据
   - 页面加载时间
   - 优化建议

### 推荐的额外监控工具

- **Sentry**: 错误追踪和监控
- **PostHog**: 产品分析
- **UptimeRobot**: 网站可用性监控

---

## 🔄 持续部署

Vercel 会自动监听你的 GitHub 仓库：

- ✅ 推送到 `master` 分支 → 自动部署到生产环境
- ✅ 推送到其他分支 → 自动部署预览环境
- ✅ Pull Request → 自动生成预览链接

每次推送代码后，Vercel 会自动：
1. 运行构建
2. 运行测试（如果配置了）
3. 部署新版本
4. 更新 HTTPS 证书（如果需要）

---

## 📝 部署检查清单

部署前确认：

- [ ] 所有代码已提交到 Git
- [ ] 所有环境变量已准备好
- [ ] 本地运行 `npm run build` 成功
- [ ] `.env.local` 文件已添加到 `.gitignore`
- [ ] 数据库迁移已应用到生产环境
- [ ] Supabase RLS 策略已启用

部署后确认：

- [ ] 网站可以通过 HTTPS 访问
- [ ] 所有页面正常加载
- [ ] 捐赠流程完整可用
- [ ] Webhook 接收正常
- [ ] 邮件发送成功
- [ ] 多语言切换正常
- [ ] 浏览器控制台无错误

---

## 🎉 完成！

恭喜！你的 NGO 平台现在已经通过 HTTPS 安全地部署在 Vercel 上了。

**你的网站地址**：
- Vercel 域名：`https://你的项目名.vercel.app`
- 自定义域名：`https://waytofutureua.org.ua`

**安全特性**：
- 🔒 全站 HTTPS 加密
- 🛡️ 自动 SSL/TLS 证书续期
- 🚀 全球 CDN 加速
- ⚡ 边缘函数优化

---

**文档版本**: v1.0
**最后更新**: 2025-12-19
**相关文档**:
- [CLAUDE.md](../CLAUDE.md) - 技术文档
- [SUPABASE_CLI_GUIDE.md](./SUPABASE_CLI_GUIDE.md) - Supabase 配置指南
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 故障排除
