# 邮件订阅系统测试指南

## 📧 测试准备

### 1. 环境变量检查

确保以下环境变量已配置：

```bash
# Resend API（邮件发送）
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 本地测试
# 或
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # 生产环境
```

### 2. 数据库迁移确认

```bash
# 确认 email_subscriptions 表已创建
psql -d your_database -c "\d email_subscriptions"
```

---

## 🧪 测试流程

### 测试 1: 用户订阅功能

**步骤**：

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问捐赠页面：
   ```
   http://localhost:3000/en/donate
   ```

3. 选择任意项目

4. 填写捐赠表单，勾选订阅复选框：
   - 输入测试邮箱（使用您能接收的真实邮箱）
   - ✅ 勾选 "Stay informed about our projects"

5. 提交表单（会创建待支付捐赠 + 订阅记录）

**验证**：

查询数据库确认订阅已创建：
```sql
SELECT * FROM email_subscriptions
WHERE email = 'your-test-email@example.com';
```

预期结果：
```
 id | email                     | locale | is_subscribed | updated_at
----+---------------------------+--------+---------------+------------
  1 | your-test-email@example.com | en   | true          | 2026-01-04...
```

---

### 测试 2: 管理员查看订阅

**步骤**：

1. 使用管理员账户登录：
   ```
   http://localhost:3000/admin/login
   ```

2. 访问订阅管理页面：
   ```
   http://localhost:3000/admin/subscriptions
   ```

3. 查看统计卡片和订阅列表

**验证**：

- 统计卡片显示正确数量
- 订阅列表显示您的测试邮箱
- 筛选功能正常工作（状态、语言、搜索）

---

### 测试 3: 发送测试邮件

**步骤**：

1. 在 `/admin/subscriptions` 页面

2. 点击 "Send Broadcast" 按钮

3. 在弹出的模态框中：
   - ✅ 勾选 "Test Mode"（重要：只发给第一个订阅者）
   - 点击 "Send Broadcast"

4. 等待发送完成

**验证**：

1. 检查模态框显示：
   - ✓ Successfully sent: 1
   - ✗ Failed: 0

2. 检查您的邮箱（可能在垃圾邮件文件夹）：
   - 收到主题为 "New Project Available"（或对应语言）的邮件
   - 邮件内容正确显示
   - "View Project & Donate" 按钮链接正确
   - "Unsubscribe" 链接存在

---

### 测试 4: 取消订阅功能

**步骤**：

1. 在测试邮件中，点击底部的 "Unsubscribe" 链接

2. 应该自动跳转到：
   ```
   http://localhost:3000/en/unsubscribed
   ```

3. 查看取消订阅成功页面

**验证**：

1. 页面显示：
   - ✓ 绿色对勾图标
   - "Unsubscribed Successfully" 标题
   - "You have been unsubscribed..." 提示信息

2. 查询数据库确认：
   ```sql
   SELECT * FROM email_subscriptions
   WHERE email = 'your-test-email@example.com';
   ```

   预期结果：
   ```
   is_subscribed = false
   updated_at = (最新时间)
   ```

3. 返回管理员页面，确认：
   - 活跃订阅数 -1
   - 取消订阅数 +1

---

### 测试 5: 完整群发（可选）

**⚠️ 警告**：此测试会向所有活跃订阅者发送邮件，请谨慎使用！

**步骤**：

1. 在 `/admin/subscriptions` 页面

2. 添加多个测试订阅（使用不同语言）：
   ```sql
   INSERT INTO email_subscriptions (email, locale) VALUES
   ('test-en@example.com', 'en'),
   ('test-zh@example.com', 'zh'),
   ('test-ua@example.com', 'ua');
   ```

3. 点击 "Send Broadcast"，**不要勾选** Test Mode

4. 确认发送

**验证**：

- 每个邮箱都收到对应语言的邮件
- 英文邮箱收到英文邮件
- 中文邮箱收到中文邮件
- 乌克兰语邮箱收到乌克兰语邮件

---

## 🔍 问题排查

### 问题 1: 邮件未收到

**检查清单**：

1. 检查 Resend API Key 是否有效
2. 检查垃圾邮件文件夹
3. 查看服务器日志：
   ```bash
   # 查找邮件发送日志
   grep "Broadcast complete" logs/
   ```
4. 检查 Resend Dashboard 的发送记录

### 问题 2: 订阅未创建

**检查清单**：

1. 检查浏览器控制台错误
2. 查看数据库日志：
   ```sql
   SELECT * FROM email_subscriptions
   ORDER BY updated_at DESC LIMIT 10;
   ```
3. 确认 RLS 策略正确

### 问题 3: 取消订阅链接无效

**检查清单**：

1. 确认 NEXT_PUBLIC_APP_URL 设置正确
2. 检查邮件中的实际链接格式：
   ```
   应该是: http://localhost:3000/api/unsubscribe?email=xxx&locale=en
   ```
3. 查看 API 路由日志

---

## 📊 数据库查询命令

### 查看所有订阅
```sql
SELECT * FROM email_subscriptions
ORDER BY updated_at DESC;
```

### 按语言统计
```sql
SELECT
  locale,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_subscribed = true) as active
FROM email_subscriptions
GROUP BY locale;
```

### 查看最近的订阅
```sql
SELECT * FROM email_subscriptions
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

### 重置测试数据
```sql
-- 删除所有测试订阅
DELETE FROM email_subscriptions
WHERE email LIKE '%test%' OR email LIKE '%example.com';
```

---

## ✅ 测试完成检查表

- [ ] 用户可以在捐赠表单中订阅
- [ ] 订阅记录正确保存到数据库
- [ ] 管理员可以查看订阅列表
- [ ] 管理员可以看到正确的统计数据
- [ ] 测试模式群发成功（收到 1 封邮件）
- [ ] 邮件内容显示正确（标题、正文、按钮）
- [ ] 取消订阅链接有效
- [ ] 取消订阅页面显示正确
- [ ] 数据库状态正确更新（is_subscribed = false）
- [ ] 多语言邮件正确发送

---

## 🚀 生产环境注意事项

1. **正式邮件域名**：确保在 Resend 中验证了域名
2. **DNS 记录**：配置 SPF、DKIM、DMARC
3. **测试模式**：首次群发建议使用测试模式
4. **监控日志**：关注邮件发送成功率
5. **备份数据**：定期备份 email_subscriptions 表

---

**测试愉快！** 🎉

如有问题，请检查：
- 服务器日志
- Resend Dashboard
- 数据库日志
- 浏览器控制台
