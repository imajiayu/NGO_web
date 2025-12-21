# 数据库和代码清理摘要

**日期**: 2025-12-21
**任务**: 删除未使用的数据库对象和相关代码

---

## 清理内容

### 1️⃣ 数据库对象 (迁移文件)

**文件**: `supabase/migrations/20251221000000_drop_unused_functions.sql`

#### 删除的函数 (3个)
1. ❌ `get_donation_result_url(TEXT)`
   - 功能: 获取捐赠结果图片URL
   - 原因: 结果图片功能未实现

2. ❌ `cleanup_expired_pending_donations()`
   - 功能: 清理超过24小时的pending捐赠
   - 原因: 无定时任务调用此函数

3. ❌ `get_translated_text(JSONB, TEXT, TEXT)`
   - 功能: 从i18n JSON获取翻译文本
   - 原因: 应用使用客户端i18n

#### 删除的视图 (1个)
4. ❌ `public_donation_feed`
   - 功能: 全局捐赠动态视图
   - 包含字段: donation_public_id, project_name, donor_display_name, amount, currency, donated_at
   - 原因:
     - 定义了查询函数但未在UI中使用
     - 无全局捐赠动态展示页面
     - 仪表盘功能未实现

---

### 2️⃣ TypeScript 代码

#### 删除的类型定义 (`types/index.ts`)
1. ❌ `PublicDonationFeed` - 全局捐赠Feed类型
2. ❌ `DashboardStats` - 仪表盘统计接口

#### 删除的查询函数 (`lib/supabase/queries.ts`)
1. ❌ `getPublicDonationFeed(limit = 20)` - 获取全局捐赠动态
2. ❌ `getDashboardStats()` - 获取仪表盘统计数据

---

## 保留的对象

### ✅ 仍在使用的视图

1. **`project_stats`** - 项目统计视图
   - 使用位置:
     - `getAllProjectsWithStats()` - queries.ts:79
     - `getProjectStats()` - queries.ts:65
     - `getDashboardStats()` (已删除，但其他地方仍使用)

2. **`public_project_donations`** - 项目捐赠列表视图
   - 使用位置:
     - `getProjectDonations()` - queries.ts:191
     - API路由: `app/api/donations/project-public/[projectId]/route.ts:32`

### ✅ 仍在使用的函数

1. **`generate_donation_public_id(BIGINT)`** - 生成捐赠ID
   - 使用: app/actions/donation.ts:128

2. **`get_project_progress(BIGINT)`** - 获取项目进度
   - 使用: lib/supabase/queries.ts:113

3. **`get_recent_donations(BIGINT, INTEGER)`** - 获取最近捐赠
   - 使用: lib/supabase/queries.ts:179

4. **`is_project_goal_reached(BIGINT)`** - 检查项目目标是否达成
   - 使用: lib/supabase/queries.ts:310

5. **`update_updated_at_column()`** - 自动更新时间戳
   - 使用: 被触发器调用

6. **`update_project_units()`** - 自动更新项目单位数
   - 使用: 被触发器调用

---

## 影响分析

### ✅ 安全性
- 所有被删除的对象都未在代码中使用
- 删除不会影响现有功能
- 数据库视图和函数依赖关系已验证

### ✅ 性能优化
- 减少数据库对象维护成本
- 减少不必要的查询函数
- 代码库更简洁

### ✅ 可维护性
- 移除死代码，降低混淆
- 明确哪些视图实际在使用
- 便于未来功能开发

---

## 应用迁移

运行以下命令应用数据库清理：

```bash
supabase db push
```

或者如果已连接到远程数据库：

```bash
supabase db push --remote
```

---

## 回滚方案

如果需要恢复被删除的对象，可以从以下原始迁移文件中找到定义：

1. **函数和视图**:
   - `get_donation_result_url`: 20251219061700_reset_complete.sql:454-482
   - `cleanup_expired_pending_donations`: 20251219061700_reset_complete.sql:487-500
   - `public_donation_feed`: 20251219061700_reset_complete.sql:556-576

2. **i18n函数**:
   - `get_translated_text`: 20251219100000_add_project_i18n.sql:27-50

3. **TypeScript代码**:
   - Git历史可以恢复所有删除的代码

---

## 未来考虑

### 如果需要实现仪表盘功能
当需要开发管理后台仪表盘时，可以考虑：

1. **重新创建视图**:
   - 根据实际需求设计新的视图
   - 可能需要不同的字段和聚合逻辑

2. **新的统计函数**:
   - 基于实际UI需求设计API
   - 考虑性能和缓存策略

3. **物化视图**:
   - 对于复杂统计，考虑使用物化视图
   - 定期刷新以提升查询性能

---

**总结**: 清理了 3 个未使用的函数、1 个未使用的视图，以及相关的 TypeScript 类型和查询函数。数据库更加精简，代码更易维护。

**最后更新**: 2025-12-21
