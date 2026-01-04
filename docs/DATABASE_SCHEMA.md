# NGO 平台 - 数据库架构完整文档

## 📋 文档概述

本文档详细记录了 NGO 平台数据库的完整架构，包括所有表、视图、函数、触发器、索引、RLS 策略和存储桶配置。

**最后更新**: 2026-01-04
**数据库版本**: PostgreSQL (Supabase)
**迁移文件数量**: 39 个

---

## 📊 数据库概览

### 核心组件统计
- **表 (Tables)**: 3 个（projects, donations, email_subscriptions）
- **视图 (Views)**: 3 个
- **函数 (Functions)**: 6 个（3个业务函数 + 3个触发器函数 + 1个ID生成函数 + 1个管理员认证函数）
- **触发器 (Triggers)**: 7 个（3个updated_at触发器 + 1个项目单位更新触发器 + 3个字段不可变触发器）
- **存储桶 (Storage Buckets)**: 1 个
- **RLS 策略 (RLS Policies)**: 14 个（5个公开策略 + 8个管理员策略 + 1个订阅策略）

---

## 🗄️ 数据表 (Tables)

### 1. `projects` - 项目表

存储所有 NGO 项目的详细信息和进度跟踪。

#### 字段定义

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGSERIAL | PRIMARY KEY | auto | 主键，自增 |
| `project_name` | VARCHAR(255) | NOT NULL | - | 项目名称（英文） |
| `project_name_i18n` | JSONB | NOT NULL | '{}' | 多语言项目名称 {"en": "...", "zh": "...", "ua": "..."} |
| `location` | VARCHAR(255) | NOT NULL | - | 项目地点（英文） |
| `location_i18n` | JSONB | NOT NULL | '{}' | 多语言地点 |
| `start_date` | DATE | NOT NULL | - | 项目开始日期 |
| `end_date` | DATE | NULLABLE | NULL | 项目结束日期（长期项目可为NULL） |
| `is_long_term` | BOOLEAN | NOT NULL | FALSE | 是否为长期项目 |
| `target_units` | INTEGER | NULLABLE | NULL | 目标单位数量（可为NULL表示无固定目标） |
| `current_units` | INTEGER | NOT NULL | 0 | 当前已完成单位数量（自动更新） |
| `unit_price` | NUMERIC(10,2) | NOT NULL | - | 单位价格（美元） |
| `unit_name` | VARCHAR(50) | NOT NULL | 'kit' | 单位名称（英文，如"kit"） |
| `unit_name_i18n` | JSONB | NOT NULL | '{}' | 多语言单位名称 |
| `description_i18n` | JSONB | NOT NULL | '{}' | 多语言项目描述 |
| `status` | VARCHAR(20) | NOT NULL | 'planned' | 项目状态 |
| `aggregate_donations` | BOOLEAN | NOT NULL | FALSE | 捐赠聚合标志（true=单条记录聚合，false=按单位拆分）|
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | 记录创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | 记录更新时间（自动更新） |

#### 约束条件

```sql
-- 状态约束
CONSTRAINT valid_status CHECK (
  status IN ('planned', 'active', 'completed', 'paused')
)

-- 单位数量约束
CONSTRAINT valid_units CHECK (
  current_units >= 0
  AND (target_units IS NULL OR target_units >= 0)
)

-- 单位价格约束
CONSTRAINT valid_unit_price CHECK (unit_price > 0)

-- 日期约束
CONSTRAINT valid_dates CHECK (
  end_date IS NULL OR end_date >= start_date
)
```

#### 索引

```sql
-- 状态索引（用于筛选活跃/已完成项目）
CREATE INDEX idx_projects_status ON projects(status);

-- 开始日期索引（用于排序）
CREATE INDEX idx_projects_start_date ON projects(start_date);

-- 聚合标志索引（用于筛选不同捐赠模式的项目）
CREATE INDEX idx_projects_aggregate_donations ON projects(aggregate_donations);

-- i18n 字段索引（用于多语言搜索）
CREATE INDEX idx_projects_name_i18n_en ON projects((project_name_i18n->>'en'));
CREATE INDEX idx_projects_name_i18n_zh ON projects((project_name_i18n->>'zh'));
CREATE INDEX idx_projects_name_i18n_ua ON projects((project_name_i18n->>'ua'));
```

#### 状态说明

| 状态 | 英文 | 说明 |
|------|------|------|
| 计划中 | planned | 项目正在筹备，尚未启动 |
| 进行中 | active | 项目正在进行，可接受捐赠 |
| 已完成 | completed | 项目已达成目标或结束 |
| 已暂停 | paused | 项目暂时暂停 |

---

### 2. `donations` - 捐赠表

跟踪所有对项目的捐赠记录和支付详情。

#### 字段定义

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGSERIAL | PRIMARY KEY | auto | 主键，自增 |
| `donation_public_id` | VARCHAR(50) | NOT NULL, UNIQUE | - | 公开捐赠ID（格式：{项目ID}-{6位随机码}）|
| `project_id` | BIGINT | NOT NULL, FK | - | 外键，关联 projects.id |
| `donor_name` | VARCHAR(255) | NOT NULL | - | 捐赠者姓名 |
| `donor_email` | VARCHAR(255) | NOT NULL | - | 捐赠者邮箱 |
| `donor_message` | TEXT | NULLABLE | NULL | 捐赠者留言 |
| `contact_telegram` | VARCHAR(255) | NULLABLE | NULL | Telegram 联系方式 |
| `contact_whatsapp` | VARCHAR(255) | NULLABLE | NULL | WhatsApp 联系方式 |
| `amount` | NUMERIC(10,2) | NOT NULL | - | 捐赠金额（每单位） |
| `currency` | VARCHAR(10) | NOT NULL | 'USD' | 货币代码 |
| `payment_method` | VARCHAR(50) | NULLABLE | NULL | 支付方式（如 'WayForPay'） |
| `order_reference` | VARCHAR(255) | NULLABLE | NULL | WayForPay 订单号（格式：DONATE-{项目ID}-{时间戳}-{随机码}）|
| `donation_status` | VARCHAR(20) | NOT NULL | 'paid' | 捐赠状态 |
| `locale` | VARCHAR(5) | NOT NULL | 'en' | 用户语言偏好 |
| `donated_at` | TIMESTAMPTZ | NOT NULL | NOW() | 捐赠时间 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | 记录创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | 记录更新时间（自动更新） |

#### 约束条件

