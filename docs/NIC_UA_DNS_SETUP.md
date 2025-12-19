# nic.ua DNS 配置指南 - 为 Resend 邮件服务添加 DNS 记录

本指南专门针对在 **nic.ua** 购买的域名 `waytofutureua.org.ua`，教你如何添加 Resend 邮件服务所需的 DNS 记录。

## 📋 操作流程总览

1. ✅ 注册 Resend 账号并添加域名
2. ✅ 在 nic.ua 登录并找到域名管理
3. ✅ 添加 3 条 DNS TXT 记录
4. ✅ 等待 DNS 生效并验证
5. ✅ 开始发送邮件

---

## 第一步：在 Resend 添加域名

### 1.1 注册 Resend 账号

1. 访问 https://resend.com
2. 点击右上角 **"Sign Up"**
3. 使用你的邮箱注册（建议用 Gmail 或你的常用邮箱）
4. 验证邮箱地址

### 1.2 添加域名到 Resend

1. 登录后，点击左侧菜单 **"Domains"**
2. 点击 **"Add Domain"** 按钮
3. 输入你的域名：`waytofutureua.org.ua`
4. 点击 **"Add"**

### 1.3 查看 DNS 记录

添加域名后，Resend 会显示需要添加的 DNS 记录。

**你会看到类似这样的信息：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 SPF Record
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type:  TXT
Name:  @ (or leave empty)
Value: v=spf1 include:_spf.resend.com ~all
TTL:   Auto
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 DKIM Record
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type:  TXT
Name:  resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (很长的一串)
TTL:   Auto
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DMARC Record (可选但推荐)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@waytofutureua.org.ua
TTL:   Auto
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**⚠️ 重要：保持这个页面打开！** 我们需要从这里复制 DNS 记录的值。

---

## 第二步：在 nic.ua 添加 DNS 记录

### 2.1 登录 nic.ua

1. 访问 https://nic.ua
2. 点击右上角 **"Вхід"** (登录)
3. 输入你的账号和密码登录

### 2.2 进入域名管理

1. 登录后，你会看到仪表板（Dashboard）
2. 找到并点击 **"Мої домени"** (我的域名) 或 **"My Domains"**
3. 在域名列表中找到 `waytofutureua.org.ua`
4. 点击域名进入管理页面

### 2.3 进入 DNS 管理

在域名管理页面：

1. 找到 **"DNS-сервер"** (DNS Server) 或 **"DNS Management"** 选项
2. 点击 **"Керування DNS"** (DNS Management) 或 **"Manage DNS"**
3. 如果看到选择 DNS 服务器类型，选择 **"Використовувати DNS-сервери NIC.UA"** (使用 NIC.UA DNS 服务器)

### 2.4 添加 DNS 记录

#### 📝 添加第 1 条记录：SPF

1. 找到 **"Додати запис"** (添加记录) 或 **"Add Record"** 按钮
2. 填写以下信息：

   **字段说明（nic.ua 可能使用乌克兰语）：**
   - **Тип запису** (记录类型): 选择 `TXT`
   - **Ім'я** (名称/Name): 输入 `@` 或留空
   - **Значення** (值/Value): 复制粘贴
     ```
     v=spf1 include:_spf.resend.com ~all
     ```
   - **TTL**: 使用默认值 (通常是 3600 或 Auto)

3. 点击 **"Зберегти"** (保存) 或 **"Save"**

#### 🔐 添加第 2 条记录：DKIM

1. 再次点击 **"Додати запис"** (添加记录)
2. 填写：

   - **Тип запису** (记录类型): `TXT`
   - **Ім'я** (名称): `resend._domainkey`
   - **Значення** (值): 从 Resend 页面复制完整的 DKIM 值
     ```
     p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (完整的长字符串)
     ```
   - **TTL**: 默认值

3. 点击 **"Зберегти"** (保存)

#### 📊 添加第 3 条记录：DMARC (推荐)

1. 再次点击 **"Додати запис"** (添加记录)
2. 填写：

   - **Тип запису** (记录类型): `TXT`
   - **Ім'я** (名称): `_dmarc`
   - **Значення** (值):
     ```
     v=DMARC1; p=none; rua=mailto:dmarc@waytofutureua.org.ua
     ```
   - **TTL**: 默认值

3. 点击 **"Зберегти"** (保存)

### 2.5 检查添加的记录

添加完成后，你应该能看到 3 条新的 TXT 记录：

