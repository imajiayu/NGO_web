# NGO 平台 - 数据库架构文档

## 概述

本文档记录 NGO 平台数据库的完整架构。

**最后更新**: 2026-01-06
**迁移文件数量**: 44 个

---

## 数据库组件统计

| 类型 | 数量 | 说明 |
|------|------|------|
| 表 (Tables) | 4 | projects, donations, email_subscriptions, donation_status_history |
| 视图 (Views) | 3 | project_stats, public_project_donations, order_donations_secure |
| 函数 (Functions) | 12 | 5个业务函数 + 7个触发器函数 |
| 触发器 (Triggers) | 8 | 详见触发器章节 |
| RLS 策略 | 15 | 5个公开 + 8个管理员 + 2个订阅/历史 |
| 存储桶 | 1 | donation-results |

---

## 数据表

### 1. `projects` - 项目表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| project_name | VARCHAR(255) | 项目名称 |
| project_name_i18n | JSONB | 多语言名称 |
| location | VARCHAR(255) | 地点 |
| location_i18n | JSONB | 多语言地点 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期（可NULL） |
| is_long_term | BOOLEAN | 长期项目标志（不可修改） |
| target_units | INTEGER | 目标单位数 |
| current_units | INTEGER | 当前单位数（自动更新） |
| unit_price | NUMERIC(10,2) | 单位价格 |
| unit_name | VARCHAR(50) | 单位名称 |
| unit_name_i18n | JSONB | 多语言单位名称 |
| description_i18n | JSONB | 多语言描述 |
| status | VARCHAR(20) | 状态: planned/active/completed/paused |
| aggregate_donations | BOOLEAN | 捐赠聚合标志（不可修改） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间（自动） |

**不可修改字段**: id, created_at, aggregate_donations, is_long_term

---

### 2. `donations` - 捐赠表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| donation_public_id | VARCHAR(50) | 公开ID（格式: {项目ID}-{6位码}） |
| project_id | BIGINT | 项目外键 |
| donor_name | VARCHAR(255) | 捐赠者姓名 |
| donor_email | VARCHAR(255) | 捐赠者邮箱 |
| donor_message | TEXT | 留言（可NULL） |
| contact_telegram | VARCHAR(255) | Telegram（可NULL） |
| contact_whatsapp | VARCHAR(255) | WhatsApp（可NULL） |
| amount | NUMERIC(10,2) | 金额 |
| currency | VARCHAR(10) | 货币: USD/UAH/EUR |
| payment_method | VARCHAR(50) | 支付方式 |
| order_reference | VARCHAR(255) | WayForPay订单号 |
| donation_status | VARCHAR(20) | 状态（15个有效值） |
| locale | VARCHAR(5) | 语言: en/zh/ua |
| donated_at | TIMESTAMPTZ | 捐赠时间 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间（自动） |

**不可修改字段**: id, donation_public_id, project_id, donor_name, donor_email, amount, order_reference, created_at

#### 捐赠状态（15个）

| 分类 | 状态 | 说明 | 计入进度 |
|------|------|------|----------|
| 支付前 | pending | 待支付 | ❌ |
| 支付前 | widget_load_failed | 窗口加载失败 | ❌ |
| 处理中 | processing | 支付处理中 | ❌ |
| 处理中 | fraud_check | 反欺诈审核 | ❌ |
| 已支付 | paid | 已支付 | ✅ |
| 已支付 | confirmed | 已确认 | ✅ |
| 已支付 | delivering | 配送中 | ✅ |
| 已支付 | completed | 已完成 | ✅ |
| 失败 | expired | 超时 | ❌ |
| 失败 | declined | 被拒 | ❌ |
| 失败 | failed | 失败 | ❌ |
| 退款 | refunding | 退款申请中 | ❌ |
| 退款 | refund_processing | 退款处理中 | ❌ |
| 退款 | refunded | 已退款 | ❌ |

**管理员允许的状态转换**: paid→confirmed, confirmed→delivering, delivering→completed

---

### 3. `email_subscriptions` - 邮件订阅表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| email | TEXT | 邮箱（唯一） |
| locale | TEXT | 语言: en/zh/ua |
| is_subscribed | BOOLEAN | 订阅状态 |
| updated_at | TIMESTAMPTZ | 更新时间（自动） |

---

### 4. `donation_status_history` - 状态历史表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| donation_id | BIGINT | 捐赠外键（级联删除） |
| from_status | TEXT | 旧状态（首次为NULL） |
| to_status | TEXT | 新状态 |
| changed_at | TIMESTAMPTZ | 变更时间 |

---

## 视图

### 1. `project_stats` - 项目统计