```sql
-- 外键约束
CONSTRAINT fk_project FOREIGN KEY (project_id)
  REFERENCES projects(id) ON DELETE CASCADE

-- 状态约束（15个有效状态）
CONSTRAINT donations_status_check CHECK (
  donation_status IN (
    -- Pre-payment
    'pending',           -- 待支付
    'widget_load_failed',-- 支付窗口加载失败

    -- Processing
    'processing',        -- 支付处理中（WayForPay inProcessing）
    'fraud_check',       -- 反欺诈审核中（WayForPay Pending）

    -- Payment complete
    'paid',              -- 已支付
    'confirmed',         -- NGO已确认
    'delivering',        -- 配送中
    'completed',         -- 已完成

    -- Payment failed
    'expired',           -- 支付超时（WayForPay Expired）
    'declined',          -- 银行拒绝（WayForPay Declined）
    'failed',            -- 其他失败

    -- Refund
    'refunding',         -- 退款申请中
    'refund_processing', -- 退款处理中（WayForPay RefundInProcessing）
    'refunded'           -- 已退款（WayForPay Refunded/Voided）
  )
)

-- 语言约束
CONSTRAINT valid_locale CHECK (
  locale IN ('en', 'zh', 'ua')
)

-- 金额约束
CONSTRAINT valid_amount CHECK (amount > 0)
```

#### 索引

```sql
-- 项目ID索引（用于查询项目的所有捐赠）
CREATE INDEX idx_donations_project_id ON donations(project_id);

-- 状态索引（用于筛选不同状态的捐赠）
CREATE INDEX idx_donations_status ON donations(donation_status);

-- 公开ID索引（用于快速查找单个捐赠）
CREATE INDEX idx_donations_public_id ON donations(donation_public_id);

-- 邮箱索引（用于捐赠者查询自己的捐赠）
CREATE INDEX idx_donations_email ON donations(donor_email);

-- 语言索引
CREATE INDEX idx_donations_locale ON donations(locale);

-- 订单号唯一索引（部分索引，仅非NULL值）
CREATE UNIQUE INDEX idx_donations_order_reference
ON donations(order_reference)
WHERE order_reference IS NOT NULL;

-- 订单号+状态复合索引（用于 webhook 查询）
CREATE INDEX idx_donations_order_ref_status
ON donations(order_reference, donation_status)
WHERE order_reference IS NOT NULL;

-- 退款状态索引
CREATE INDEX idx_donations_refund_status
ON donations(donation_status)
WHERE donation_status IN ('refunding', 'refunded');
```

#### 捐赠状态流程

```
用户捐赠流程：
pending → processing → fraud_check → paid → confirmed → delivering → completed
   ↓           ↓           ↓
widget_load_failed    expired/declined

退款流程：
paid/confirmed/delivering → refunding → refund_processing → refunded

支付失败流程：
pending → failed/expired/declined
```

| 状态 | 中文 | 说明 | 计入项目进度 |
|------|------|------|-------------|
| **Pre-payment (支付前)** |
| pending | 待支付 | 订单已创建，等待支付 | ❌ |
| widget_load_failed | 窗口加载失败 | 支付窗口加载失败 | ❌ |
| **Processing (处理中)** |
| processing | 处理中 | WayForPay 支付处理中 | ❌ |
| fraud_check | 审核中 | 反欺诈审核中 | ❌ |
| **Payment Complete (支付完成)** |
| paid | 已支付 | 支付成功，等待NGO确认 | ✅ |
| confirmed | 已确认 | NGO已确认收款 | ✅ |
| delivering | 配送中 | 物资配送中 | ✅ |
| completed | 已完成 | 配送完成 | ✅ |
| **Payment Failed (支付失败)** |
| expired | 超时 | 支付超时（WayForPay Expired） | ❌ |
| declined | 被拒 | 银行拒绝（WayForPay Declined） | ❌ |
| failed | 失败 | 其他失败原因 | ❌ |
| **Refund (退款)** |
| refunding | 退款申请中 | 退款请求已提交 | ❌ |
| refund_processing | 退款处理中 | WayForPay 退款处理中 | ❌ |
| refunded | 已退款 | 退款已完成 | ❌ |

---

### 3. `email_subscriptions` - 邮件订阅表

存储用户邮件订阅信息，用于新项目通知群发。✨ 2026-01-04 新增

#### 字段定义

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGSERIAL | PRIMARY KEY | auto | 主键，自增 |
| `email` | TEXT | NOT NULL, UNIQUE | - | 订阅者邮箱地址 |
| `locale` | TEXT | NOT NULL, CHECK | - | 语言偏好（en/zh/ua） |
| `is_subscribed` | BOOLEAN | NOT NULL | TRUE | 订阅状态 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | 最后更新时间（自动更新） |

#### 约束条件

```sql
-- 语言约束
CONSTRAINT valid_locale CHECK (
  locale IN ('en', 'zh', 'ua')
)
```

#### 索引

```sql
-- 邮箱索引（用于快速查找）
CREATE INDEX idx_email_subscriptions_email ON email_subscriptions(email);

-- 订阅状态部分索引（只索引已订阅的记录）
CREATE INDEX idx_email_subscriptions_is_subscribed
ON email_subscriptions(is_subscribed)
WHERE is_subscribed = true;

-- 语言索引（用于按语言分组群发）
CREATE INDEX idx_email_subscriptions_locale ON email_subscriptions(locale);
```

#### 使用场景

- 捐赠时用户选择订阅项目更新
- 管理员群发新项目通知邮件
- 用户通过邮件链接取消订阅

---

## 👁️ 视图 (Views)

### 1. `project_stats` - 项目统计视图

提供每个项目的聚合统计信息，包括捐赠总额和进度。

#### 字段

```sql
SELECT
  p.id,
  p.project_name,
  p.project_name_i18n,
  p.location,
  p.location_i18n,
  p.status,
  p.target_units,
  p.current_units,
  p.unit_name,
  p.unit_name_i18n,
  p.unit_price,
  p.start_date,
  p.end_date,
  p.is_long_term,
  p.aggregate_donations,              -- ✨ NEW: 捐赠聚合标志
  p.description_i18n,
  -- 聚合字段
  COALESCE(SUM(
    CASE WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
    THEN d.amount ELSE 0 END
  ), 0) AS total_raised,              -- 总筹款金额
  COUNT(DISTINCT
    CASE WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
    THEN d.order_reference ELSE NULL END
  ) AS donation_count,                -- ✨ UPDATED: 按订单号去重的捐赠笔数（支付交易数）
  CASE
    WHEN p.target_units > 0 THEN
      ROUND((p.current_units::NUMERIC / p.target_units::NUMERIC) * 100, 2)
    ELSE 0
  END AS progress_percentage          -- 进度百分比
FROM projects p
LEFT JOIN donations d ON p.id = d.project_id
GROUP BY p.id;
```