```
类型    名称                      值
────────────────────────────────────────────────────────────
TXT     @                        v=spf1 include:_spf.resend.com ~all
TXT     resend._domainkey        p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...
TXT     _dmarc                   v=DMARC1; p=none; rua=mailto:dmarc@...
```

✅ **确认所有记录都已保存！**

---

## 第三步：等待 DNS 生效

### DNS 传播时间

- ⏱️ **通常需要**: 15-30 分钟
- 🌍 **最长可能**: 2-24 小时（极少情况）
- 🇺🇦 **nic.ua 特点**: 通常比较快，30 分钟内生效

### 检查 DNS 是否生效

**方法 1: 使用在线工具**

访问 https://dnschecker.org

1. 在搜索框输入: `waytofutureua.org.ua`
2. 记录类型选择: `TXT`
3. 点击 **"Search"**
4. 查看全球各地的 DNS 服务器是否能看到你的记录

**方法 2: 使用命令行 (macOS/Linux)**

打开终端，运行：

```bash
# 检查 SPF 记录
dig waytofutureua.org.ua TXT +short

# 检查 DKIM 记录
dig resend._domainkey.waytofutureua.org.ua TXT +short

# 检查 DMARC 记录
dig _dmarc.waytofutureua.org.ua TXT +short
```

如果看到正确的值，说明 DNS 已生效！

**方法 3: 使用 MXToolbox**

访问 https://mxtoolbox.com/TXTLookup.aspx

1. 输入: `waytofutureua.org.ua`
2. 查看是否显示 SPF 记录
3. 同样检查 `resend._domainkey.waytofutureua.org.ua` 和 `_dmarc.waytofutureua.org.ua`

---

## 第四步：在 Resend 验证域名

### 4.1 等待 DNS 生效

**建议等待 30 分钟后再验证**

你可以在等待期间继续获取 API Key（见下一步）。

### 4.2 验证域名

1. 返回 Resend Dashboard
2. 点击左侧 **"Domains"**
3. 找到 `waytofutureua.org.ua`
4. 点击 **"Verify"** 按钮

### 4.3 验证结果

**✅ 成功：**
- 域名状态变为 **"Verified"** (绿色勾号)
- 现在可以从 `noreply@waytofutureua.org.ua` 发送邮件了！

**❌ 失败：**
- 显示错误信息
- 可能原因：
  - DNS 还没生效（等待更长时间）
  - DNS 记录值不正确（检查是否完全一致）
  - DNS 记录名称错误

**如果失败：**
1. 再等待 30 分钟
2. 使用上面的工具检查 DNS 是否生效
3. 检查 nic.ua 中的记录是否正确
4. 再次点击 "Verify"

---

## 第五步：获取 Resend API Key

### 5.1 创建 API Key

1. 在 Resend Dashboard，点击左侧 **"API Keys"**
2. 点击 **"Create API Key"** 按钮
3. 填写信息：
   - **Name**: `NGO Platform - Development`
   - **Permission**: 选择 **"Sending access"**
4. 点击 **"Create"**

### 5.2 保存 API Key

1. 复制显示的 API Key（格式：`re_xxxxxxxxxx`）
2. **⚠️ 重要**: 这个 Key 只显示一次，请妥善保存！
3. 如果丢失，需要删除并重新创建

### 5.3 配置项目环境变量

在你的项目根目录，编辑 `.env.local` 文件：

```bash
# 添加或更新这两行：

RESEND_API_KEY=re_你复制的实际API_Key
RESEND_FROM_EMAIL=noreply@waytofutureua.org.ua
```

**注意事项：**
- ✅ 如果域名已验证：用 `noreply@waytofutureua.org.ua`
- ⏳ 如果域名还在等待验证：先用 `onboarding@resend.dev`

---

## 第六步：测试邮件发送

### 6.1 启动开发服务器

```bash
npm run dev
```

### 6.2 测试捐赠流程

1. 打开浏览器访问 `http://localhost:3000`
2. 选择语言（英语/中文/乌克兰语）
3. 进入捐赠页面
4. 填写捐赠信息：
   - 选择项目
   - 输入数量
   - **邮箱地址**: 使用你的真实邮箱（用来接收测试邮件）
   - 填写其他信息

5. 使用 Stripe 测试卡支付：
   ```
   卡号: 4242 4242 4242 4242
   过期日期: 任意未来日期 (如 12/25)
   CVC: 任意 3 位数字 (如 123)
   邮编: 任意 (如 12345)
   ```