提供项目聚合统计：total_raised（筹款总额）、donation_count（按订单号去重的交易数）、progress_percentage（进度百分比）。

### 2. `public_project_donations` - 公开捐赠列表

展示已支付捐赠，邮箱混淆（j***e@e***.com），包含 order_id（MD5哈希）用于分组。

### 3. `order_donations_secure` - 订单捐赠查询

根据 order_reference 查询捐赠，用于成功页面。接受所有15个状态，包含 aggregate_donations 字段。

---

## 函数

### 业务函数（5个）

| 函数 | 参数 | 返回 | 说明 |
|------|------|------|------|
| generate_donation_public_id | project_id | TEXT | 生成唯一捐赠ID |
| get_donations_by_email_verified | email, donation_id | TABLE | 验证后返回邮箱所有捐赠 |
| is_admin | - | BOOLEAN | 检查是否为管理员 |
| upsert_email_subscription | email, locale | BIGINT | 订阅或更新邮件订阅 |
| unsubscribe_email | email | BOOLEAN | 取消订阅 |

### 触发器函数（7个）

| 函数 | 说明 |
|------|------|
| update_updated_at_column | 自动更新 updated_at |
| update_project_units | 根据捐赠状态更新项目单位数 |
| prevent_project_immutable_fields | 保护项目不可变字段 |
| prevent_donation_immutable_fields | 保护捐赠不可变字段 + 状态转换验证 |
| update_email_subscription_updated_at | 订阅表 updated_at 更新 |
| prevent_subscription_immutable_fields | 保护订阅表 id 字段 |
| log_donation_status_change | 记录状态转换历史 |

---

## 触发器（8个）

| 触发器 | 表 | 时机 | 函数 |
|--------|-----|------|------|
| update_projects_updated_at | projects | BEFORE UPDATE | update_updated_at_column |
| update_project_units_trigger | donations | AFTER INSERT/UPDATE/DELETE | update_project_units |
| update_donations_updated_at | donations | BEFORE UPDATE | update_updated_at_column |
| prevent_project_immutable_fields_trigger | projects | BEFORE UPDATE | prevent_project_immutable_fields |
| prevent_donation_immutable_fields_trigger | donations | BEFORE UPDATE | prevent_donation_immutable_fields |
| update_email_subscriptions_updated_at | email_subscriptions | BEFORE UPDATE | update_email_subscription_updated_at |
| prevent_subscription_immutable_fields_trigger | email_subscriptions | BEFORE UPDATE | prevent_subscription_immutable_fields |
| donation_status_change_trigger | donations | AFTER INSERT/UPDATE | log_donation_status_change |

---

## RLS 策略（15个）

### 公开策略（5个）

| 策略 | 表 | 操作 | 说明 |
|------|-----|------|------|
| Allow anonymous read projects | projects | SELECT | 允许读取所有项目 |
| Allow anonymous read donations | donations | SELECT | 允许读取捐赠 |
| Allow anonymous insert pending donations | donations | INSERT | 只能插入 pending 状态 |
| Allow anonymous update pending to widget_load_failed | donations | UPDATE | pending → widget_load_failed |
| Public Access - View result images | storage.objects | SELECT | 公开访问结果图片 |

### 管理员策略（8个）

| 策略 | 表 | 操作 |
|------|-----|------|
| Admins can insert projects | projects | INSERT |
| Admins can update projects | projects | UPDATE |
| Admins can view all donations | donations | SELECT |
| Admins can update donation status | donations | UPDATE |
| Admins can upload to donation-results | storage.objects | INSERT |
| Admins can delete from donation-results | storage.objects | DELETE |
| Admins can view donation-results | storage.objects | SELECT |
| Admins can update donation-results metadata | storage.objects | UPDATE |

### 订阅/历史策略（2个）

| 策略 | 表 | 操作 |
|------|-----|------|
| Admins can view all subscriptions | email_subscriptions | SELECT |
| Admins can view all status history | donation_status_history | SELECT |

---

## 存储桶

### `donation-results`

- **访问**: 公开读取，管理员写入
- **限制**: 5MB，支持 JPEG/PNG/WebP
- **用途**: 配送完成照片

---

## 索引

### projects 表
- idx_projects_status
- idx_projects_start_date
- idx_projects_aggregate_donations

### donations 表
- idx_donations_project_id
- idx_donations_status
- idx_donations_public_id
- idx_donations_email
- idx_donations_locale
- idx_donations_order_reference (UNIQUE, 部分索引)
- idx_donations_order_ref_status (复合索引)
- idx_donations_refund_status

### email_subscriptions 表
- idx_email_subscriptions_email
- idx_email_subscriptions_is_subscribed (部分索引)
- idx_email_subscriptions_locale