#### 使用场景

- 项目列表页面展示
- 项目进度条显示
- 统计报表生成

#### 权限

```sql
GRANT SELECT ON project_stats TO anon, authenticated;
```

---

### 2. `public_project_donations` - 公开项目捐赠视图

展示项目捐赠记录，保护隐私（邮箱混淆）。

#### 字段

```sql
SELECT
  d.id,
  d.donation_public_id,
  d.project_id,
  -- 邮箱混淆：john.doe@example.com → j***e@e***.com
  CASE
    WHEN position('@' in d.donor_email) > 0 THEN
      [复杂的邮箱混淆逻辑]
    ELSE '***'
  END AS donor_email_obfuscated,
  MD5(COALESCE(d.order_reference, '')) AS order_id,  -- ✨ 2025-12-25 新增：订单ID（MD5哈希）
  d.amount,
  d.currency,
  d.donation_status,
  d.donated_at,
  d.updated_at  -- ✨ 2025-12-23 新增：显示最后更新时间
FROM donations d
WHERE d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
ORDER BY d.donated_at DESC;
```

#### 邮箱混淆规则

| 原始邮箱 | 混淆后 |
|----------|--------|
| john.doe@example.com | j***e@e***om |
| a@b.com | a***@b***om |
| test@g.co | t***t@g***.co |

#### 使用场景

- 项目详情页展示最近捐赠
- 公开捐赠墙

#### 权限

```sql
GRANT SELECT ON public_project_donations TO anon, authenticated;
```

---

### 3. `order_donations_secure` - 订单捐赠安全视图

根据订单号查询捐赠记录，用于成功页面展示。

#### 字段

```sql
SELECT
  d.id,
  d.donation_public_id,
  d.amount,
  d.donation_status,
  d.order_reference,
  [邮箱混淆逻辑] AS donor_email_obfuscated,
  -- 项目信息
  p.id AS project_id,
  p.project_name,
  p.project_name_i18n,
  p.location,
  p.location_i18n,
  p.unit_name,
  p.unit_name_i18n
FROM donations d
INNER JOIN projects p ON d.project_id = p.id
WHERE
  -- 包含 pending 状态（用于立即显示）
  d.donation_status IN ('pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded')
  AND d.order_reference IS NOT NULL
  AND d.order_reference != '';
```

#### 安全特性

✅ 邮箱混淆保护隐私
✅ 不包含捐赠者姓名
✅ order_reference 作为安全标识符
✅ 只有完成支付流程的用户才有 order_reference

#### 使用场景

- 支付成功页面 `/donate/success`
- 根据订单号查询 API: `/api/donations/order/[orderReference]`

#### 权限

```sql
GRANT SELECT ON order_donations_secure TO anon, authenticated;
```

---

## ⚙️ 函数 (Functions)

### 1. `generate_donation_public_id(project_id_input BIGINT)` → TEXT

生成唯一的项目范围捐赠ID。

#### 格式

```
{项目ID}-{6位随机码}

示例：
1-A1B2C3  （项目1）
23-D4E5F6 （项目23）
456-G7H8I9（项目456）
```

#### 实现逻辑

```sql
1. 生成 6 位随机字母数字大写码（MD5 哈希前6位）
2. 拼接格式：{project_id}-{random_suffix}
3. 检查是否已存在于该项目
4. 如果重复，重新生成（循环直到唯一）
5. 返回唯一ID
```

#### 优势

- **更短**: 8-10 字符 vs 17 字符（旧格式）
- **项目范围**: 每个项目独立命名空间
- **低碰撞率**: 16^6 = 16,777,216 种组合/项目
- **语义化**: 立即显示所属项目

#### 使用示例

```sql
SELECT generate_donation_public_id(1);
-- 返回: '1-A1B2C3'
```

---

### 2. `get_donations_by_email_verified(p_email TEXT, p_donation_id TEXT)`

根据邮箱查询捐赠记录（需验证所有权）。

#### 返回字段

```sql
RETURNS TABLE (
  id BIGINT,
  donation_public_id VARCHAR(50),
  order_reference VARCHAR(255),  -- ✨ 2025-12-24 新增
  project_id BIGINT,
  donor_email VARCHAR(255),
  amount NUMERIC(10,2),
  currency VARCHAR(10),
  donation_status VARCHAR(20),
  donated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,  -- ✨ 2025-12-23 新增
  project_name VARCHAR(255),
  project_name_i18n JSONB,
  location VARCHAR(255),
  location_i18n JSONB,
  unit_name VARCHAR(50),
  unit_name_i18n JSONB
)
```

#### 安全机制

1. **双重验证**: 必须同时提供邮箱和有效的捐赠ID
2. **防枚举攻击**: 如果验证失败，返回空结果（不透露原因）
3. **SECURITY DEFINER**: 绕过 RLS 安全查询
4. **邮箱不混淆**: 用户已知自己的邮箱

#### 实现逻辑

```sql
BEGIN
  -- 步骤1: 验证捐赠ID属于该邮箱
  IF NOT EXISTS (
    SELECT 1 FROM donations verify
    WHERE verify.donation_public_id = p_donation_id
      AND LOWER(verify.donor_email) = LOWER(p_email)
  ) THEN
    RETURN;  -- 验证失败，返回空
  END IF;

  -- 步骤2: 返回该邮箱的所有捐赠
  RETURN QUERY
  SELECT [字段列表]
  FROM donations d
  INNER JOIN projects p ON d.project_id = p.id
  WHERE LOWER(d.donor_email) = LOWER(p_email)
  ORDER BY d.donated_at DESC;
END;
```

#### 使用场景

- 捐赠追踪功能
- 用户查询自己的捐赠历史

#### 权限

```sql
GRANT EXECUTE ON FUNCTION get_donations_by_email_verified TO anon, authenticated;
```

---

### 3. `is_admin()` → BOOLEAN

检查当前用户是否为管理员（已登录的认证用户）。