6. 完成支付

### 6.3 检查邮件

**查看邮箱：**
- ✅ 应该收到一封捐赠确认邮件
- ✅ 发件人是 `noreply@waytofutureua.org.ua`（如果域名已验证）
- ✅ 邮件语言与你选择的语言一致
- ✅ 包含所有捐赠 ID

**检查 Resend Dashboard：**
1. 访问 Resend Dashboard → Emails
2. 查看发送记录
3. 确认状态为 **"Delivered"**

---

## 常见问题解答

### Q1: nic.ua 界面是乌克兰语，看不懂怎么办？

**A: 关键术语对照表：**

| 乌克兰语 | 英语 | 中文 |
|---------|------|------|
| Вхід | Login | 登录 |
| Мої домени | My Domains | 我的域名 |
| DNS-сервер | DNS Server | DNS 服务器 |
| Керування DNS | DNS Management | DNS 管理 |
| Додати запис | Add Record | 添加记录 |
| Тип запису | Record Type | 记录类型 |
| Ім'я | Name | 名称 |
| Значення | Value | 值 |
| Зберегти | Save | 保存 |

大多数浏览器（Chrome、Edge）可以右键选择"翻译成中文"。

### Q2: 添加 DNS 记录时找不到 TXT 类型？

**A:** nic.ua 支持 TXT 记录，可能显示为：
- `TXT`
- `Текстовий запис`
- 下拉菜单中选择

如果真的找不到，请联系 nic.ua 客服。

### Q3: DNS 记录的"名称"应该填什么？

**A: 详细说明：**

| 记录 | 在 nic.ua 填写 | 最终域名 |
|-----|--------------|---------|
| SPF | `@` 或留空 | waytofutureua.org.ua |
| DKIM | `resend._domainkey` | resend._domainkey.waytofutureua.org.ua |
| DMARC | `_dmarc` | _dmarc.waytofutureua.org.ua |

**注意**：有些 DNS 管理界面需要填写完整域名（如 `resend._domainkey.waytofutureua.org.ua`），有些只需要填写前缀（如 `resend._domainkey`）。nic.ua 通常是后者。

### Q4: 验证一直失败怎么办？

**A: 排查步骤：**

1. **等待更长时间**（2-4 小时）
2. **检查 DNS 记录**：
   ```bash
   dig resend._domainkey.waytofutureua.org.ua TXT +short
   ```
   应该看到 DKIM 值

3. **检查拼写**：
   - DNS 记录的值必须**完全一致**
   - 不能有额外的空格或换行
   - 引号不要复制进去

4. **联系 nic.ua 客服**：
   - 邮箱: support@nic.ua
   - 电话: +380 44 583 5861

### Q5: 可以不添加 DMARC 记录吗？

**A:** 可以，但**强烈建议添加**：
- SPF + DKIM：必需（邮件才能发送）
- DMARC：可选但推荐（提高送达率，减少进垃圾箱）

没有 DMARC 也能验证域名和发送邮件。

### Q6: 邮件发送成功但进了垃圾箱？

**A: 改善方法：**
1. ✅ 确保添加了 DMARC 记录
2. ✅ 从小量开始发送（不要一开始就大量发送）
3. ✅ 邮件内容专业且有价值
4. ✅ 让测试用户把发件人添加到通讯录
5. ✅ 避免垃圾邮件常用词（"免费"、"中奖"等）

Resend 的送达率很高，正确配置后很少进垃圾箱。

---

## 🎉 配置完成！

完成以上步骤后，你的邮件系统就完全配置好了：

✅ 域名 `waytofutureua.org.ua` 已在 Resend 验证
✅ DNS 记录正确配置
✅ API Key 已获取并配置
✅ 邮件发送测试成功
✅ 可以从 `noreply@waytofutureua.org.ua` 发送专业邮件

---

## 需要帮助？

**nic.ua 支持：**
- 📧 Email: support@nic.ua
- 📞 电话: +380 44 583 5861
- 🌐 网站: https://nic.ua/help

**Resend 支持：**
- 📚 文档: https://resend.com/docs
- 💬 Discord: https://resend.com/discord
- 📧 Email: support@resend.com

---

**域名**: `waytofutureua.org.ua`
**注册商**: nic.ua
**邮件服务**: Resend
**发件地址**: `noreply@waytofutureua.org.ua`
**最后更新**: 2024-12-19