### donation_status_history 表
- idx_donation_status_history_donation_id
- idx_donation_status_history_changed_at
- idx_donation_status_history_to_status

---

## 迁移文件清单

| # | 文件 | 说明 |
|---|------|------|
| 1 | 20251219061700_reset_complete | 初始化 |
| 2 | 20251219070737_fix_rls_policies | 修复 RLS |
| 3 | 20251219080000_add_obfuscated_donation_view | 邮箱混淆视图 |
| 4 | 20251219100000_add_project_i18n | 多语言支持 |
| 5 | 20251219120000_fix_order_reference_index | 修复索引 |
| 6 | 20251219130000_fix_refunding_trigger | 修复退款触发器 |
| 7 | 20251220000000_add_failed_status | 添加 failed 状态 |
| 8 | 20251221000000_drop_unused_functions | 删除无用函数 |
| 9 | 20251221010000_allow_anonymous_pending_donations | 匿名插入 |
| 10 | 20251221020000_secure_order_donations_view | 订单视图 |
| 11 | 20251221030000_secure_track_donation_functions | 追踪函数 |
| 12 | 20251221040000_fix_donation_insert_policy | 插入策略 |
| 13 | 20251221050000_allow_anon_read_projects | 匿名读项目 |
| 14 | 20251221060000_minimal_donation_policy | 最小策略 |
| 15 | 20251221070000_allow_anon_read_pending_donations | 匿名读捐赠 |
| 16 | 20251221080000_complete_donation_policy | 完整策略 |
| 17 | 20251222000000_fix_ambiguous_column_reference | 修复列名歧义 |
| 18 | 20251222010000_include_pending_in_order_view | 视图含 pending |
| 19 | 20251223000000_cleanup_and_add_donation_updated_at | 清理 + updated_at |
| 20 | 20251223100000_enable_admin_auth | 管理员认证 |
| 21 | 20251223120000_add_admin_rls_policies | 管理员 RLS |
| 22 | 20251223140000_fix_admin_rls_policies | 修复管理员 RLS |
| 23 | 20251223075954_fix_donation_public_id_ambiguous_reference | 修复列名 |
| 24 | 20251223130000_add_updated_at_to_public_views | 视图 updated_at |
| 25 | 20251224120000_restrict_admin_status_updates | 限制状态更新 |
| 26 | 20251224130000_add_order_reference_to_track_function | 添加 order_reference |
| 27 | 20251224000000_add_donation_status_constraints | 状态约束 |
| 28 | 20251224140000_fix_duplicate_donation_status_constraint | 修复重复约束 |
| 29 | 20251224150000_allow_anon_update_pending_to_failed | 匿名更新失败 |
| 30 | 20251224160000_remove_user_cancelled_status | 移除 user_cancelled |
| 31 | 20251225000000_add_aggregate_donations_flag | aggregate_donations 标志 |
| 32 | 20251225000001_update_project_stats_view | 更新统计视图 |
| 33 | 20251225000002_protect_aggregate_donations_field | 保护字段 |
| 34 | 20251225000003_fix_donation_count_logic | 修复计数逻辑 |
| 35 | 20251225000004_protect_is_long_term_field | 保护 is_long_term |
| 36 | 20251225010000_cleanup_legacy_functions | 清理旧函数 |
| 37 | 20251225020000_remove_unused_refund_function | 删除退款函数 |
| 38 | 20251225030000_add_order_id_to_public_donations | 添加 order_id |
| 39 | 20260104000000_email_subscriptions | 邮件订阅系统 |
| 40 | 20260104010000_fix_order_view_missing_statuses | 修复缺失状态 |
| 41 | 20260104020000_add_aggregate_to_track_function | 追踪函数 aggregate |
| 42 | 20260105010000_add_aggregate_to_order_view | 视图 aggregate |
| 43 | 20260105020000_allow_all_statuses_in_order_view | 视图全状态 |
| 44 | 20260106010000_add_donation_status_history | 状态历史表 |

---

## 安全架构

```
应用层 (Server Actions / API Routes)
              ↓
Supabase 客户端 (anon key / service role key)
              ↓
RLS 策略层 (Service Role 绕过 RLS)
              ↓
数据库层 (表、约束、触发器)
```

### 客户端使用

| 操作 | 客户端 | RLS |
|------|--------|-----|
| 创建待支付捐赠 | Anonymous | ✅ |
| 查询项目 | Anonymous | ✅ |
| Webhook 更新 | Service Role | ❌ |
| 管理员操作 | Service Role | ❌ |

---

**文档版本**: 2.0.0
**维护者**: 开发团队