#### 认证逻辑

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**说明**:
- 本系统采用管理员专用认证，无用户注册功能
- 只要能通过 `auth.uid()` 获取到用户 ID，即为管理员
- 用于管理员 RLS 策略的权限检查

#### 使用场景

- 管理员后台登录验证
- RLS 策略中的权限检查
- 管理员操作的 Server Actions

#### 权限

```sql
-- SECURITY DEFINER: 使用函数所有者权限执行
```

---

### 4. `upsert_email_subscription(p_email TEXT, p_locale TEXT)` → BIGINT

订阅或更新邮件订阅信息（幂等操作）。✨ 2026-01-04 新增

#### 功能

- 新邮箱：创建订阅记录
- 已存在：更新语言偏好，重新激活订阅

#### 实现逻辑

```sql
CREATE OR REPLACE FUNCTION upsert_email_subscription(
  p_email TEXT,
  p_locale TEXT
)
RETURNS BIGINT AS $$
DECLARE
  v_subscription_id BIGINT;
BEGIN
  -- 验证输入
  IF p_email IS NULL OR p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  IF p_locale NOT IN ('en', 'zh', 'ua') THEN
    RAISE EXCEPTION 'Invalid locale. Must be en, zh, or ua';
  END IF;

  -- Upsert 操作
  INSERT INTO email_subscriptions (email, locale, is_subscribed)
  VALUES (p_email, p_locale, true)
  ON CONFLICT (email) DO UPDATE SET
    locale = EXCLUDED.locale,
    is_subscribed = true,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 使用示例

```sql
-- 新订阅
SELECT upsert_email_subscription('user@example.com', 'en');
-- 返回: 订阅 ID

