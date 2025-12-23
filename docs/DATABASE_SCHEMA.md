# NGO 平台 - 数据库架构完整文档

## 📋 文档概述

本文档详细记录了 NGO 平台数据库的完整架构，包括所有表、视图、函数、触发器、索引、RLS 策略和存储桶配置。

**最后更新**: 2025-12-23
**数据库版本**: PostgreSQL (Supabase)
**迁移文件数量**: 19 个

---

## 📊 数据库概览

### 核心组件统计
- **表 (Tables)**: 2 个
- **视图 (Views)**: 3 个
- **函数 (Functions)**: 5 个（2个业务函数 + 2个触发器函数 + 1个ID生成函数）
- **触发器 (Triggers)**: 3 个
- **存储桶 (Storage Buckets)**: 1 个
- **RLS 策略 (RLS Policies)**: 4 个

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

-- 状态约束
CONSTRAINT valid_donation_status CHECK (
  donation_status IN (
    'pending',    -- 待支付
    'paid',       -- 已支付
    'confirmed',  -- NGO已确认
    'delivering', -- 配送中
    'completed',  -- 已完成
    'refunding',  -- 退款中
    'refunded',   -- 已退款
    'failed'      -- 支付失败
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
pending → paid → confirmed → delivering → completed
                    ↓
                refunding → refunded

支付失败流程：
pending → failed
```

| 状态 | 英文 | 说明 | 计入项目进度 |
|------|------|------|-------------|
| 待支付 | pending | 订单已创建，等待支付 | ❌ |
| 已支付 | paid | 支付成功，等待NGO确认 | ✅ |
| 已确认 | confirmed | NGO已确认收款 | ✅ |
| 配送中 | delivering | 物资配送中 | ✅ |
| 已完成 | completed | 配送完成 | ✅ |
| 退款中 | refunding | 退款请求已提交 | ❌ |
| 已退款 | refunded | 退款已完成 | ❌ |
| 支付失败 | failed | 支付失败或被拒绝 | ❌ |

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
  p.description_i18n,
  -- 聚合字段
  COALESCE(SUM(
    CASE WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
    THEN d.amount ELSE 0 END
  ), 0) AS total_raised,              -- 总筹款金额
  COUNT(
    CASE WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
    THEN 1 END
  ) AS donation_count,                -- 捐赠笔数
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
  d.amount,
  d.currency,
  d.donation_status,
  d.donated_at
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
  project_id BIGINT,
  donor_email VARCHAR(255),
  amount NUMERIC(10,2),
  currency VARCHAR(10),
  donation_status VARCHAR(20),
  donated_at TIMESTAMPTZ,
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

### 3. `request_donation_refund(p_donation_public_id TEXT, p_email TEXT)` → JSON

请求退款（需验证所有权）。

#### 返回格式

```json
// 成功
{
  "success": true,
  "message": "Refund request submitted successfully"
}

// 失败示例
{
  "error": "donationNotFound",
  "message": "Donation not found or email does not match"
}

{
  "error": "cannotRefundCompleted",
  "message": "Cannot refund completed donations"
}

{
  "error": "alreadyRefunding",
  "message": "Refund already in progress or completed"
}
```

#### 退款规则

| 当前状态 | 可否退款 | 说明 |
|----------|---------|------|
| pending | ❌ | 未支付，无需退款 |
| paid | ✅ | 可以退款 |
| confirmed | ✅ | 可以退款 |
| delivering | ✅ | 可以退款 |
| completed | ❌ | 已完成，不可退款 |
| refunding | ❌ | 已在退款中 |
| refunded | ❌ | 已退款 |
| failed | ❌ | 支付失败，无需退款 |

#### 实现逻辑

```sql
BEGIN
  -- 步骤1: 验证所有权并获取当前状态
  SELECT id, donation_status INTO v_donation_id, v_status
  FROM donations
  WHERE donation_public_id = p_donation_public_id
    AND LOWER(donor_email) = LOWER(p_email);

  -- 步骤2: 检查捐赠是否存在
  IF v_donation_id IS NULL THEN
    RETURN json_build_object('error', 'donationNotFound', ...);
  END IF;

  -- 步骤3: 验证退款资格
  IF v_status = 'completed' THEN
    RETURN json_build_object('error', 'cannotRefundCompleted', ...);
  END IF;
  [其他状态检查...]

  -- 步骤4: 更新状态为 'refunding'
  UPDATE donations SET donation_status = 'refunding'
  WHERE id = v_donation_id;

  -- 步骤5: 返回成功
  RETURN json_build_object('success', true, ...);
END;
```

#### 副作用

- 触发器自动更新 `projects.current_units`（减1）

#### 使用场景

- 用户自助退款功能
- 捐赠追踪页面

#### 权限

```sql
GRANT EXECUTE ON FUNCTION request_donation_refund TO anon, authenticated;
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

---

### Storage 策略

#### 4. "Public Access - View result images"

```sql
CREATE POLICY "Public Access - View result images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'donation-results');
```

**说明**: 允许公开访问捐赠结果图片（如配送照片）。

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
**最后审核**: 2025-12-23
**版本**: 1.1.0 (数据库函数清理 + donations.updated_at 字段)
