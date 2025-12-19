# Supabase CLI 使用指南

## 快速开始

### 1. 安装 Supabase CLI

```bash
# macOS (推荐使用 Homebrew)
brew install supabase/tap/supabase

# 验证安装
supabase --version
```

### 2. 登录并连接项目

```bash
# 在项目根目录
cd /Users/majiayu/NGO_web

# 登录 Supabase
supabase login

# 链接到远程项目
supabase link --project-ref <your-project-ref>
```

**如何找到 project-ref:**
- 登录 [Supabase Dashboard](https://supabase.com/dashboard)
- 选择你的项目
- 进入 Settings > General
- 复制 **Reference ID**

### 3. 应用本次更新

```bash
# 推送所有未应用的 migrations 到远程数据库
supabase db push
```

这会应用 `006_update_donation_status_enum.sql` 文件中的所有更改：
- ✅ 新增 `locale` 字段（en, zh, ua）
- ✅ 新增 `refunding` 状态
- ✅ 更新所有相关视图、触发器、策略

### 4. 验证迁移

```bash
# 查看迁移状态
supabase migration list

# 连接到远程数据库查询
supabase db remote status
```

或在 SQL Editor 中执行：

```sql
-- 检查 locale 字段
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'donations' AND column_name = 'locale';

-- 检查状态约束
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'valid_donation_status';

-- 应该显示: ('paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded')
```

## 本次更新内容

### 1. 新增字段：`locale`

捐献记录表现在会记录用户下单时使用的语言：

| 值 | 说明 |
|---|---|
| `en` | English（英语） |
| `zh` | Chinese（中文） |
| `ua` | Ukrainian（乌克兰语） |

**用途：**
- 发送邮件通知时使用对应语言
- 统计不同语言用户的捐献情况
- 个性化用户体验

### 2. 新增状态：`refunding`

完整的捐献状态流程：

```
支付成功
  ↓
[paid] 已付款
  ↓
[confirmed] 已确认（NGO人工确认）
  ↓
[delivering] 配送中
  ↓
[completed] 已完成
```

**退款流程：**

```
任意状态（除 completed）
  ↓
[refunding] 退款中（用户发起退款请求）
  ↓
[refunded] 已退款（退款完成）
```

### 3. 项目单位更新逻辑

- `paid/confirmed/delivering/completed` → 增加项目单位 ✅
- `任意状态 → refunding` → 保持项目单位不变 ⏸️
- `refunding → refunded` → 减少项目单位 ➖
- `refunding/refunded → paid/confirmed` → 增加项目单位 ✅

## 常用命令

### 查看数据库状态

```bash
# 查看远程数据库状态
supabase db remote status

# 查看本地和远程的差异
supabase db diff
```

### 创建新的 Migration

```bash
# 方式1：基于数据库差异自动生成
supabase db diff -f new_migration_name

# 方式2：创建空白 migration 文件
supabase migration new new_migration_name
```

### 本地开发和测试

```bash
# 启动本地 Supabase（包含 PostgreSQL, Auth, Storage 等）
supabase start

# 应用所有 migrations 到本地数据库
supabase db reset

# 停止本地 Supabase
supabase stop
```

### 查看 Migration 历史

```bash
# 列出所有 migrations
supabase migration list

# 查看已应用的 migrations
supabase migration list --applied
```

### 拉取远程数据库架构

```bash
# 从远程数据库生成 migration（用于同步现有数据库）
supabase db pull
```

## 工作流程建议

### 日常开发流程

1. **本地开发和测试**
   ```bash
   # 启动本地环境
   supabase start

   # 编辑代码和数据库
   # ...

   # 生成 migration
   supabase db diff -f my_feature

   # 测试 migration
   supabase db reset
   ```

2. **推送到远程**
   ```bash
   # 确保本地测试通过
   npm run build
   npm run test

   # 推送到远程数据库
   supabase db push

   # 提交代码
   git add .
   git commit -m "Add new feature with database migration"
   git push
   ```

3. **团队协作**
   ```bash
   # 拉取最新代码
   git pull

   # 应用团队成员创建的 migrations
   supabase db push
   ```

### 生产环境部署

```bash
# 1. 备份生产数据库
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 在生产环境应用 migrations
supabase link --project-ref <production-project-ref>
supabase db push

# 3. 验证
supabase db remote status
```

## 故障排查

### 问题1：migration 应用失败

```bash
# 查看详细错误信息
supabase db push --debug

# 检查 migration 文件语法
psql -f supabase/migrations/006_update_donation_status_enum.sql
```

### 问题2：本地和远程不同步

```bash
# 重新拉取远程架构
supabase db pull

# 比较差异
supabase db diff
```

### 问题3：需要回滚 migration

```bash
# Supabase 不支持自动回滚
# 需要手动创建回滚 migration

supabase migration new rollback_006

# 在新文件中编写回滚 SQL
# 然后应用
supabase db push
```

## 下一步

现在你已经应用了数据库更新，可以：

1. ✅ 测试支付流程，验证 `locale` 字段是否正确保存
2. ✅ 开始开发退款功能（使用 `refunding` 和 `refunded` 状态）
3. ✅ 更新前端UI展示新的捐献状态
4. ✅ 实现多语言邮件通知功能

## 相关文档

- [Supabase CLI 官方文档](https://supabase.com/docs/guides/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- 项目文档：`CLAUDE.md`
- 迁移指南：`MIGRATION_GUIDE.md`

---

**最后更新**: 2025-12-18
**Migration 版本**: 006