-- 更新语言（如果已存在）
SELECT upsert_email_subscription('user@example.com', 'zh');
-- 返回: 同一个订阅 ID，语言已更新为 zh
```

#### 权限

```sql
-- SECURITY DEFINER: 使用函数所有者权限执行（绕过 RLS）
```

---

### 5. `unsubscribe_email(p_email TEXT)` → BOOLEAN

通过邮箱取消订阅。✨ 2026-01-04 新增

#### 功能

- 将指定邮箱的 `is_subscribed` 设置为 `false`
- 返回是否成功取消（邮箱不存在或已取消则返回 false）

#### 实现逻辑

```sql
CREATE OR REPLACE FUNCTION unsubscribe_email(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE email_subscriptions
  SET is_subscribed = false
  WHERE email = p_email AND is_subscribed = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 使用示例

```sql
-- 取消订阅
SELECT unsubscribe_email('user@example.com');
-- 返回: true（成功）或 false（邮箱不存在或已取消）
```

#### 权限

```sql
-- SECURITY DEFINER: 使用函数所有者权限执行（允许公开调用）
```

---

## 🔧 触发器函数 (Trigger Functions)

### 1. `update_updated_at_column()`

自动更新 `updated_at` 字段。

#### 实现

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 应用于

- `projects` 表（BEFORE UPDATE 触发器）
- `donations` 表（BEFORE UPDATE 触发器）

---

### 2. `update_project_units()`

根据捐赠状态自动更新项目的 `current_units`。

#### 触发时机

- `AFTER INSERT` on `donations`
- `AFTER UPDATE` on `donations`
- `AFTER DELETE` on `donations`

#### 计数规则

**计入进度的状态**: `paid`, `confirmed`, `delivering`, `completed`
**不计入的状态**: `pending`, `refunding`, `refunded`, `failed`

#### 实现逻辑

```sql
BEGIN
  -- INSERT: 只计入非 pending 捐赠
  IF (TG_OP = 'INSERT') THEN
    IF NEW.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
      UPDATE projects SET current_units = current_units + 1
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;

  -- UPDATE: 处理状态转换
  ELSIF (TG_OP = 'UPDATE') THEN
    -- FROM pending/refunding/refunded TO paid/confirmed/delivering/completed → +1
    IF OLD.donation_status IN ('pending', 'refunding', 'refunded')
       AND NEW.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
      UPDATE projects SET current_units = current_units + 1
      WHERE id = NEW.project_id;

    -- FROM paid/confirmed/delivering/completed TO refunding/refunded → -1
    ELSIF OLD.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
          AND NEW.donation_status IN ('refunding', 'refunded') THEN
      UPDATE projects SET current_units = current_units - 1
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;

  -- DELETE: 如果删除已计数的捐赠，减1
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
      UPDATE projects SET current_units = current_units - 1
      WHERE id = OLD.project_id;
    END IF;
    RETURN OLD;
  END IF;
END;
```

#### 状态转换示例

| 旧状态 | 新状态 | current_units 变化 |
|--------|--------|-------------------|
| pending | paid | +1 |
| paid | confirmed | 无变化 |
| confirmed | delivering | 无变化 |
| delivering | completed | 无变化 |
| paid | refunding | -1 |
| refunding | refunded | 无变化 |
| pending | failed | 无变化 |

---

### 3. `prevent_project_immutable_fields()`

防止修改项目表的不可变字段（额外保护层）。

#### 实现

```sql
CREATE OR REPLACE FUNCTION prevent_project_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 不允许修改 id
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot modify project id';
  END IF;

  -- 不允许修改 created_at
  IF OLD.created_at != NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify project created_at';
  END IF;

  -- ✨ 2025-12-25 新增：不允许修改 aggregate_donations
  IF OLD.aggregate_donations != NEW.aggregate_donations THEN
    RAISE EXCEPTION 'Cannot modify aggregate_donations after project creation';
  END IF;

  -- ✨ 2025-12-25 新增：不允许修改 is_long_term
  IF OLD.is_long_term != NEW.is_long_term THEN
    RAISE EXCEPTION 'Cannot modify is_long_term after project creation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 应用于

- `projects` 表（BEFORE UPDATE 触发器）

#### 保护字段

- `id` - 主键不可修改
- `created_at` - 创建时间不可修改
- `aggregate_donations` - 捐赠聚合标志（创建后不可修改）✨ NEW
- `is_long_term` - 长期项目标志（创建后不可修改）✨ NEW

---

### 4. `prevent_donation_immutable_fields()`

防止修改捐赠表的不可变字段（额外保护层）+ 管理员状态转换验证。

#### 实现

```sql
CREATE OR REPLACE FUNCTION prevent_donation_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查所有不可变字段
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot modify donation id';
  END IF;

  IF OLD.donation_public_id != NEW.donation_public_id THEN
    RAISE EXCEPTION 'Cannot modify donation_public_id';
  END IF;

  [其他字段检查...]

  -- ✨ 2025-12-24 新增：验证管理员状态转换
  IF OLD.donation_status != NEW.donation_status THEN
    -- 如果是管理员（authenticated 用户）
    IF auth.uid() IS NOT NULL THEN
      -- 只允许以下状态转换
      IF NOT (
        (OLD.donation_status = 'paid' AND NEW.donation_status = 'confirmed') OR
        (OLD.donation_status = 'confirmed' AND NEW.donation_status = 'delivering') OR
        (OLD.donation_status = 'delivering' AND NEW.donation_status = 'completed')
      ) THEN
        RAISE EXCEPTION 'Invalid status transition: % → %. Admins can only update: paid→confirmed, confirmed→delivering, delivering→completed',
          OLD.donation_status, NEW.donation_status;
      END IF;
    END IF;
    -- 服务角色（auth.uid() IS NULL）允许任意状态转换（用于 Webhook）
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 应用于

- `donations` 表（BEFORE UPDATE 触发器）

#### 保护字段

- `id` - 主键
- `donation_public_id` - 公开ID
- `project_id` - 项目关联
- `donor_name` / `donor_email` - 捐赠者信息
- `amount` - 捐赠金额
- `order_reference` - 订单号
- `created_at` - 创建时间

#### 管理员状态转换规则（✨ 2025-12-24 新增）

**允许的转换**:
- `paid` → `confirmed`
- `confirmed` → `delivering`
- `delivering` → `completed`

**禁止的转换**:
- 所有退款相关状态（由 WayForPay API 自动处理）
- `pending` → `paid`（由 Webhook 处理）
- 其他非业务流程转换

**说明**:
- 管理员只能修改 `donation_status` 和 `donation_result_url` 字段
- 状态转换严格限制为正常业务流程
- 服务角色（Webhook）可以执行任意状态转换

---

## 🔐 行级安全策略 (RLS Policies)

### Projects 表策略

#### 1. "Allow anonymous read projects"

```sql
CREATE POLICY "Allow anonymous read projects"
ON projects
FOR SELECT
TO anon, authenticated
USING (true);  -- 允许读取所有项目
```

**说明**: 项目是公开信息，允许匿名和认证用户读取所有项目。

---

### Donations 表策略

#### 2. "Allow anonymous read donations"

```sql
CREATE POLICY "Allow anonymous read donations"
ON donations
FOR SELECT
TO anon, authenticated
USING (true);  -- 允许读取所有捐赠
```

**说明**:
- 允许 `.insert().select()` 操作
- 公开 API 使用带混淆的视图保护隐私

#### 3. "Allow anonymous insert pending donations"

```sql
CREATE POLICY "Allow anonymous insert pending donations"
ON donations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- 1. 只允许 'pending' 状态
  donation_status = 'pending'

  -- 2. 金额验证
  AND amount > 0
  AND amount <= 10000  -- 最高 $10,000/单位（防滥用）

  -- 3. 货币验证
  AND currency IN ('USD', 'UAH', 'EUR')

  -- 4. 订单号必须提供
  AND order_reference IS NOT NULL
  AND order_reference != ''

  -- 5. 捐赠ID必须提供
  AND donation_public_id IS NOT NULL
  AND donation_public_id != ''

  -- 6. 捐赠者信息必须提供
  AND donor_name IS NOT NULL
  AND donor_name != ''
  AND donor_email IS NOT NULL
  AND donor_email != ''
  AND donor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

  -- 7. 语言必须有效
  AND locale IN ('en', 'zh', 'ua')

  -- 8. 项目ID必须提供（外键约束检查存在性）
  AND project_id IS NOT NULL
);
```

**安全特性**:
- ✅ 只能创建 pending 状态（webhook 使用 service role 更新为 paid）
- ✅ 金额限制防止滥用
- ✅ 邮箱格式验证
- ✅ 所有必填字段验证
- ✅ 货币白名单

**为什么允许匿名插入？**
- 用户在捐赠时通常是匿名的（未登录）
- RLS 策略严格限制只能插入 pending 状态
- 应用层在调用前已验证项目状态
- Webhook 使用 service role 绕过 RLS 更新状态

#### 4. "Allow anonymous update pending to widget_load_failed"

```sql
CREATE POLICY "Allow anonymous update pending to widget_load_failed"
ON donations
FOR UPDATE
TO anon, authenticated
USING (
  -- 只能更新 pending 状态的捐赠
  donation_status = 'pending'
)
WITH CHECK (
  -- 只能更新为 widget_load_failed
  donation_status = 'widget_load_failed'
);
```

**安全特性**:
- ✅ 只能从 `pending` 转换到 `widget_load_failed`
- ✅ 用于客户端支付窗口加载失败的错误处理
- ✅ 防止修改其他状态的捐赠

**使用场景**: 当 WayForPay 支付窗口脚本加载失败时，客户端调用 Server Action 更新状态

---

### Storage 策略

#### 5. "Public Access - View result images"

```sql
CREATE POLICY "Public Access - View result images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'donation-results');
```

**说明**: 允许公开访问捐赠结果图片（如配送照片）。

---

### 管理员 RLS 策略 (Admin Policies)

> 以下策略用于管理员后台系统，基于 `is_admin()` 函数验证权限

#### Projects 表管理员策略

##### 6. "Admins can insert projects"

```sql
CREATE POLICY "Admins can insert projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (is_admin());
```

**说明**: 管理员可以创建新项目。

##### 7. "Admins can update projects"

```sql
CREATE POLICY "Admins can update projects"
ON projects FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
```

**说明**:
- 管理员可以更新项目信息
- 不可变字段（id, created_at）由 `prevent_project_immutable_fields()` 触发器保护
- 应用层 Server Actions 已过滤不应修改的字段

**注意**: 没有 DELETE 策略，管理员无法删除项目。

---

#### Donations 表管理员策略

##### 8. "Admins can view all donations"

```sql
CREATE POLICY "Admins can view all donations"
ON donations FOR SELECT
TO authenticated
USING (is_admin());
```

**说明**: 管理员可以查看所有捐赠记录（用于后台管理）。

##### 9. "Admins can update donation status"

```sql
CREATE POLICY "Admins can update donation status"
ON donations FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
```

**说明**:
- 管理员可以更新 `donation_status` 和 `donation_result_url` 字段
- 不可变字段由 `prevent_donation_immutable_fields()` 触发器保护
- 状态转换验证在应用层 Server Actions 中处理

**允许的状态转换**:
```
refunding → refunded
paid → confirmed
confirmed → delivering
delivering → completed
```

---

#### Storage 管理员策略 (donation-results bucket)

##### 10. "Admins can upload to donation-results"

```sql
CREATE POLICY "Admins can upload to donation-results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-results' AND
  is_admin()
);
```

##### 11. "Admins can delete from donation-results"

```sql
CREATE POLICY "Admins can delete from donation-results"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'donation-results' AND
  is_admin()
);
```

##### 12. "Admins can view donation-results"

```sql
CREATE POLICY "Admins can view donation-results"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-results' AND
  is_admin()
);
```

##### 13. "Admins can update donation-results metadata"

```sql
CREATE POLICY "Admins can update donation-results metadata"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'donation-results' AND
  is_admin()
);
```

**说明**: 管理员对 donation-results 存储桶拥有完全的 CRUD 权限。

---

#### Email Subscriptions 表策略 ✨ 2026-01-04 新增

##### 14. "Admins can view all subscriptions"

```sql
CREATE POLICY "Admins can view all subscriptions"
ON email_subscriptions FOR SELECT
TO authenticated
USING (is_admin());
```

**说明**:
- 管理员可以查看所有订阅记录（用于群发邮件管理）
- 订阅和取消订阅通过 SECURITY DEFINER 函数执行，不需要额外的 RLS 策略
- 没有 INSERT/UPDATE/DELETE 策略，所有修改操作通过函数执行

---

## 📦 存储桶 (Storage Buckets)

### `donation-results`

捐赠结果图片存储桶。

#### 配置

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-results',
  'donation-results',
  true,                    -- 公开访问
  5242880,                 -- 5MB 限制
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ]
);
```

#### 使用场景

- 上传配送完成照片
- 项目进展图片
- 公开展示捐赠成果

#### 访问方式

```
https://{SUPABASE_URL}/storage/v1/object/public/donation-results/{path}
```

---

## 🎯 触发器 (Triggers)

### 1. `update_projects_updated_at`

```sql
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**作用**: 自动更新项目的 `updated_at` 字段。

