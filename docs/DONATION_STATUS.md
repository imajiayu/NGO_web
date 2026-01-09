# 捐赠状态系统技术文档

> 本文档详细描述捐赠状态的定义、流转规则、数据库约束和相关代码实现

**文档版本**: 1.1.0
**最后更新**: 2026-01-09

---

## 目录

1. [概述](#1-概述)
2. [状态定义](#2-状态定义)
3. [状态流程图](#3-状态流程图)
4. [WayForPay 状态映射](#4-wayforpay-状态映射)
5. [数据库实现](#5-数据库实现)
6. [数据库视图](#6-数据库视图)
7. [数据库函数](#7-数据库函数)
8. [触发器](#8-触发器)
9. [RLS 策略](#9-rls-策略)
10. [状态历史审计](#10-状态历史审计)
11. [应用层代码](#11-应用层代码)
12. [UI 组件](#12-ui-组件)
13. [国际化](#13-国际化)
14. [相关文件索引](#14-相关文件索引)

---

## 1. 概述

本系统使用 **14 种捐赠状态** 来追踪捐赠的完整生命周期，从创建到完成或退款。状态系统涵盖：

- 支付前状态（用户创建订单但未完成支付）
- 处理中状态（支付网关处理中）
- 已支付状态（支付成功后的履约流程）
- 失败状态（支付失败的各种情况）
- 退款状态（退款请求和处理）

---

## 2. 状态定义

### 2.1 类型定义

**文件**: `types/index.ts`

```typescript
/**
 * Donation Status Values - 14 total statuses
 *
 * Pre-payment:
 * - pending: Order created, awaiting payment
 * - widget_load_failed: Payment widget failed to load (network issue)
 *
 * Processing:
 * - processing: Payment being processed by gateway (WayForPay inProcessing)
 * - fraud_check: Under anti-fraud verification (WayForPay Pending)
 *
 * Payment Complete:
 * - paid: Payment successful, funds received
 * - confirmed: NGO confirmed the donation
 * - delivering: Items being delivered
 * - completed: Delivery completed
 *
 * Payment Failed:
 * - expired: Payment timeout (WayForPay Expired)
 * - declined: Bank declined the payment (WayForPay Declined)
 * - failed: Other payment failures
 *
 * Refund:
 * - refunding: Refund requested by donor
 * - refund_processing: Refund being processed (WayForPay RefundInProcessing)
 * - refunded: Refund completed (includes WayForPay Refunded and Voided)
 */
export const DONATION_STATUSES = [
  'pending', 'widget_load_failed',
  'processing', 'fraud_check',
  'paid', 'confirmed', 'delivering', 'completed',
  'expired', 'declined', 'failed',
  'refunding', 'refund_processing', 'refunded',
] as const

export type DonationStatus = typeof DONATION_STATUSES[number]
```

### 2.2 状态分类表

| 分类 | 状态 | 说明 | 用户可见 |
|------|------|------|---------|
| **支付前** | `pending` | 订单已创建，待支付 | ✓ |
| | `widget_load_failed` | 支付窗口加载失败（网络问题） | ✓ |
| **处理中** | `processing` | 支付网关处理中 | ✓ |
| | `fraud_check` | 反欺诈审核中 | ✓ |
| **已支付** | `paid` | 已支付，资金已到账 | ✓ |
| | `confirmed` | NGO 已确认捐赠 | ✓ |
| | `delivering` | 物资配送中 | ✓ |
| | `completed` | 配送完成 | ✓ |
| **支付失败** | `expired` | 支付超时 | ✓ |
| | `declined` | 银行拒绝支付 | ✓ |
| | `failed` | 其他支付失败 | ✓ |
| **退款** | `refunding` | 退款申请中 | ✓ |
| | `refund_processing` | 退款处理中 | ✓ |
| | `refunded` | 已退款 | ✓ |

### 2.3 被计数状态 vs 未计数状态

项目进度统计只计算以下状态的捐赠：

| 类型 | 状态列表 |
|------|---------|
| **被计数** | `paid`, `confirmed`, `delivering`, `completed` |
| **未计数** | `pending`, `processing`, `fraud_check`, `widget_load_failed`, `expired`, `declined`, `failed`, `refunding`, `refund_processing`, `refunded` |

---

## 3. 状态流程图

### 3.1 完整状态流转图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              支付流程                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌────────────┐    ┌──────┐    ┌───────────┐    ┌─────────┐ │
│  │ pending │───▶│ processing │───▶│ paid │───▶│ confirmed │───▶│delivering│ │
│  └────┬────┘    └─────┬──────┘    └──┬───┘    └───────────┘    └────┬────┘ │
│       │               │              │                               │      │
│       │               ▼              │                               ▼      │
│       │        ┌─────────────┐       │                        ┌──────────┐  │
│       │        │ fraud_check │───────┘                        │completed │  │
│       │        └─────────────┘                                └──────────┘  │
│       │                                                                     │
│       ▼                                                                     │
│  ┌───────────────────┐                                                      │
│  │ widget_load_failed│                                                      │
│  └───────────────────┘                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              失败流程                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  pending ────────▶ expired                                                  │
│                                                                             │
│  processing ─────▶ declined                                                 │
│              └───▶ failed                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              退款流程                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  paid ──────────┐                                                           │
│  confirmed ─────┼───▶ refunding ───▶ refund_processing ───▶ refunded       │
│  delivering ────┤                                                           │
│  completed ─────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 状态转换规则

#### Webhook 可执行的转换（Service Role）

| 来源状态 | 目标状态 | 触发条件 |
|---------|---------|---------|
| `pending` | `processing` | WayForPay inProcessing |
| `pending` | `fraud_check` | WayForPay Pending |
| `pending` | `paid` | WayForPay Approved |
| `pending` | `expired` | WayForPay Expired |
| `pending` | `declined` | WayForPay Declined |
| `processing` | `paid` | WayForPay Approved |
| `processing` | `declined` | WayForPay Declined |
| `processing` | `failed` | WayForPay 其他失败 |
| `fraud_check` | `paid` | WayForPay Approved |
| `paid`/`confirmed`/`delivering` | `refunding` | 用户申请退款 |
| `refunding` | `refund_processing` | WayForPay RefundInProcessing |
| `refunding`/`refund_processing` | `refunded` | WayForPay Refunded/Voided |

#### 管理员可执行的转换

| 来源状态 | 目标状态 | 操作说明 |
|---------|---------|---------|
| `paid` | `confirmed` | 确认收到捐赠 |
| `confirmed` | `delivering` | 开始配送物资 |
| `delivering` | `completed` | 配送完成（需上传照片） |

#### 匿名用户可执行的转换

| 来源状态 | 目标状态 | 触发条件 |
|---------|---------|---------|
| `pending` | `widget_load_failed` | 支付窗口加载失败 |

---

## 4. WayForPay 状态映射

### 4.1 WayForPay 状态常量

**文件**: `lib/payment/wayforpay/server.ts`

```typescript
export const WAYFORPAY_STATUS = {
  // Success
  APPROVED: 'Approved',
  // Processing
  IN_PROCESSING: 'inProcessing',
  WAITING_AUTH_COMPLETE: 'WaitingAuthComplete',
  PENDING: 'Pending',
  // Failed
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
  // Refund
  REFUND_IN_PROCESSING: 'RefundInProcessing',
  REFUNDED: 'Refunded',
  VOIDED: 'Voided',
} as const
```

### 4.2 状态映射表

| WayForPay 状态 | 系统状态 | 说明 |
|---------------|---------|------|
| `Approved` | `paid` | 支付成功 |
| `WaitingAuthComplete` | `paid` | 3DS 验证完成 |
| `inProcessing` | `processing` | 支付处理中 |
| `Pending` | `fraud_check` | 反欺诈审核 |
| `Declined` | `declined` | 银行拒绝 |
| `Expired` | `expired` | 支付超时 |
| `RefundInProcessing` | `refund_processing` | 退款处理中 |
| `Refunded` | `refunded` | 退款成功 |
| `Voided` | `refunded` | 交易作废（视为退款） |

---

## 5. 数据库实现

### 5.1 CHECK 约束

**迁移文件**: `20251224000000_add_donation_status_constraints.sql`

```sql
ALTER TABLE public.donations
ADD CONSTRAINT donations_status_check CHECK (
  donation_status IN (
    -- Pre-payment (支付前)
    'pending',
    'widget_load_failed',

    -- Processing (处理中)
    'processing',
    'fraud_check',

    -- Payment complete (已支付)
    'paid',
    'confirmed',
    'delivering',
    'completed',

    -- Payment failed (支付失败)
    'expired',
    'declined',
    'failed',

    -- Refund (退款)
    'refunding',
    'refund_processing',
    'refunded'
  )
);
```

### 5.2 状态索引

```sql
-- 基础状态索引
CREATE INDEX idx_donations_status ON public.donations(donation_status);

-- 订单+状态复合索引
CREATE INDEX idx_donations_order_ref_status
    ON public.donations(order_reference, donation_status)
    WHERE order_reference IS NOT NULL;

-- 退款状态索引
CREATE INDEX idx_donations_refund_status
    ON public.donations(donation_status)
    WHERE donation_status IN ('refunding', 'refunded');
```

---

## 6. 数据库视图

与捐赠状态相关的视图用于安全地暴露数据给不同的使用场景。

### 6.1 order_donations_secure

**用途**: 按订单查询捐赠（支付成功页使用）
**迁移文件**: `20260105020000_allow_all_statuses_in_order_view.sql`

```sql
CREATE VIEW public.order_donations_secure AS
SELECT
  d.id,
  d.donation_public_id,
  d.amount,
  d.donation_status,
  d.order_reference,
  -- 邮箱混淆: john.doe@example.com → j***e@e***.com
  CASE
    WHEN position('@' in d.donor_email) > 0 THEN
      substring(split_part(d.donor_email, '@', 1), 1, 1) || '***' ||
      substring(split_part(d.donor_email, '@', 1), length(split_part(d.donor_email, '@', 1)), 1) || '@' ||
      substring(split_part(d.donor_email, '@', 2), 1, 1) || '***' ||
      substring(split_part(d.donor_email, '@', 2), length(split_part(d.donor_email, '@', 2)) - 1, 2)
    ELSE '***'
  END AS donor_email_obfuscated,
  p.id AS project_id,
  p.project_name,
  p.project_name_i18n,
  p.aggregate_donations
FROM public.donations d
INNER JOIN public.projects p ON d.project_id = p.id
WHERE d.order_reference IS NOT NULL AND d.order_reference != '';
```

**特点**:
- 接受所有 14 种状态（无状态过滤）
- 邮箱自动混淆
- 不暴露捐赠者姓名
- 通过 `order_reference` 作为安全标识符

### 6.2 project_stats

**用途**: 项目统计信息（首页/项目列表使用）
**迁移文件**: `20251225000001_update_project_stats_view.sql`

```sql
CREATE VIEW public.project_stats AS
SELECT
    p.id,
    p.project_name,
    p.project_name_i18n,
    p.status,
    p.target_units,
    p.current_units,
    p.unit_name,
    p.unit_price,
    p.aggregate_donations,
    -- 只统计成功状态的捐赠金额
    COALESCE(SUM(
        CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN d.amount
            ELSE 0
        END
    ), 0) AS total_raised,
    -- 只统计成功状态的捐赠数量
    COUNT(
        CASE
            WHEN d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
            THEN 1
        END
    ) AS donation_count,
    -- 进度百分比
    CASE
        WHEN p.target_units > 0 THEN
            ROUND((p.current_units::NUMERIC / p.target_units::NUMERIC) * 100, 2)
        ELSE 0
    END AS progress_percentage
FROM public.projects p
LEFT JOIN public.donations d ON p.id = d.project_id
GROUP BY p.id;
```

**状态过滤**: 只统计 `paid`, `confirmed`, `delivering`, `completed` 状态

### 6.3 public_project_donations

**用途**: 项目详情页的捐赠列表
**迁移文件**: `20251225030000_add_order_id_to_public_donations.sql`

```sql
CREATE VIEW public.public_project_donations AS
SELECT
    d.id,
    d.donation_public_id,
    d.project_id,
    -- 邮箱混淆
    CASE
        WHEN d.donor_email IS NOT NULL AND POSITION('@' IN d.donor_email) > 0 THEN
            SUBSTRING(d.donor_email FROM 1 FOR 1) || '***' ||
            SUBSTRING(d.donor_email FROM POSITION('@' IN d.donor_email) - 1 FOR 1) || '@' ||
            SUBSTRING(SUBSTRING(d.donor_email FROM POSITION('@' IN d.donor_email) + 1) FROM 1 FOR 1) || '***' ||
            '.' || SPLIT_PART(SUBSTRING(d.donor_email FROM POSITION('@' IN d.donor_email) + 1), '.', 2)
        ELSE NULL
    END as donor_email_obfuscated,
    -- order_id: MD5 哈希用于分组（不暴露真实 order_reference）
    MD5(COALESCE(d.order_reference, '')) as order_id,
    d.amount,
    d.currency,
    d.donation_status,
    d.donated_at,
    d.updated_at
FROM public.donations d
WHERE d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
ORDER BY d.donated_at DESC;
```

**状态过滤**: 只显示 `paid`, `confirmed`, `delivering`, `completed` 状态

### 6.4 public_donation_feed

**用途**: 公开的捐赠动态（首页滚动展示）
**迁移文件**: `20251219061700_reset_complete.sql`

```sql
CREATE VIEW public.public_donation_feed AS
SELECT
    d.donation_public_id,
    p.project_name,
    p.id as project_id,
    -- 捐赠者名称匿名化: "John Doe" → "John D."
    CASE
        WHEN POSITION(' ' IN d.donor_name) > 0 THEN
            SPLIT_PART(d.donor_name, ' ', 1) || ' ' ||
            LEFT(SPLIT_PART(d.donor_name, ' ', 2), 1) || '.'
        ELSE
            LEFT(d.donor_name, 1) || REPEAT('*', GREATEST(LENGTH(d.donor_name) - 1, 3))
    END as donor_display_name,
    d.amount,
    d.currency,
    d.donated_at,
    d.donation_status
FROM public.donations d
JOIN public.projects p ON d.project_id = p.id
WHERE d.donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
ORDER BY d.donated_at DESC;
```

**状态过滤**: 只显示 `paid`, `confirmed`, `delivering`, `completed` 状态

### 6.5 视图状态过滤汇总

| 视图 | 状态过滤 | 用途 |
|------|---------|------|
| `order_donations_secure` | 无（全部 14 种） | 支付结果页查询 |
| `project_stats` | paid, confirmed, delivering, completed | 项目统计 |
| `public_project_donations` | paid, confirmed, delivering, completed | 项目捐赠列表 |
| `public_donation_feed` | paid, confirmed, delivering, completed | 首页捐赠动态 |

---

## 7. 数据库函数

### 7.1 get_donations_by_email_verified()

**用途**: 捐赠追踪功能 - 验证邮箱后返回该邮箱的所有捐赠
**迁移文件**: `20260104020000_add_aggregate_to_track_function.sql`

```sql
CREATE OR REPLACE FUNCTION get_donations_by_email_verified(
  p_email TEXT,
  p_donation_id TEXT
)
RETURNS TABLE (
  id BIGINT,
  donation_public_id VARCHAR(50),
  order_reference VARCHAR(255),
  project_id BIGINT,
  donor_email VARCHAR(255),
  amount NUMERIC(10,2),
  currency VARCHAR(10),
  donation_status VARCHAR(20),  -- 返回状态字段
  donated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  project_name VARCHAR(255),
  project_name_i18n JSONB,
  location VARCHAR(255),
  location_i18n JSONB,
  unit_name VARCHAR(50),
  unit_name_i18n JSONB,
  aggregate_donations BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- 步骤 1: 验证 donation_id 属于该邮箱（防枚举攻击）
  IF NOT EXISTS (
    SELECT 1 FROM donations
    WHERE donation_public_id = p_donation_id
      AND LOWER(donor_email) = LOWER(p_email)
  ) THEN
    RETURN;  -- 验证失败返回空
  END IF;

  -- 步骤 2: 返回该邮箱的所有捐赠
  RETURN QUERY
  SELECT d.id, d.donation_public_id, d.order_reference, d.project_id,
         d.donor_email, d.amount, d.currency, d.donation_status,
         d.donated_at, d.updated_at, p.project_name, p.project_name_i18n,
         p.location, p.location_i18n, p.unit_name, p.unit_name_i18n,
         p.aggregate_donations
  FROM donations d
  INNER JOIN projects p ON d.project_id = p.id
  WHERE LOWER(d.donor_email) = LOWER(p_email)
  ORDER BY d.donated_at DESC;
END;
$$;
```

**安全特性**:
- `SECURITY DEFINER`: 使用函数所有者权限执行（绕过 RLS）
- 双重验证：必须同时知道邮箱和有效的捐赠 ID
- 防止邮箱枚举攻击

### 7.2 request_donation_refund()

**用途**: 用户申请退款
**迁移文件**: `20251221030000_secure_track_donation_functions.sql`

```sql
CREATE OR REPLACE FUNCTION request_donation_refund(
  p_donation_public_id TEXT,
  p_email TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_donation_id BIGINT;
  v_status VARCHAR(20);
BEGIN
  -- 步骤 1: 验证所有权并获取当前状态
  SELECT id, donation_status INTO v_donation_id, v_status
  FROM donations
  WHERE donation_public_id = p_donation_public_id
    AND LOWER(donor_email) = LOWER(p_email);

  IF v_donation_id IS NULL THEN
    RETURN json_build_object('error', 'donationNotFound');
  END IF;

  -- 步骤 2: 状态验证
  IF v_status = 'completed' THEN
    RETURN json_build_object('error', 'cannotRefundCompleted');
  END IF;

  IF v_status IN ('refunding', 'refunded') THEN
    RETURN json_build_object('error', 'alreadyRefunding');
  END IF;

  IF v_status IN ('pending', 'failed') THEN
    RETURN json_build_object('error', 'cannotRefundPending');
  END IF;

  -- 步骤 3: 更新状态为 refunding
  UPDATE donations SET donation_status = 'refunding' WHERE id = v_donation_id;

  RETURN json_build_object('success', true);
END;
$$;
```

**状态转换规则**:
- ✅ 可退款: `paid`, `confirmed`, `delivering`
- ❌ 不可退款: `completed`（已完成）, `refunding`/`refunded`（已在退款流程）, `pending`/`failed`（未成功支付）

---

## 8. 触发器

本节列出所有与捐赠状态相关的触发器及其绑定的函数。

### 8.1 触发器列表

| 触发器名称 | 绑定表 | 触发时机 | 函数 | 功能 |
|-----------|-------|---------|------|------|
| `update_project_units_trigger` | `donations` | AFTER INSERT/UPDATE/DELETE | `update_project_units()` | 自动更新项目单位数 |
| `prevent_donation_immutable_fields_trigger` | `donations` | BEFORE UPDATE | `prevent_donation_immutable_fields()` | 保护不可变字段 + 状态转换验证 |
| `donation_status_change_trigger` | `donations` | AFTER INSERT/UPDATE | `log_donation_status_change()` | 记录状态变更历史 |
| `update_donations_updated_at` | `donations` | BEFORE UPDATE | `update_updated_at_column()` | 自动更新 updated_at |
| `update_projects_updated_at` | `projects` | BEFORE UPDATE | `update_updated_at_column()` | 自动更新 updated_at |
| `prevent_project_immutable_fields_trigger` | `projects` | BEFORE UPDATE | `prevent_project_immutable_fields()` | 保护项目不可变字段 |

### 8.2 update_project_units()

**触发器名**: `update_project_units_trigger`
**迁移文件**: `20260106020000_fix_update_project_units_trigger.sql`

**功能**: 当捐赠状态变化时，自动更新项目的 `current_units` 字段。

```sql
CREATE OR REPLACE FUNCTION update_project_units()
RETURNS TRIGGER AS $$
DECLARE
    counted_statuses TEXT[] := ARRAY['paid', 'confirmed', 'delivering', 'completed'];
    non_counted_statuses TEXT[] := ARRAY[
        'pending', 'processing', 'fraud_check', 'widget_load_failed',
        'expired', 'declined', 'failed',
        'refunding', 'refund_processing', 'refunded'
    ];
BEGIN
    -- INSERT: 如果新状态是被计数状态，增加单位
    IF TG_OP = 'INSERT' THEN
        IF NEW.donation_status = ANY(counted_statuses) THEN
            UPDATE public.projects
            SET current_units = current_units + NEW.units
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
    END IF;

    -- UPDATE: 状态变化时调整单位
    IF TG_OP = 'UPDATE' THEN
        -- 从未计数变为被计数：增加
        IF (OLD.donation_status = ANY(non_counted_statuses) OR OLD.donation_status IS NULL)
           AND NEW.donation_status = ANY(counted_statuses) THEN
            UPDATE public.projects
            SET current_units = current_units + NEW.units
            WHERE id = NEW.project_id;
        -- 从被计数变为未计数：减少
        ELSIF OLD.donation_status = ANY(counted_statuses)
              AND NEW.donation_status = ANY(non_counted_statuses) THEN
            UPDATE public.projects
            SET current_units = GREATEST(0, current_units - OLD.units)
            WHERE id = NEW.project_id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器定义
CREATE TRIGGER update_project_units_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_units();
```

### 8.3 prevent_donation_immutable_fields()

**触发器名**: `prevent_donation_immutable_fields_trigger`
**迁移文件**: `20251224120000_restrict_admin_status_updates.sql`

**功能**: 保护捐赠记录的不可变字段，并限制管理员的状态转换权限。

```sql
CREATE OR REPLACE FUNCTION prevent_donation_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Service Role 可以修改任何字段（用于 Webhooks）
    IF current_setting('role') = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- 保护不可变字段
    IF OLD.id IS DISTINCT FROM NEW.id OR
       OLD.donation_public_id IS DISTINCT FROM NEW.donation_public_id OR
       OLD.project_id IS DISTINCT FROM NEW.project_id OR
       OLD.donor_name IS DISTINCT FROM NEW.donor_name OR
       OLD.donor_email IS DISTINCT FROM NEW.donor_email OR
       OLD.amount IS DISTINCT FROM NEW.amount OR
       OLD.order_reference IS DISTINCT FROM NEW.order_reference OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
        RAISE EXCEPTION 'Cannot modify immutable fields';
    END IF;

    -- 管理员状态转换验证
    IF OLD.donation_status IS DISTINCT FROM NEW.donation_status THEN
        IF NOT (
            (OLD.donation_status = 'paid' AND NEW.donation_status = 'confirmed') OR
            (OLD.donation_status = 'confirmed' AND NEW.donation_status = 'delivering') OR
            (OLD.donation_status = 'delivering' AND NEW.donation_status = 'completed')
        ) THEN
            RAISE EXCEPTION 'Invalid status transition: % -> %',
                OLD.donation_status, NEW.donation_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器定义
CREATE TRIGGER prevent_donation_immutable_fields_trigger
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_donation_immutable_fields();
```

### 8.4 log_donation_status_change()

**触发器名**: `donation_status_change_trigger`
**迁移文件**: `20260106010000_add_donation_status_history.sql`

**功能**: 自动记录所有状态变更历史。

```sql
CREATE OR REPLACE FUNCTION log_donation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: 记录初始状态
    IF TG_OP = 'INSERT' THEN
        INSERT INTO donation_status_history (donation_id, from_status, to_status)
        VALUES (NEW.id, NULL, NEW.donation_status);
    -- UPDATE: 状态变化时记录
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.donation_status IS DISTINCT FROM NEW.donation_status THEN
            INSERT INTO donation_status_history (donation_id, from_status, to_status)
            VALUES (NEW.id, OLD.donation_status, NEW.donation_status);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器定义
CREATE TRIGGER donation_status_change_trigger
    AFTER INSERT OR UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION log_donation_status_change();
```

### 8.5 update_updated_at_column()

**触发器名**: `update_donations_updated_at`
**迁移文件**: `20251219061700_reset_complete.sql`

**功能**: 自动更新 `updated_at` 时间戳。

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器定义
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 9. RLS 策略

### 9.1 管理员更新策略

```sql
-- 管理员可以更新捐赠（状态转换由触发器验证）
CREATE POLICY "Admins can update donations"
ON donations FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
```

### 9.2 匿名用户状态更新策略

```sql
-- 允许匿名用户将 pending 更新为 widget_load_failed
CREATE POLICY "Allow anonymous update pending to widget_load_failed"
ON public.donations
FOR UPDATE
TO anon, authenticated
USING (donation_status = 'pending')
WITH CHECK (donation_status = 'widget_load_failed');
```

### 9.3 状态历史查看策略

```sql
-- 仅管理员可查看状态历史
CREATE POLICY "Admins can view all status history"
ON donation_status_history
FOR SELECT
TO authenticated
USING (is_admin());
```

---

## 10. 状态历史审计

### 10.1 表结构

**表名**: `donation_status_history`

```sql
CREATE TABLE donation_status_history (
  id BIGSERIAL PRIMARY KEY,
  donation_id BIGINT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  from_status TEXT,           -- 旧状态（首次创建时为 NULL）
  to_status TEXT NOT NULL,    -- 新状态
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 10.2 索引

```sql
CREATE INDEX idx_donation_status_history_donation_id
    ON donation_status_history(donation_id);
CREATE INDEX idx_donation_status_history_changed_at
    ON donation_status_history(changed_at DESC);
CREATE INDEX idx_donation_status_history_to_status
    ON donation_status_history(to_status);
```

### 10.3 查询示例

```sql
-- 查询某笔捐赠的状态历史
SELECT from_status, to_status, changed_at
FROM donation_status_history
WHERE donation_id = 123
ORDER BY changed_at;

-- 查询今天所有退款状态变更
SELECT d.donation_public_id, h.from_status, h.to_status, h.changed_at
FROM donation_status_history h
JOIN donations d ON d.id = h.donation_id
WHERE h.to_status IN ('refunding', 'refund_processing', 'refunded')
  AND h.changed_at >= CURRENT_DATE;
```

---

## 11. 应用层代码

### 11.1 Server Actions

| Action | 文件 | 状态操作 |
|--------|------|---------|
| `createWayForPayDonation()` | `app/actions/donation.ts` | 创建 `pending` 状态记录 |
| `requestRefund()` | `app/actions/track-donation.ts` | 更新为 `refunding` |
| `updateDonationStatus()` | `app/actions/admin.ts` | 管理员状态转换 |
| `getAdminDonations()` | `app/actions/admin.ts` | 获取捐赠及状态历史 |

### 11.2 管理员状态转换验证

**文件**: `app/actions/admin.ts`

```typescript
const validTransitions: Record<string, string[]> = {
  paid: ['confirmed'],
  confirmed: ['delivering'],
  delivering: ['completed'],
}

// 验证转换
const allowedNextStatuses = validTransitions[currentStatus] || []
if (!allowedNextStatuses.includes(newStatus)) {
  return { error: `Cannot transition from ${currentStatus} to ${newStatus}` }
}
```

### 11.3 Webhook 处理

**文件**: `app/api/webhooks/wayforpay/route.ts`

```typescript
// 支付 Webhook 可更新的状态
const PAYMENT_WEBHOOK_ALLOWED_FROM = [
  'pending', 'processing', 'fraud_check', 'widget_load_failed'
]

// 退款 Webhook 可更新的状态
const REFUND_WEBHOOK_ALLOWED_FROM = [
  'paid', 'confirmed', 'delivering', 'refunding', 'refund_processing'
]

// 状态映射
function mapWayForPayStatus(transactionStatus: string): DonationStatus {
  switch (transactionStatus) {
    case 'Approved':
    case 'WaitingAuthComplete':
      return 'paid'
    case 'inProcessing':
      return 'processing'
    case 'Pending':
      return 'fraud_check'
    case 'Declined':
      return 'declined'
    case 'Expired':
      return 'expired'
    case 'RefundInProcessing':
      return 'refund_processing'
    case 'Refunded':
    case 'Voided':
      return 'refunded'
    default:
      return 'failed'
  }
}
```

---

## 12. UI 组件

### 12.1 状态徽章

**文件**: `components/donation/DonationStatusBadge.tsx`

| 状态 | 背景色 | 文字色 |
|------|--------|--------|
| `pending` | `bg-yellow-100` | `text-yellow-800` |
| `widget_load_failed` | `bg-gray-100` | `text-gray-700` |
| `processing` | `bg-blue-100` | `text-blue-800` |
| `fraud_check` | `bg-purple-100` | `text-purple-800` |
| `paid`, `confirmed`, `completed` | `bg-green-100` | `text-green-800` |
| `delivering` | `bg-blue-100` | `text-blue-700` |
| `expired` | `bg-gray-100` | `text-gray-600` |
| `declined`, `failed` | `bg-red-100` | `text-red-800` |
| `refunding`, `refund_processing` | `bg-orange-100` | `text-orange-800` |
| `refunded` | `bg-gray-100` | `text-gray-700` |

### 12.2 状态流程图组件

**文件**: `components/donation/DonationStatusFlow.tsx`

显示两条流程：
- **主流程**: `paid → confirmed → delivering → completed`
- **退款流程**: `refunding → refunded`

使用图标：
- `CheckCircle2Icon`: 已完成步骤
- `CircleIcon`: 当前/待处理步骤
- `ClockIcon`: 等待中步骤

### 12.3 管理员状态进度组件

**文件**: `components/admin/DonationStatusProgress.tsx`

```typescript
const NORMAL_FLOW_STATUSES = [
  { key: 'pending', label: 'Pending', color: 'gray' },
  { key: 'paid', label: 'Paid', color: 'yellow' },
  { key: 'confirmed', label: 'Confirmed', color: 'purple' },
  { key: 'delivering', label: 'Delivering', color: 'blue' },
  { key: 'completed', label: 'Completed', color: 'green' },
]

const REFUND_FLOW_STATUSES = [
  { key: 'refunding', label: 'Refunding', color: 'orange' },
  { key: 'refunded', label: 'Refunded', color: 'gray' },
]
```

---

## 13. 国际化

### 13.1 翻译键

**文件**: `messages/en.json`, `messages/zh.json`, `messages/ua.json`

```json
{
  "trackDonation": {
    "status": {
      "pending": "Payment Pending",
      "widget_load_failed": "Not Paid",
      "processing": "Processing Payment",
      "fraud_check": "Security Review",
      "paid": "Payment Received",
      "confirmed": "Confirmed",
      "delivering": "In Progress",
      "completed": "Completed",
      "expired": "Payment Expired",
      "declined": "Payment Declined",
      "failed": "Payment Failed",
      "refunding": "Refund In Progress",
      "refund_processing": "Refund In Progress",
      "refunded": "Refunded"
    }
  }
}
```

### 13.2 中文翻译

```json
{
  "trackDonation": {
    "status": {
      "pending": "等待支付",
      "widget_load_failed": "未支付",
      "processing": "支付处理中",
      "fraud_check": "安全审核中",
      "paid": "已收到款项",
      "confirmed": "已确认",
      "delivering": "配送中",
      "completed": "已完成",
      "expired": "支付已过期",
      "declined": "支付被拒绝",
      "failed": "支付失败",
      "refunding": "退款处理中",
      "refund_processing": "退款处理中",
      "refunded": "已退款"
    }
  }
}
```

---

## 14. 相关文件索引

### 14.1 核心文件

| 文件路径 | 作用 |
|---------|------|
| `types/index.ts` | 状态类型定义和常量 |
| `lib/payment/wayforpay/server.ts` | WayForPay 状态常量 |
| `app/api/webhooks/wayforpay/route.ts` | Webhook 处理和状态映射 |
| `app/actions/donation.ts` | 创建捐赠（pending 状态） |
| `app/actions/track-donation.ts` | 追踪捐赠和退款请求 |
| `app/actions/admin.ts` | 管理员状态更新 |

### 14.2 UI 组件

| 文件路径 | 作用 |
|---------|------|
| `components/donation/DonationStatusBadge.tsx` | 状态徽章 |
| `components/donation/DonationStatusFlow.tsx` | 状态流程图 |
| `components/admin/DonationStatusProgress.tsx` | 管理员进度指示器 |
| `components/admin/DonationsTable.tsx` | 捐赠表格（含状态筛选） |
| `components/admin/DonationEditModal.tsx` | 捐赠编辑弹窗 |

### 14.3 数据库迁移

| 迁移文件 | 主要内容 |
|---------|---------|
| `20251219061700_reset_complete.sql` | 初始模式定义、基础触发器和视图 |
| `20251219130000_fix_refunding_trigger.sql` | 退款状态触发器修复 |
| `20251220000000_add_failed_status.sql` | 添加 failed 状态 |
| `20251221030000_secure_track_donation_functions.sql` | 追踪和退款函数 |
| `20251224000000_add_donation_status_constraints.sql` | 完整 CHECK 约束 |
| `20251224120000_restrict_admin_status_updates.sql` | 管理员转换限制触发器 |
| `20251224160000_remove_user_cancelled_status.sql` | 移除 user_cancelled |
| `20251225000001_update_project_stats_view.sql` | 项目统计视图更新 |
| `20251225030000_add_order_id_to_public_donations.sql` | 公开捐赠视图 |
| `20260104020000_add_aggregate_to_track_function.sql` | 追踪函数增强 |
| `20260105020000_allow_all_statuses_in_order_view.sql` | 订单视图状态过滤移除 |
| `20260106010000_add_donation_status_history.sql` | 状态历史表和触发器 |
| `20260106020000_fix_update_project_units_trigger.sql` | 单位计数触发器完善 |

### 14.4 数据库视图

| 视图名 | 迁移文件 | 用途 |
|-------|---------|------|
| `order_donations_secure` | `20260105020000_*.sql` | 按订单查询捐赠 |
| `project_stats` | `20251225000001_*.sql` | 项目统计信息 |
| `public_project_donations` | `20251225030000_*.sql` | 项目公开捐赠列表 |
| `public_donation_feed` | `20251219061700_*.sql` | 公开捐赠动态 |

### 14.5 数据库函数

| 函数名 | 迁移文件 | 用途 |
|-------|---------|------|
| `get_donations_by_email_verified()` | `20260104020000_*.sql` | 验证邮箱后查询捐赠 |
| `request_donation_refund()` | `20251221030000_*.sql` | 用户申请退款 |
| `update_project_units()` | `20260106020000_*.sql` | 更新项目单位数 |
| `prevent_donation_immutable_fields()` | `20251224120000_*.sql` | 保护不可变字段 |
| `log_donation_status_change()` | `20260106010000_*.sql` | 记录状态变更 |
| `update_updated_at_column()` | `20251219061700_*.sql` | 更新时间戳 |

---

## 附录 A: 已移除的状态

| 状态 | 移除日期 | 原因 |
|------|---------|------|
| `user_cancelled` | 2025-12-24 | 客户端检测不可靠，无法准确判断用户主动取消 |

---

## 附录 B: 常见问题

### Q: 为什么 `refunding` 和 `refund_processing` 显示相同的翻译？

A: 对用户而言，这两个状态都表示"退款处理中"，区分仅在于内部流程追踪。WayForPay 的 `RefundInProcessing` 状态映射为 `refund_processing`，而用户主动申请退款时设置为 `refunding`。

### Q: 管理员能否跳过状态？

A: 不能。管理员只能按照 `paid → confirmed → delivering → completed` 的顺序逐步推进。这由数据库触发器强制执行。

### Q: Service Role 有什么特殊权限？

A: Service Role（用于 Webhooks）可以执行任意状态转换，不受管理员转换限制。这是因为支付网关回调需要根据实际支付结果设置状态。

---

**文档版本**: 1.1.0
**维护者**: NGO Platform Team
**最后更新**: 2026-01-09
