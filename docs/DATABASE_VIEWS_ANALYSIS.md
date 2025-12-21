# 数据库视图对比分析

## 问题
`public_donation_feed` 和 `public_project_donations` 这两个视图有什么区别？能否删除其中一个？

## 结论
**不能删除，它们服务于不同的使用场景**

---

## 详细对比

### 1. `public_donation_feed` - 全局捐赠动态视图

**创建位置**: `20251219061700_reset_complete.sql` (主迁移文件)

**字段**:
```sql
- donation_public_id
- project_name          -- ✅ 包含项目名称
- project_id
- donor_display_name    -- ✅ 匿名化的捐赠者姓名 (John Doe -> John D.)
- amount
- currency
- donated_at
- donation_status
```

**隐私保护方式**: 姓名匿名化
- 有空格: "John Doe" → "John D."
- 无空格: "Name" → "N***"

**JOIN关系**: JOIN projects 表获取项目名称

**使用场景**:
1. **全局捐赠动态** (`lib/supabase/queries.ts:204`)
   ```typescript
   export async function getPublicDonationFeed(limit = 20) {
     return supabase.from('public_donation_feed').select('*').limit(limit)
   }
   ```

2. **仪表盘最近捐赠** (`lib/supabase/queries.ts:344`)
   ```typescript
   export async function getDashboardStats() {
     // ...
     supabase.from('public_donation_feed').select('*').limit(10)
     // ...
   }
   ```

**用途**: 跨项目展示，显示"谁在什么项目捐了多少钱"

---

### 2. `public_project_donations` - 项目捐赠列表视图

**创建位置**: `20251219080000_add_obfuscated_donation_view.sql` (专门的安全视图迁移)

**字段**:
```sql
- id
- donation_public_id
- project_id
- donor_email_obfuscated  -- ✅ 混淆的邮箱 (john.doe@example.com -> j***e@e***.com)
- amount
- currency
- donation_status
- donated_at
```

**隐私保护方式**: 邮箱混淆
- "john.doe@example.com" → "j***e@e***.com"
- 保留首字母、@前最后一个字母、顶级域名

**JOIN关系**: 无（只查询 donations 表）

**使用场景**:
1. **项目捐赠列表查询** (`lib/supabase/queries.ts:191`)
   ```typescript
   export async function getProjectDonations(projectId: number, limit = 50) {
     return supabase
       .from('public_project_donations')
       .select('*')
       .eq('project_id', projectId)
   }
   ```

2. **公开API路由** (`app/api/donations/project-public/[projectId]/route.ts:32`)
   ```typescript
   const { data: donations } = await supabase
     .from('public_project_donations')
     .select('*')
     .eq('project_id', projectId)
   ```

**用途**: 单个项目页面，显示该项目的捐赠记录（带混淆邮箱用于捐赠者识别）

---

## 关键区别总结

| 特性 | public_donation_feed | public_project_donations |
|------|---------------------|-------------------------|
| **范围** | 全局（所有项目） | 单个项目 |
| **项目名称** | ✅ 包含 | ❌ 不包含 |
| **捐赠者姓名** | ✅ 匿名化 (John D.) | ❌ 不包含 |
| **捐赠者邮箱** | ❌ 不包含 | ✅ 混淆 (j***e@e***.com) |
| **JOIN** | JOIN projects | 无 JOIN (更快) |
| **记录ID** | ❌ 不包含 | ✅ 包含 id |
| **主要用途** | 首页/仪表盘动态展示 | 项目详情页捐赠列表 |
| **展示重点** | "谁捐了哪个项目" | "这个项目有哪些捐赠" |

---

## 设计意图分析

### `public_donation_feed` 的设计意图
- **跨项目聚合**: 需要显示项目名称，因此 JOIN projects 表
- **社交展示**: 显示匿名化姓名，让用户看到"John D. 刚捐了 Clean Water Project"
- **全局动态**: 像社交媒体 feed，展示所有项目的最新动态

### `public_project_donations` 的设计意图
- **项目聚焦**: 只关注单个项目，不需要项目名称（页面已知道是哪个项目）
- **捐赠者识别**: 显示混淆邮箱而非姓名，便于捐赠者通过邮箱识别自己的捐赠
- **性能优化**: 无 JOIN，查询更快
- **安全API**: 专门设计为公开API使用，只暴露安全字段

---

## 能否合并？

### ❌ 不建议合并的原因

1. **字段需求冲突**:
   - Feed 需要 `project_name` + `donor_display_name`
   - Project 需要 `donor_email_obfuscated` + `id`
   - 如果合并，会暴露过多信息或缺少必要信息

2. **性能考虑**:
   - Feed 需要 JOIN projects（全局查询，需要项目名）
   - Project 不需要 JOIN（单项目查询，已知项目信息）
   - 合并会导致 Project 查询变慢

3. **安全边界清晰**:
   - 两个视图有不同的隐私保护策略
   - 分开更容易审计和维护安全性

4. **使用场景完全不同**:
   - Feed: 全局跨项目展示
   - Project: 单项目详情展示
   - 合并会混淆业务逻辑

---

## 建议

### ✅ 保留两个视图
继续使用两个独立视图，因为：
- 它们服务于不同的 UI 组件
- 有不同的安全和性能需求
- 代码职责分离更清晰

### 🔄 可优化的点
如果未来需要优化，可以考虑：
1. 为两个视图添加物化视图（Materialized View）以提升性能
2. 添加适当的索引优化查询
3. 考虑是否需要缓存策略

### 📝 文档建议
在代码注释中明确说明两个视图的不同用途，避免未来的混淆。

---

## 现状评估

✅ **当前设计合理**
- 两个视图各司其职
- 没有冗余或重复
- 安全性和性能都考虑到位
- 建议保留现状

**最后更新**: 2025-12-21