---

### 2. `update_project_units_trigger`

```sql
CREATE TRIGGER update_project_units_trigger
AFTER INSERT OR UPDATE OR DELETE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_project_units();
```

**作用**: 根据捐赠状态变化自动更新项目的 `current_units` 字段。

---

### 3. `update_donations_updated_at`

```sql
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**作用**: 自动更新捐赠记录的 `updated_at` 字段。

---

### 4. `prevent_project_immutable_fields_trigger`

```sql
CREATE TRIGGER prevent_project_immutable_fields_trigger
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION prevent_project_immutable_fields();
```

**作用**: 防止修改项目表的不可变字段（id, created_at）。

---

### 5. `prevent_donation_immutable_fields_trigger`

```sql
CREATE TRIGGER prevent_donation_immutable_fields_trigger
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION prevent_donation_immutable_fields();
```

**作用**: 防止修改捐赠表的不可变字段（id, donation_public_id, project_id, donor info, amount, order_reference, created_at）。

---

### 6. `update_email_subscriptions_updated_at` ✨ 2026-01-04 新增

```sql
CREATE TRIGGER update_email_subscriptions_updated_at
BEFORE UPDATE ON email_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_email_subscription_updated_at();
```

**作用**: 自动更新邮件订阅记录的 `updated_at` 字段。

---

### 7. `prevent_subscription_immutable_fields_trigger` ✨ 2026-01-04 新增

```sql
CREATE TRIGGER prevent_subscription_immutable_fields_trigger
BEFORE UPDATE ON email_subscriptions
FOR EACH ROW
EXECUTE FUNCTION prevent_subscription_immutable_fields();
```

**作用**: 防止修改订阅表的不可变字段（id）。

---

## 🔑 权限管理 (Permissions)

### 公开视图权限

```sql
-- 项目统计视图
GRANT SELECT ON project_stats TO anon, authenticated;

-- 公开捐赠视图
GRANT SELECT ON public_project_donations TO anon, authenticated;

-- 订单捐赠视图
GRANT SELECT ON order_donations_secure TO anon, authenticated;
```

### 安全函数权限

```sql
-- 根据邮箱查询捐赠
GRANT EXECUTE ON FUNCTION get_donations_by_email_verified(TEXT, TEXT)
TO anon, authenticated;

-- 请求退款
GRANT EXECUTE ON FUNCTION request_donation_refund(TEXT, TEXT)
TO anon, authenticated;

