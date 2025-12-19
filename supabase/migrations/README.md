# Database Migrations

## 🔄 Complete Reset Migration

### File: `000_reset_complete.sql`

这是一个**完整的数据库重置脚本**，每次运行都会：

1. ❌ **DROP** 所有现有数据库对象（表、视图、函数、触发器、策略、存储桶）
2. ✅ **CREATE** 完整的数据库架构

⚠️ **警告**: 运行此迁移会**删除所有数据**！

---

## 📋 迁移内容

### 阶段 1: DROP（清理）
- Storage policies
- RLS policies
- Triggers
- Functions
- Views
- Tables
- Storage buckets

### 阶段 2-11: CREATE（创建）
- ✅ Extensions (uuid-ossp)
- ✅ Tables (projects, donations)
- ✅ Indexes (11个索引)
- ✅ Functions (8个函数)
- ✅ Views (2个视图)
- ✅ Triggers (2个触发器)
- ✅ Storage buckets (donation-results)
- ✅ RLS policies (8个策略)
- ✅ Storage policies (4个策略)
- ✅ Permissions & Comments

---

## 🎯 关键变更

与原始schema相比的变更：

### 1. **projects.target_units 现在可为 NULL**
```sql
target_units INTEGER  -- 可以为 NULL（无具体目标的项目）
```

### 2. **移除 Stripe，添加 WayForPay**
```sql
-- ❌ 删除: stripe_payment_intent_id
-- ✅ 新增: order_reference (WayForPay订单引用)
```

### 3. **donation_status 新增 'pending' 状态**
```sql
-- 7个状态: pending, paid, confirmed, delivering, completed, refunding, refunded
```

---

## 🚀 如何运行迁移

### 方法 1: Supabase CLI（推荐）

```bash
# 1. 确保已登录 Supabase
supabase login

# 2. 链接到你的项目
supabase link --project-ref <your-project-ref>

# 3. 运行迁移（会重置整个数据库）
supabase db push

# 或者只运行这个特定文件
supabase db push --include-all
```

### 方法 2: Supabase Dashboard

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制 `000_reset_complete.sql` 的内容
4. 粘贴并运行

### 方法 3: 本地开发环境

```bash
# 启动本地 Supabase
supabase start

# 运行迁移
supabase db reset
```

---

## 📊 创建的数据库对象

### 表（2个）
- `projects` - 项目表
- `donations` - 捐赠表

### 视图（2个）
- `project_stats` - 项目统计
- `public_donation_feed` - 公开捐赠动态

### 函数（8个）

**触发器函数:**
1. `update_updated_at_column()` - 自动更新时间戳
2. `update_project_units()` - 自动更新项目单位数

**业务逻辑函数:**
3. `generate_donation_public_id(project_id)` - 生成捐赠ID
4. `get_project_progress(project_id)` - 获取项目进度
5. `get_recent_donations(project_id, limit)` - 获取最近捐赠
6. `is_project_goal_reached(project_id)` - 检查目标是否达成
7. `get_donation_result_url(donation_public_id)` - 获取结果图片URL
8. `cleanup_expired_pending_donations()` - 清理过期pending捐赠

### 触发器（2个）
1. `update_projects_updated_at` - 自动更新 projects.updated_at
2. `update_project_units_trigger` - 根据捐赠状态更新 current_units

### Storage Buckets（1个）
- `donation-results` - 存储捐赠结果图片（5MB限制，仅图片格式）

### RLS 策略（8个）

**Projects:**
- Public can view active projects
- Admins can insert/update/delete projects

**Donations:**
- Public can view confirmed donations
- Admins can view/update all donations
- Service role can insert donations

### Storage 策略（4个）
- Public can view images
- Admins can upload/update/delete images

---

## 🔍 验证迁移

运行迁移后，验证所有对象已创建：

```sql
-- 检查表
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 检查视图
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public';

-- 检查函数
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';

-- 检查存储桶
SELECT * FROM storage.buckets;
```

---

## 📝 数据库架构概览

```
public
├── Tables
│   ├── projects (12 columns)
│   └── donations (15 columns)
├── Views
│   ├── project_stats
│   └── public_donation_feed
├── Functions
│   ├── generate_donation_public_id(bigint)
│   ├── get_project_progress(bigint)
│   ├── get_recent_donations(bigint, integer)
│   ├── is_project_goal_reached(bigint)
│   ├── get_donation_result_url(text)
│   ├── cleanup_expired_pending_donations()
│   ├── update_updated_at_column()
│   └── update_project_units()
└── Triggers
    ├── update_projects_updated_at
    └── update_project_units_trigger

storage
└── Buckets
    └── donation-results (public, 5MB, images only)
```

---

## 🗂️ 旧迁移文件

原始的6个迁移文件已被整合到 `000_reset_complete.sql` 中：

- `001_init_schema.sql` ✅
- `002_init_functions_views.sql` ✅
- `003_init_policies.sql` ✅
- `004_init_storage.sql` ✅
- `005_rollback_pending_payments.sql` ✅
- `006_wayforpay_donations_table.sql` ✅

如果需要保留这些文件作为参考，可以移动到 `migrations_archive/` 目录。

---

## ⚠️ 注意事项

1. **数据丢失**: 每次运行 `000_reset_complete.sql` 都会删除所有数据
2. **生产环境**: 在生产环境运行前务必备份数据
3. **幂等性**: 此脚本可以安全地多次运行
4. **依赖顺序**: 脚本按正确的依赖顺序创建所有对象

---

## 🔗 相关文档

- [Supabase CLI Guide](../../docs/SUPABASE_CLI_GUIDE.md)
- [CLAUDE.md](../../CLAUDE.md) - 完整技术文档
- [Troubleshooting](../../docs/TROUBLESHOOTING.md)

---

**最后更新**: 2025-12-19
**版本**: 2.0
**作者**: Claude Code Assistant