-- 获取最近捐赠
GRANT EXECUTE ON FUNCTION get_recent_donations(BIGINT, INTEGER)
TO anon, authenticated;
```

---

## 🔒 安全架构

### RLS 策略层级

```
┌─────────────────────────────────────────────────┐
│           应用层 (Application)                   │
│  - Next.js Server Actions                       │
│  - API Routes                                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         Supabase 客户端层                        │
│  - Anonymous Client (anon key)                  │
│  - Service Role Client (service role key)       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│          RLS 策略层 (Row Level Security)        │
│  - 匿名用户策略                                  │
│  - 认证用户策略                                  │
│  - Service Role 绕过所有 RLS                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│            数据库层 (PostgreSQL)                 │
│  - 表、视图、函数、触发器                         │
│  - 外键约束、CHECK 约束                          │
└─────────────────────────────────────────────────┘
```

### 客户端使用场景

| 操作 | 客户端类型 | RLS | 使用场景 |
|------|-----------|-----|----------|
| 创建待支付捐赠 | Anonymous | ✅ | Server Action: 用户提交捐赠表单 |
| 查询项目列表 | Anonymous | ✅ | 公开页面 |
| 查询捐赠（邮箱验证） | Anonymous + Function | ✅ | SECURITY DEFINER 函数 |
| Webhook 更新状态 | Service Role | ❌ | WayForPay 支付回调 |
| 管理员操作 | Service Role | ❌ | 后台管理 |

### 安全最佳实践

1. **最小权限原则**:
   - 匿名用户只能插入 pending 捐赠
   - Service role 仅用于 webhook 和管理员操作

2. **数据验证层级**:
   - 应用层: 业务逻辑验证（项目状态、库存等）
   - RLS 层: 基础安全验证（状态、金额、格式）
   - 数据库层: 数据完整性约束（外键、CHECK）

3. **隐私保护**:
   - 公开视图使用邮箱混淆
   - 敏感查询使用 SECURITY DEFINER 函数
   - 需要双重验证（邮箱+捐赠ID）

4. **防止滥用**:
   - 金额上限（$10,000/单位）
   - 状态转换控制（只能创建 pending）
   - 邮箱格式验证

---

## 📈 数据库性能优化

### 已创建的索引汇总

#### Projects 表索引
```sql
idx_projects_status              -- 状态筛选
idx_projects_start_date          -- 日期排序
idx_projects_aggregate_donations -- 聚合标志筛选 ✨ NEW
idx_projects_name_i18n_en        -- 英文搜索
idx_projects_name_i18n_zh        -- 中文搜索
idx_projects_name_i18n_ua        -- 乌克兰文搜索
```

#### Donations 表索引
```sql
idx_donations_project_id         -- 项目捐赠查询
idx_donations_status             -- 状态筛选
idx_donations_public_id          -- 单个捐赠查询
idx_donations_email              -- 邮箱查询
idx_donations_locale             -- 语言筛选
idx_donations_order_reference    -- 订单号查询（唯一）
idx_donations_order_ref_status   -- Webhook 查询（复合）
idx_donations_refund_status      -- 退款查询
```

### 查询优化建议

1. **使用视图**: 复杂聚合查询使用预定义视图（如 `project_stats`）
2. **索引覆盖**: 常用查询字段都已创建索引
3. **部分索引**: `order_reference` 使用部分索引（只索引非 NULL 值）
4. **复合索引**: `(order_reference, donation_status)` 用于 webhook 高频查询

---

## 🗂️ 迁移文件清单

| 序号 | 文件名 | 说明 |
|------|--------|------|
| 1 | `20251219061700_reset_complete.sql` | 完整数据库重置和初始化 |
| 2 | `20251219070737_fix_rls_policies.sql` | 修复 RLS 策略（移除 auth.users 查询） |
| 3 | `20251219080000_add_obfuscated_donation_view.sql` | 添加邮箱混淆捐赠视图 |
| 4 | `20251219100000_add_project_i18n.sql` | 添加项目多语言支持 |
| 5 | `20251219120000_fix_order_reference_index.sql` | 修复订单号索引（移除 UNIQUE） |
| 6 | `20251219130000_fix_refunding_trigger.sql` | 修复退款触发器 |
| 7 | `20251220000000_add_failed_status.sql` | 添加 'failed' 状态 |
| 8 | `20251221000000_drop_unused_functions.sql` | 删除未使用的函数和视图 |
| 9 | `20251221010000_allow_anonymous_pending_donations.sql` | 允许匿名插入待支付捐赠 |
| 10 | `20251221020000_secure_order_donations_view.sql` | 创建安全订单捐赠视图 |
| 11 | `20251221030000_secure_track_donation_functions.sql` | 创建安全追踪捐赠函数 |
| 12 | `20251221040000_fix_donation_insert_policy.sql` | 修复捐赠插入策略 |
| 13 | `20251221050000_allow_anon_read_projects.sql` | 允许匿名读取项目 |
| 14 | `20251221060000_minimal_donation_policy.sql` | 最小化捐赠策略（测试） |
| 15 | `20251221070000_allow_anon_read_pending_donations.sql` | 允许匿名读取捐赠 |
| 16 | `20251221080000_complete_donation_policy.sql` | 完整捐赠插入策略 |
| 17 | `20251222000000_fix_ambiguous_column_reference.sql` | 修复列名歧义 |
| 18 | `20251222010000_include_pending_in_order_view.sql` | 订单视图包含 pending 状态 |
| 19 | `20251223000000_cleanup_and_add_donation_updated_at.sql` | 清理未使用函数 + 添加 donations.updated_at 字段 |
| 20 | `20251223100000_enable_admin_auth.sql` | 启用管理员认证系统（is_admin函数） |
| 21 | `20251223120000_add_admin_rls_policies.sql` | 添加管理员 RLS 策略 |
| 22 | `20251223130000_add_updated_at_to_public_views.sql` | 公开视图添加 updated_at 字段 |
| 23 | `20251223140000_fix_admin_rls_policies.sql` | 修复管理员 RLS 策略 + 添加字段保护触发器 |
| 24 | `20251223075954_fix_donation_public_id_ambiguous_reference.sql` | 修复 get_donations_by_email_verified 函数列名歧义 |
| 25 | `20251224000000_add_donation_status_constraints.sql` | 添加捐赠状态约束（16个状态） |
| 26 | `20251224120000_restrict_admin_status_updates.sql` | 限制管理员状态更新权限 |
| 27 | `20251224130000_add_order_reference_to_track_function.sql` | 为追踪函数添加 order_reference 字段 |
| 28 | `20251224140000_fix_duplicate_donation_status_constraint.sql` | 修复重复的捐赠状态约束 |
| 29 | `20251224150000_allow_anon_update_pending_to_failed.sql` | 允许匿名用户更新 pending → failed 状态 |
| 30 | `20251224160000_remove_user_cancelled_status.sql` | 移除 user_cancelled 状态（减为15个状态） |
| 31 | `20251225000000_add_aggregate_donations_flag.sql` | 为 projects 表添加 aggregate_donations 标志 |
| 32 | `20251225000001_update_project_stats_view.sql` | 更新 project_stats 视图（添加 aggregate_donations 字段） |
| 33 | `20251225000002_protect_aggregate_donations_field.sql` | 保护 aggregate_donations 字段不被修改 |
| 34 | `20251225000003_fix_donation_count_logic.sql` | 修复捐赠计数逻辑（按订单号去重） |
| 35 | `20251225000004_protect_is_long_term_field.sql` | 保护 is_long_term 字段不被修改 |
| 36 | `20251225010000_cleanup_legacy_functions.sql` | 清理旧的无用函数 |
| 37 | `20251225020000_remove_unused_refund_function.sql` | 删除未使用的 request_donation_refund 函数 |
| 38 | `20251225030000_add_order_id_to_public_donations.sql` | 为 public_project_donations 视图添加 order_id 字段 |
| 39 | `20260104000000_email_subscriptions.sql` | 添加邮件订阅系统（表、函数、触发器、RLS策略）✨ NEW |

---

## 🔄 数据库迁移历史

### 主要变更时间线

**2025-12-19**
- ✅ 完整数据库架构初始化
- ✅ 添加多语言支持（i18n）
- ✅ 创建邮箱混淆视图
- ✅ 修复退款触发器逻辑

**2025-12-20**
- ✅ 添加支付失败状态（'failed'）

**2025-12-21**
- ✅ 重构 RLS 策略（安全性提升）
- ✅ 允许匿名用户创建待支付捐赠
- ✅ 创建安全查询函数（SECURITY DEFINER）
- ✅ 删除未使用的数据库对象
- ✅ 完善捐赠插入策略

**2025-12-22**
- ✅ 修复数据库函数列名歧义
- ✅ 订单视图包含 pending 状态（改善用户体验）

**2025-12-23**
- ✅ 删除未使用的数据库函数（代码清理）
  - 删除 `get_project_progress` - 已被 `project_stats` 视图替代
  - 删除 `get_recent_donations` - 已被 `public_project_donations` 视图替代
  - 删除 `is_project_goal_reached` - 前端直接计算更高效
- ✅ 为 donations 表添加 `updated_at` 字段
- ✅ 添加自动更新触发器 `update_donations_updated_at`
- ✅ **启用管理员认证系统**
  - 创建 `is_admin()` 函数用于权限验证
  - 添加管理员 RLS 策略（Projects、Donations、Storage）
  - 管理员可以创建/更新项目
  - 管理员可以更新捐赠状态（仅限合法状态转换）
  - 管理员可以管理 donation-results 存储桶
- ✅ 添加数据库级字段保护
  - `prevent_project_immutable_fields()` 触发器
  - `prevent_donation_immutable_fields()` 触发器
- ✅ 公开视图添加 `updated_at` 字段
  - `public_project_donations` 视图
  - `get_donations_by_email_verified()` 函数

**2025-12-24**
- ✅ 修复 `get_donations_by_email_verified()` 函数列名歧义问题
- ✅ **扩展捐赠状态系统**
  - 添加捐赠状态约束（16 个状态）
  - 支持完整的 WayForPay 支付流程状态
  - 新增状态：processing, fraud_check, widget_load_failed, expired, declined, refund_processing
- ✅ **限制管理员状态更新权限**
  - 管理员只能执行 3 个业务流程转换（paid→confirmed, confirmed→delivering, delivering→completed）
  - 退款状态由 WayForPay API 自动处理
  - 数据库触发器强制执行状态转换规则
- ✅ 为追踪函数添加 `order_reference` 字段（用于订单分组）
- ✅ 修复重复的捐赠状态约束
- ✅ 允许匿名用户更新 pending → widget_load_failed（客户端错误处理）
- ✅ **移除 user_cancelled 状态**（减为 15 个状态）
  - 原因：无法可靠检测客户端用户取消操作
  - 改用 WayForPay Expired webhook（权威超时信号）

**2025-12-25**
- ✅ **新增 aggregate_donations 字段**
  - 为 projects 表添加布尔标志
  - 控制捐赠记录创建行为（聚合 vs 拆分）
  - 适用场景：打赏项目（聚合）vs 物资项目（按单位拆分）
- ✅ 更新 `project_stats` 视图
  - 添加 `aggregate_donations` 字段
  - 修复 `donation_count` 逻辑（按 order_reference 去重）
  - donation_count 现在表示实际支付交易数而非记录数
- ✅ 字段保护增强
  - `aggregate_donations` 字段创建后不可修改
  - `is_long_term` 字段创建后不可修改
- ✅ 清理旧函数
  - 删除 `update_project_units_on_donation` - 已被触发器替代
  - 删除 `cleanup_expired_pending_payments` - 表已删除
  - 删除 `update_pending_payment_expires_at` - 表已删除
  - 删除 `request_donation_refund` - 未使用（实际使用 Server Action）
- ✅ 为 `public_project_donations` 视图添加 `order_id` 字段
  - 使用 MD5 哈希保护隐私
  - 允许 UI 对同一订单的捐赠进行可视化分组

**2026-01-04**
- ✅ **新增邮件订阅系统**
  - 创建 `email_subscriptions` 表存储订阅者信息
  - 创建 `upsert_email_subscription()` 函数（幂等订阅/更新）
  - 创建 `unsubscribe_email()` 函数（取消订阅）
  - 创建 `update_email_subscription_updated_at()` 触发器函数
  - 创建 `prevent_subscription_immutable_fields()` 触发器函数
  - 添加 RLS 策略：管理员可查看所有订阅
  - 添加索引：email、is_subscribed、locale
- ✅ **邮件订阅功能**
  - 捐赠表单添加订阅 checkbox
  - 管理员群发邮件（按语言分组）
  - 取消订阅链接支持
  - 邮件模板系统（文件存储）

---

## 📝 注释和文档

所有数据库对象都包含 SQL 注释：

```sql
-- 表注释
COMMENT ON TABLE projects IS '存储NGO项目信息和资金目标及进度';
COMMENT ON TABLE donations IS '存储与项目关联的捐赠记录和支付详情';

-- 列注释示例
COMMENT ON COLUMN projects.target_units IS '目标单位数量（NULL表示无固定目标）';
COMMENT ON COLUMN donations.donation_status IS '捐赠状态：pending（待支付）...';

-- 函数注释
COMMENT ON FUNCTION generate_donation_public_id IS '生成唯一公开捐赠ID...';

-- 策略注释
COMMENT ON POLICY "Allow anonymous insert pending donations" ON donations IS '...';
```

---

## 🚀 下一步改进建议

### 性能优化
- [ ] 添加数据库连接池配置
- [ ] 实现查询缓存（Redis）
- [ ] 监控慢查询并优化

### 功能扩展
- [ ] 添加捐赠证书生成表
- [ ] 实现项目更新时间线表
- [ ] 添加用户收藏项目表

### 安全增强
- [ ] 实现 API 速率限制（数据库层）
- [ ] 添加审计日志表
- [ ] 实现数据加密字段

### 数据分析
- [ ] 创建捐赠趋势分析视图
- [ ] 添加项目完成度预测函数
- [ ] 实现捐赠者画像统计

---

## 📞 相关文档

- **项目文档**: `/CLAUDE.md`
- **API 文档**: `/docs/API.md`（待创建）
- **部署指南**: `/docs/DEPLOYMENT.md`（待创建）
- **故障排查**: `/docs/TROUBLESHOOTING.md`

---

## 📄 许可证

本文档随 NGO 平台项目一起使用相同的许可证。

---

**文档维护者**: 开发团队
**最后审核**: 2026-01-04
**版本**: 1.4.0 (新增邮件订阅系统)
