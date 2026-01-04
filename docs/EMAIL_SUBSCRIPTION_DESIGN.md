# 邮件订阅与群发功能设计文档

> 为 NGO 平台添加邮件订阅系统，支持用户订阅项目更新通知

**文档版本**: 1.0.0
**创建日期**: 2026-01-04
**状态**: 设计阶段

---

## 📋 目录

1. [需求概述](#需求概述)
2. [功能范围](#功能范围)
3. [数据库设计](#数据库设计)
4. [API 设计](#api-设计)
5. [前端集成](#前端集成)
6. [邮件模板设计](#邮件模板设计)
7. [安全策略](#安全策略)
8. [实施步骤](#实施步骤)
9. [测试计划](#测试计划)

---

## 需求概述

### 背景

NGO 平台需要一个邮件订阅系统，允许用户订阅项目更新通知。当有新项目发布时，系统会自动向所有订阅用户发送群发邮件。

### 核心需求

1. **用户订阅管理**
   - 用户在捐赠时可选择订阅项目更新
   - 记录用户的语言偏好
   - 支持取消订阅

2. **订阅数据存储**
   - 存储邮箱地址
   - 存储语言偏好（en/zh/ua）
   - 存储订阅状态（已订阅/已取消）
   - 记录订阅/取消时间

3. **邮件通知**
   - 新项目发布时群发通知
   - 根据用户语言发送对应版本
   - 包含取消订阅链接

4. **现有邮件不受影响**
   - 支付确认邮件（事务性）
   - 捐赠送达邮件（事务性）
   - 退款成功邮件（事务性）
   - 这些邮件强制发送，不受订阅状态影响

---

## 功能范围

### 包含的功能

✅ **数据库表**: `email_subscriptions` - 存储邮箱、语言、订阅状态
✅ **捐赠表单集成**: 订阅 checkbox（可选）
✅ **取消订阅页面**: `/[locale]/unsubscribed`
✅ **邮件模板系统**: 文件系统存储（`lib/email/templates/broadcast/`）
✅ **管理员页面**: `/admin/subscriptions` - 查看订阅者、多选、群发
✅ **群发邮件**: 手动选择订阅者 + 模板 → 发送
✅ **防重复订阅**: 数据库函数幂等操作
✅ **RLS 安全策略**: 管理员只读访问订阅列表

### 不包含的功能（可后续添加）

❌ **群发日志记录**: 不存储发送历史（简化设计）
❌ **模板数据库管理**: 模板存储在文件系统，不在数据库
❌ **自动群发**: 需要管理员手动触发
❌ **用户自助管理页面**: 用户只能通过邮件链接取消订阅
❌ **邮件发送统计**: 打开率、点击率追踪
❌ **订阅偏好细化**: 仅支持全局订阅，不支持按项目类型订阅

---

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户捐赠流程                              │
└─────────────────────────────────────────────────────────────────┘
  │
  ├─> 捐赠表单 (勾选订阅 checkbox)
  │     │
  │     └─> createEmailSubscription() → upsert_email_subscription()
  │           │
  │           └─> email_subscriptions 表 (新增/更新记录)
  │
  └─> 支付成功 → 确认邮件 (含 unsubscribe 链接)

┌─────────────────────────────────────────────────────────────────┐
│                      取消订阅流程                                │
└─────────────────────────────────────────────────────────────────┘
  │
  └─> 点击邮件 unsubscribe 链接
        │
        └─> GET /api/unsubscribe?email=xxx
              │
              ├─> unsubscribe_email() 数据库函数
              │     └─> 更新 is_subscribed = false
              │
              └─> 重定向到 /[locale]/unsubscribed 成功页

┌─────────────────────────────────────────────────────────────────┐
│                    管理员群发流程                                │
└─────────────────────────────────────────────────────────────────┘
  │
  ├─> /admin/subscriptions 页面
  │     │
  │     ├─> getSubscriptions() → 加载订阅列表
  │     │     └─> 显示所有订阅者（订阅/取消订阅）
  │     │
  │     ├─> 管理员操作：
  │     │     • 过滤（状态、语言）
  │     │     • 多选订阅者
  │     │     • 选择邮件模板（从文件系统）
  │     │
  │     └─> 点击"发送"
  │           │
  │           └─> sendEmailBroadcast(templateName, emails[])
  │                 │
  │                 ├─> getEmailTemplate(templateName)
  │                 │     └─> 加载 lib/email/templates/broadcast/{name}.ts
  │                 │
  │                 ├─> 查询收件人语言偏好
  │                 │     └─> SELECT email, locale WHERE email IN (...)
  │                 │
  │                 ├─> 按语言分组收件人
  │                 │
  │                 └─> sendBroadcastEmail()
  │                       └─> Resend API 群发
  │                             • en 用户 → subject.en + content.en
  │                             • zh 用户 → subject.zh + content.zh
  │                             • ua 用户 → subject.ua + content.ua
  │
  └─> 发送成功 → 显示结果 (成功数/失败数)

┌─────────────────────────────────────────────────────────────────┐
│                      数据库架构                                  │
└─────────────────────────────────────────────────────────────────┘

email_subscriptions 表:
  • id (PK)
  • email (UNIQUE)
  • locale (en/zh/ua)
  • is_subscribed (BOOLEAN)
  • updated_at

触发器:
  • update_email_subscription_updated_at() - 自动更新时间戳

函数:
  • upsert_email_subscription(email, locale) - 幂等订阅
  • unsubscribe_email(email) - 取消订阅

RLS 策略:
  • 管理员可查看所有订阅（只读）
  • 服务角色可创建/更新订阅
  • 公开 API 可调用取消订阅函数

┌─────────────────────────────────────────────────────────────────┐
│                    邮件模板系统                                  │
└─────────────────────────────────────────────────────────────────┘

lib/email/templates/
  ├── transactional/              # 事务性邮件（原有的3个）
  │   ├── payment-success/        # 支付成功确认
  │   ├── donation-completed/     # 捐赠送达通知
  │   └── refund-success/         # 退款成功确认
  │
  ├── broadcast/                  # 群发邮件模板定义
  │   └── new-project.ts          # 模板定义文件
  │
  ├── content/                    # 群发邮件 HTML 内容
  │   ├── new-project.en.html     # 英文内容
  │   ├── new-project.zh.html     # 中文内容
  │   └── new-project.ua.html     # 乌克兰语内容
  │
  ├── base/                       # 共享组件（原有）
  ├── index.ts                    # 模板加载器
  └── README.md                   # 模板系统文档

模板定义文件 (broadcast/*.ts):
  {
    name: "New Project Announcement",
    fileName: "new-project",
    subject: { en: "...", zh: "...", ua: "..." },
    contentFile: "new-project"    # 指向 content/ 目录的文件
  }

HTML 内容文件 (content/*.{locale}.html):
  • 完整的 HTML 邮件（含内联样式）
  • 支持变量替换：{{donate_url}}, {{unsubscribe_url}}
  • 每个模板3个语言版本
```

---

## 数据库设计

### 1. 新建表：`email_subscriptions`

**表说明**: 存储用户邮件订阅信息

```sql
CREATE TABLE email_subscriptions (
  -- 主键
  id BIGSERIAL PRIMARY KEY,

  -- 邮箱地址（唯一索引）
  email TEXT NOT NULL UNIQUE,

  -- 语言偏好（en/zh/ua）
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh', 'ua')),

  -- 订阅状态
  is_subscribed BOOLEAN NOT NULL DEFAULT true,

  -- 时间戳
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX idx_email_subscriptions_is_subscribed ON email_subscriptions(is_subscribed) WHERE is_subscribed = true;
CREATE INDEX idx_email_subscriptions_locale ON email_subscriptions(locale);

-- 注释
COMMENT ON TABLE email_subscriptions IS '邮件订阅管理表';
COMMENT ON COLUMN email_subscriptions.email IS '订阅者邮箱地址';
COMMENT ON COLUMN email_subscriptions.locale IS '用户语言偏好（en/zh/ua）';
COMMENT ON COLUMN email_subscriptions.is_subscribed IS '订阅状态（true=已订阅，false=已取消）';
COMMENT ON COLUMN email_subscriptions.updated_at IS '最后更新时间';
```

**字段说明**:

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| `id` | BIGSERIAL | 主键 | PRIMARY KEY |
| `email` | TEXT | 邮箱地址 | NOT NULL, UNIQUE |
| `locale` | TEXT | 语言偏好 | NOT NULL, CHECK |
| `is_subscribed` | BOOLEAN | 订阅状态 | NOT NULL, DEFAULT true |
| `updated_at` | TIMESTAMPTZ | 最后更新时间 | NOT NULL, DEFAULT NOW() |

---

### 2. 触发器：自动更新时间戳

**功能**: 自动更新 `updated_at` 字段

```sql
-- 触发器函数：更新 updated_at
CREATE OR REPLACE FUNCTION update_email_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER update_email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_email_subscription_updated_at();
```

---

### 3. 数据库函数：订阅/更新订阅

**功能**: 幂等函数，处理新订阅和更新订阅

```sql
-- 函数：订阅或更新订阅信息
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

COMMENT ON FUNCTION upsert_email_subscription IS '订阅或更新订阅信息（幂等操作）';
```

**使用示例**:

```sql
-- 新订阅
SELECT upsert_email_subscription('user@example.com', 'en');

-- 更新语言偏好（如果已存在）
SELECT upsert_email_subscription('user@example.com', 'zh');
```

---

### 4. 数据库函数：取消订阅

**功能**: 通过邮箱取消订阅

```sql
-- 函数：取消订阅
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

COMMENT ON FUNCTION unsubscribe_email IS '通过邮箱取消订阅';
```

**使用示例**:

```sql
-- 取消订阅
SELECT unsubscribe_email('user@example.com');
-- 返回: true（成功）或 false（邮箱不存在或已取消）
```

---

---

### 5. RLS 安全策略

**设计原则**:
- ✅ 匿名用户可以订阅（通过 Server Action）
- ✅ 匿名用户可以取消订阅（通过公开链接）
- ❌ 匿名用户不能查看订阅列表
- ✅ 管理员可以查看所有订阅（只读）
- ❌ 管理员不能直接修改订阅（通过函数管理）

```sql
-- 启用 RLS
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- 策略 1: 允许通过 Server Action 插入（service role）
-- 注意：直接插入由 Server Action 使用 service role 处理，不需要公开策略

-- 策略 2: 允许匿名用户通过邮箱取消订阅（通过函数）
-- 注意：unsubscribe_email() 函数使用 SECURITY DEFINER，不需要额外策略

-- 策略 3: 管理员可以查看所有订阅
CREATE POLICY "Admins can view all subscriptions"
  ON email_subscriptions
  FOR SELECT
  TO authenticated
  USING (is_admin());
```

**安全说明**:

| 操作 | 角色 | 策略 |
|------|------|------|
| 插入订阅 | Service Role | 通过 Server Action（`upsert_email_subscription`） |
| 取消订阅 | 公开访问 | 通过公开 API（调用 `unsubscribe_email`） |
| 查看订阅列表 | 仅管理员 | RLS 策略限制（只读） |
| 更新/删除订阅 | ❌ 禁止 | 管理员不需要此功能 |

---

### 6. 字段保护触发器（可选）

**功能**: 防止修改不可变字段

```sql
-- 触发器函数：保护不可变字段
CREATE OR REPLACE FUNCTION prevent_subscription_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 保护字段：id
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify immutable field: id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER prevent_subscription_immutable_fields_trigger
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_subscription_immutable_fields();
```

---

## API 设计

### 1. Server Action: 创建订阅

**文件**: `app/actions/subscription.ts`

```typescript
'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 验证 schema
const subscriptionSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.enum(['en', 'zh', 'ua']),
})

/**
 * 创建或更新邮件订阅
 * @param email - 邮箱地址
 * @param locale - 语言偏好
 * @returns 订阅 ID 或错误
 */
export async function createEmailSubscription(
  email: string,
  locale: 'en' | 'zh' | 'ua'
) {
  try {
    // 验证输入
    const validated = subscriptionSchema.parse({ email, locale })

    // 使用 service role 客户端（绕过 RLS）
    const supabase = createServiceClient()

    // 调用数据库函数
    const { data, error } = await supabase.rpc('upsert_email_subscription', {
      p_email: validated.email,
      p_locale: validated.locale,
    })

    if (error) {
      console.error('Failed to create subscription:', error)
      return { success: false, error: 'Failed to subscribe' }
    }

    return { success: true, subscriptionId: data as number }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message }
    }
    console.error('Unexpected error:', err)
    return { success: false, error: 'Internal server error' }
  }
}
```

---

### 2. API Route: 取消订阅

**文件**: `app/api/unsubscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  email: z.string().email(),
})

/**
 * POST /api/unsubscribe
 * 取消邮件订阅
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = unsubscribeSchema.parse(body)

    const supabase = createServiceClient()

    // 调用取消订阅函数
    const { data, error } = await supabase.rpc('unsubscribe_email', {
      p_email: email,
    })

    if (error) {
      console.error('Failed to unsubscribe:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, unsubscribed: data })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/unsubscribe?email=xxx
 * 取消订阅（通过 URL 参数）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      )
    }

    const { email: validatedEmail } = unsubscribeSchema.parse({ email })

    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('unsubscribe_email', {
      p_email: validatedEmail,
    })

    if (error) {
      console.error('Failed to unsubscribe:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    // 重定向到取消订阅成功页面
    const locale = searchParams.get('locale') || 'en'
    return NextResponse.redirect(
      new URL(`/${locale}/unsubscribed`, request.url)
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### 3. Server Action: 获取订阅列表（管理员）

**文件**: `app/actions/subscription.ts`（新增）

```typescript
'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'

/**
 * 获取所有订阅记录（管理员）
 */
export async function getSubscriptions(filter?: {
  is_subscribed?: boolean
  locale?: 'en' | 'zh' | 'ua'
}) {
  try {
    await requireAdmin()

    const supabase = createServiceClient()

    let query = supabase
      .from('email_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (filter?.is_subscribed !== undefined) {
      query = query.eq('is_subscribed', filter.is_subscribed)
    }

    if (filter?.locale) {
      query = query.eq('locale', filter.locale)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('Failed to fetch subscriptions:', error)
      return { success: false, error: 'Failed to fetch subscriptions' }
    }

    return { success: true, subscriptions }
  } catch (err) {
    console.error('Error:', err)
    return { success: false, error: 'Internal error' }
  }
}
```

---

### 4. Server Action: 群发邮件（管理员）

**文件**: `app/actions/email-broadcast.ts`

```typescript
'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { sendBroadcastEmail } from '@/lib/email/broadcast'
import { getEmailTemplate } from '@/lib/email/templates'
import { z } from 'zod'

const broadcastSchema = z.object({
  templateName: z.string().min(1),
  recipientEmails: z.array(z.string().email()).min(1),
})

interface Recipient {
  email: string
  locale: 'en' | 'zh' | 'ua'
}

/**
 * 群发邮件给选定的订阅者
 * @param templateName - 模板文件名（不含扩展名）
 * @param recipientEmails - 选中的邮箱列表
 * @returns 发送结果
 */
export async function sendEmailBroadcast(
  templateName: string,
  recipientEmails: string[]
) {
  try {
    // 验证管理员权限
    await requireAdmin()

    // 验证输入
    const { templateName: validatedTemplateName, recipientEmails: validatedEmails } =
      broadcastSchema.parse({ templateName, recipientEmails })

    const supabase = createServiceClient()

    // 加载邮件模板（从文件系统）
    const template = getEmailTemplate(validatedTemplateName)
    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    // 获取收件人信息（包含语言偏好）
    const { data: recipients, error: recipientsError } = await supabase
      .from('email_subscriptions')
      .select('email, locale')
      .in('email', validatedEmails)
      .eq('is_subscribed', true)

    if (recipientsError || !recipients || recipients.length === 0) {
      return { success: false, error: 'No valid recipients found' }
    }

    // 按语言分组收件人
    const recipientsByLocale = recipients.reduce((acc, recipient) => {
      if (!acc[recipient.locale]) acc[recipient.locale] = []
      acc[recipient.locale].push(recipient.email)
      return acc
    }, {} as Record<string, string[]>)

    let successCount = 0
    let failureCount = 0

    // 群发邮件
    const results = await Promise.allSettled(
      Object.entries(recipientsByLocale).map(([locale, emails]) =>
        sendBroadcastEmail({
          template,
          locale: locale as 'en' | 'zh' | 'ua',
          recipients: emails,
        })
      )
    )

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        successCount += result.value.successCount || 0
        failureCount += result.value.failureCount || 0
      } else {
        failureCount += recipients.length
      }
    })

    return {
      success: true,
      totalRecipients: recipients.length,
      successCount,
      failureCount,
      message: `Sent to ${successCount}/${recipients.length} recipients`,
    }
  } catch (err) {
    console.error('Broadcast error:', err)
    return { success: false, error: 'Failed to send broadcast' }
  }
}
```

---

### 5. 邮件模板加载函数

**文件**: `lib/email/templates/index.ts`

```typescript
import fs from 'fs'
import path from 'path'

export interface EmailTemplate {
  name: string // 模板名称（用于显示）
  fileName: string // 文件名（不含扩展名）
  subject: {
    en: string
    zh: string
    ua: string
  }
  content: {
    en: string
    zh: string
    ua: string
  }
}

/**
 * 获取所有可用的邮件模板
 */
export function getAvailableTemplates(): { name: string; fileName: string }[] {
  const templatesDir = path.join(process.cwd(), 'lib/email/templates/broadcast')

  try {
    const files = fs.readdirSync(templatesDir)
    const templates = files
      .filter((file) => file.endsWith('.ts') && !file.startsWith('index'))
      .map((file) => {
        const fileName = file.replace('.ts', '')
        // 将文件名转换为显示名称（如 new-project -> New Project）
        const name = fileName
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        return { name, fileName }
      })

    return templates
  } catch (err) {
    console.error('Failed to read templates directory:', err)
    return []
  }
}

/**
 * 加载指定的邮件模板
 */
export function getEmailTemplate(fileName: string): EmailTemplate | null {
  try {
    // 动态导入模板文件
    const template = require(`./broadcast/${fileName}`).default
    return template
  } catch (err) {
    console.error(`Failed to load template: ${fileName}`, err)
    return null
  }
}
```

**邮件模板定义示例**: `lib/email/templates/broadcast/new-project.ts`

```typescript
import { EmailTemplate } from '../index'

/**
 * 新项目通知邮件模板
 * 用于向订阅者群发新项目上线通知
 */
const template: EmailTemplate = {
  name: 'New Project Announcement',
  fileName: 'new-project',
  subject: {
    en: 'New Project Available - Help Make a Difference',
    zh: '新项目上线 - 帮助改变世界',
    ua: 'Новий проект доступний - Допоможіть змінити світ',
  },
  // 内容文件存储在 lib/email/templates/content/ 目录
  // 实际文件: new-project.en.html, new-project.zh.html, new-project.ua.html
  contentFile: 'new-project',
}

export default template
```

**HTML 内容示例**: `lib/email/templates/content/new-project.en.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f6f9fc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px 30px;
    }
    .cta-button {
      background-color: #3b82f6;
      color: #ffffff;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>We Have a New Project!</h1>
    <p>Dear Supporter,</p>
    <p>We are excited to announce a new project that needs your support...</p>
    <a href="{{donate_url}}" class="cta-button">View Project & Donate</a>
    <hr>
    <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
  </div>
</body>
</html>
```

**注意**: 中文版（new-project.zh.html）和乌克兰语版（new-project.ua.html）结构相同，只是文本内容翻译不同。

---

## 前端集成

### 1. 管理员页面：邮件订阅管理

**路径**: `/admin/subscriptions`

**页面**: `app/admin/subscriptions/page.tsx`

```typescript
import { Suspense } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import SubscriptionsTable from '@/components/admin/SubscriptionsTable'

export const metadata = {
  title: 'Email Subscriptions - Admin',
}

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Email Subscriptions
          </h1>
          <p className="text-gray-600 mt-2">
            Manage email subscribers and send broadcast emails
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SubscriptionsTable />
        </Suspense>
      </main>
    </div>
  )
}
```

---

### 2. 管理员组件：订阅列表和群发

**组件**: `components/admin/SubscriptionsTable.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getSubscriptions } from '@/app/actions/subscription'
import { sendEmailBroadcast } from '@/app/actions/email-broadcast'
import { getAvailableTemplates } from '@/lib/email/templates'

interface Subscription {
  id: number
  email: string
  locale: 'en' | 'zh' | 'ua'
  is_subscribed: boolean
  updated_at: string
}

export default function SubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templates, setTemplates] = useState<{ name: string; fileName: string }[]>([])
  const [filter, setFilter] = useState<{
    is_subscribed?: boolean
    locale?: 'en' | 'zh' | 'ua'
  }>({})
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // 加载订阅列表
  useEffect(() => {
    loadSubscriptions()
  }, [filter])

  // 加载模板列表
  useEffect(() => {
    const loadTemplates = async () => {
      const availableTemplates = getAvailableTemplates()
      setTemplates(availableTemplates)
      if (availableTemplates.length > 0) {
        setSelectedTemplate(availableTemplates[0].fileName)
      }
    }
    loadTemplates()
  }, [])

  const loadSubscriptions = async () => {
    setLoading(true)
    const result = await getSubscriptions(filter)
    if (result.success && result.subscriptions) {
      setSubscriptions(result.subscriptions)
    }
    setLoading(false)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedEmails.length === activeSubscriptions.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(activeSubscriptions.map((sub) => sub.email))
    }
  }

  // 单个选择/取消选择
  const toggleSelect = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter((e) => e !== email))
    } else {
      setSelectedEmails([...selectedEmails, email])
    }
  }

  // 群发邮件
  const handleSendBroadcast = async () => {
    if (selectedEmails.length === 0) {
      alert('Please select at least one recipient')
      return
    }

    if (!selectedTemplate) {
      alert('Please select an email template')
      return
    }

    const confirmed = confirm(
      `Send email to ${selectedEmails.length} recipients using "${templates.find((t) => t.fileName === selectedTemplate)?.name}" template?`
    )

    if (!confirmed) return

    setSending(true)
    const result = await sendEmailBroadcast(selectedTemplate, selectedEmails)

    if (result.success) {
      alert(result.message)
      setSelectedEmails([])
    } else {
      alert(`Error: ${result.error}`)
    }

    setSending(false)
  }

  const activeSubscriptions = subscriptions.filter((sub) => sub.is_subscribed)

  return (
    <div className="space-y-6">
      {/* 过滤器和操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 订阅状态过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filter.is_subscribed === undefined ? 'all' : filter.is_subscribed ? 'subscribed' : 'unsubscribed'}
              onChange={(e) => {
                const value = e.target.value
                setFilter({
                  ...filter,
                  is_subscribed: value === 'all' ? undefined : value === 'subscribed',
                })
              }}
            >
              <option value="all">All</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>

          {/* 语言过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filter.locale || 'all'}
              onChange={(e) => {
                const value = e.target.value
                setFilter({
                  ...filter,
                  locale: value === 'all' ? undefined : (value as 'en' | 'zh' | 'ua'),
                })
              }}
            >
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="zh">Chinese</option>
              <option value="ua">Ukrainian</option>
            </select>
          </div>

          {/* 模板选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Template
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {templates.map((template) => (
                <option key={template.fileName} value={template.fileName}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* 发送按钮 */}
          <div className="flex items-end">
            <button
              onClick={handleSendBroadcast}
              disabled={selectedEmails.length === 0 || sending}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : `Send to ${selectedEmails.length} selected`}
            </button>
          </div>
        </div>
      </div>

      {/* 订阅列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEmails.length === activeSubscriptions.length && activeSubscriptions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className={!sub.is_subscribed ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4">
                      {sub.is_subscribed && (
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(sub.email)}
                          onChange={() => toggleSelect(sub.email)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sub.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {sub.locale.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sub.is_subscribed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sub.is_subscribed ? 'Subscribed' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sub.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Subscribers</p>
            <p className="text-2xl font-bold text-gray-900">
              {subscriptions.filter((s) => s.is_subscribed).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unsubscribed</p>
            <p className="text-2xl font-bold text-gray-900">
              {subscriptions.filter((s) => !s.is_subscribed).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-2xl font-bold text-blue-600">
              {selectedEmails.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 3. 捐赠表单集成

**文件**: `components/donate/DonationFormCard.tsx`

在捐赠表单中添加订阅复选框：

```typescript
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createEmailSubscription } from '@/app/actions/subscription'

export default function DonationFormCard({ locale }: { locale: string }) {
  const t = useTranslations('donate')
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(false)

  // ... 现有的表单状态

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ... 现有的捐赠逻辑

    // 处理订阅（异步，不阻塞支付流程）
    if (subscribeToUpdates && donorEmail) {
      createEmailSubscription(donorEmail, locale as 'en' | 'zh' | 'ua')
        .then((result) => {
          if (!result.success) {
            console.error('Subscription failed:', result.error)
          }
        })
        .catch((err) => {
          console.error('Subscription error:', err)
        })
    }

    // ... 继续支付流程
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... 现有的表单字段 */}

      {/* 订阅复选框 */}
      <div className="mt-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={subscribeToUpdates}
            onChange={(e) => setSubscribeToUpdates(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {t('subscribeToUpdates')}
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          {t('subscribeDescription')}
        </p>
      </div>

      {/* ... 提交按钮 */}
    </form>
  )
}
```

**翻译文件更新** (`messages/en.json`):

```json
{
  "donate": {
    "subscribeToUpdates": "Keep me updated about new projects",
    "subscribeDescription": "Receive email notifications when we launch new projects (you can unsubscribe anytime)"
  }
}
```

---

### 2. 取消订阅页面

**文件**: `app/[locale]/unsubscribed/page.tsx`

```typescript
import { useTranslations } from 'next-intl'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function UnsubscribedPage() {
  const t = useTranslations('unsubscribe')

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>

          <p className="text-gray-600 mb-8">
            {t('message')}
          </p>

          <p className="text-sm text-gray-500">
            {t('resubscribeHint')}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
```

**翻译文件** (`messages/en.json`):

```json
{
  "unsubscribe": {
    "title": "You've been unsubscribed",
    "message": "You will no longer receive project update emails from us.",
    "resubscribeHint": "You can subscribe again anytime by making a donation and checking the subscription option."
  }
}
```

**中文** (`messages/zh.json`):

```json
{
  "unsubscribe": {
    "title": "已取消订阅",
    "message": "您将不再收到我们的项目更新邮件。",
    "resubscribeHint": "您可以随时通过捐赠时勾选订阅选项来重新订阅。"
  }
}
```

**乌克兰语** (`messages/ua.json`):

```json
{
  "unsubscribe": {
    "title": "Ви відписалися",
    "message": "Ви більше не отримуватимете електронні листи про оновлення проектів від нас.",
    "resubscribeHint": "Ви можете підписатися знову в будь-який час, зробивши пожертву та вибравши опцію підписки."
  }
}
```

---

## 邮件模板设计

### 1. 新项目通知邮件模板

**文件**: `lib/email/templates/project-announcement.tsx`

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components'

interface ProjectAnnouncementEmailProps {
  projectName: string
  projectDescription: string
  projectLocation: string
  targetAmount: string
  projectUrl: string
  unsubscribeUrl: string
  locale: 'en' | 'zh' | 'ua'
}

const translations = {
  en: {
    title: 'New Project Available',
    intro: 'We have launched a new project that needs your support!',
    projectDetails: 'Project Details',
    location: 'Location',
    goal: 'Goal',
    donateNow: 'Donate Now',
    footer: 'You are receiving this email because you subscribed to project updates.',
    unsubscribe: 'Unsubscribe',
  },
  zh: {
    title: '新项目上线',
    intro: '我们推出了一个需要您支持的新项目！',
    projectDetails: '项目详情',
    location: '地点',
    goal: '目标',
    donateNow: '立即捐赠',
    footer: '您收到此邮件是因为您订阅了项目更新。',
    unsubscribe: '取消订阅',
  },
  ua: {
    title: 'Новий проект доступний',
    intro: 'Ми запустили новий проект, який потребує вашої підтримки!',
    projectDetails: 'Деталі проекту',
    location: 'Місцезнаходження',
    goal: 'Мета',
    donateNow: 'Пожертвувати зараз',
    footer: 'Ви отримуєте цей лист, тому що підписалися на оновлення проектів.',
    unsubscribe: 'Відписатися',
  },
}

export default function ProjectAnnouncementEmail({
  projectName,
  projectDescription,
  projectLocation,
  targetAmount,
  projectUrl,
  unsubscribeUrl,
  locale,
}: ProjectAnnouncementEmailProps) {
  const t = translations[locale]

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t.title}</Heading>

          <Text style={text}>{t.intro}</Text>

          <Section style={projectSection}>
            <Heading as="h2" style={h2}>
              {projectName}
            </Heading>

            <Text style={text}>{projectDescription}</Text>

            <Hr style={hr} />

            <Text style={label}>{t.location}:</Text>
            <Text style={value}>{projectLocation}</Text>

            <Text style={label}>{t.goal}:</Text>
            <Text style={value}>{targetAmount}</Text>
          </Section>

          <Button href={projectUrl} style={button}>
            {t.donateNow}
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            {t.footer}
          </Text>

          <Link href={unsubscribeUrl} style={unsubscribeLink}>
            {t.unsubscribe}
          </Link>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
}

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const projectSection = {
  padding: '24px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '32px 0',
}

const label = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0 4px',
}

const value = {
  color: '#1f2937',
  fontSize: '16px',
  margin: '0 0 16px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  margin: '32px 0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '32px 0 8px',
}

const unsubscribeLink = {
  color: '#3b82f6',
  fontSize: '12px',
  textAlign: 'center' as const,
  display: 'block',
}
```

---

### 2. 邮件发送函数

**文件**: `lib/email/project-announcement.ts`

```typescript
import { Resend } from 'resend'
import ProjectAnnouncementEmail from './templates/project-announcement'
import { getTranslatedText } from '@/lib/i18n-utils'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ProjectAnnouncementParams {
  project: {
    id: number
    project_name_i18n: Record<string, string>
    description_i18n: Record<string, string>
    location_i18n: Record<string, string>
    target_units: number
    unit_price?: number
    aggregate_donations: boolean
  }
  locale: 'en' | 'zh' | 'ua'
  recipients: string[]
}

export async function sendProjectAnnouncementEmail({
  project,
  locale,
  recipients,
}: ProjectAnnouncementParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // 构建项目 URL
  const projectUrl = `${appUrl}/${locale}/donate?project=${project.id}`

  // 获取多语言文本
  const projectName = getTranslatedText(project.project_name_i18n, locale, '')
  const projectDescription = getTranslatedText(project.description_i18n, locale, '')
  const projectLocation = getTranslatedText(project.location_i18n, locale, '')

  // 计算目标金额
  const targetAmount = project.aggregate_donations
    ? `$${project.target_units}`
    : `${project.target_units} units × $${project.unit_price || 0}`

  // 批量发送邮件（每批最多 50 个收件人）
  const batches = []
  for (let i = 0; i < recipients.length; i += 50) {
    batches.push(recipients.slice(i, i + 50))
  }

  const results = await Promise.allSettled(
    batches.map((batch) =>
      Promise.all(
        batch.map((email) => {
          const unsubscribeUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&locale=${locale}`

          return resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: email,
            subject: getSubject(locale, projectName),
            react: ProjectAnnouncementEmail({
              projectName,
              projectDescription,
              projectLocation,
              targetAmount,
              projectUrl,
              unsubscribeUrl,
              locale,
            }),
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
            },
          })
        })
      )
    )
  )

  return results
}

function getSubject(locale: 'en' | 'zh' | 'ua', projectName: string): string {
  const subjects = {
    en: `New Project: ${projectName}`,
    zh: `新项目：${projectName}`,
    ua: `Новий проект: ${projectName}`,
  }
  return subjects[locale]
}
```

---

## 安全策略

### 1. 数据保护

| 措施 | 说明 |
|------|------|
| RLS 策略 | 防止未授权访问订阅列表 |
| 邮箱验证 | 基础的邮箱格式验证 |
| HTTPS 传输 | 所有 API 使用 HTTPS |
| 函数权限 | 使用 `SECURITY DEFINER` 控制权限 |

### 2. 防滥用措施

| 措施 | 说明 |
|------|------|
| 幂等设计 | 重复订阅不会创建重复记录 |
| 唯一约束 | 邮箱唯一索引防止重复 |
| 速率限制（待实现） | API 路由需要添加速率限制 |
| Honeypot 字段（可选） | 防止机器人订阅 |

### 3. 隐私合规

| 措施 | 说明 |
|------|------|
| 明确的订阅意图 | 用户主动勾选复选框 |
| 一键取消订阅 | 邮件底部包含取消订阅链接 |
| List-Unsubscribe 头 | 符合 RFC 2369 标准 |
| 数据最小化 | 仅存储必要信息 |

### 4. 邮件发送最佳实践

| 措施 | 说明 |
|------|------|
| SPF/DKIM/DMARC | 邮件域名认证（Resend 自动处理） |
| 批量发送限制 | 每批最多 50 个收件人 |
| 错误处理 | Promise.allSettled 确保部分失败不影响全局 |
| 发送频率限制（待实现） | 避免频繁群发被标记为垃圾邮件 |

---

## 实施步骤

### 阶段 1: 数据库迁移（20 分钟）

**步骤**:

1. ✅ 创建迁移文件
   ```bash
   # 在 supabase/migrations/ 目录创建新文件
   # 文件名: YYYYMMDDHHMMSS_email_subscriptions.sql
   ```

2. ✅ 编写迁移 SQL
   - 创建表 `email_subscriptions`
   - 创建索引
   - 创建触发器函数（updated_at 自动更新）
   - 创建触发器
   - 创建 RLS 策略
   - 创建业务函数（upsert_email_subscription, unsubscribe_email）

3. ✅ 推送迁移
   ```bash
   npx supabase db push
   ```

4. ✅ 验证迁移
   ```sql
   -- 测试订阅
   SELECT upsert_email_subscription('test@example.com', 'en');

   -- 测试取消订阅
   SELECT unsubscribe_email('test@example.com');

   -- 查看订阅列表
   SELECT * FROM email_subscriptions;
   ```

---

### 阶段 2: 邮件模板开发（30 分钟）

**步骤**:

1. ✅ 创建模板目录结构
   ```bash
   mkdir -p lib/email/templates/broadcast
   ```

2. ✅ 创建模板加载函数: `lib/email/templates/index.ts`
   - `getAvailableTemplates()` - 列出所有模板
   - `getEmailTemplate()` - 加载指定模板

3. ✅ 创建示例模板: `lib/email/templates/broadcast/new-project.ts`
   - 多语言主题（subject_i18n）
   - 多语言内容（content_i18n）

4. ✅ 创建邮件发送函数: `lib/email/broadcast.ts`
   - `sendBroadcastEmail()` - 群发邮件实现

---

### 阶段 3: API 开发（40 分钟）

**步骤**:

1. ✅ 创建订阅 Server Action: `app/actions/subscription.ts`
   - `createEmailSubscription()` - 创建订阅
   - `getSubscriptions()` - 管理员查询订阅列表

2. ✅ 创建 API Route: `app/api/unsubscribe/route.ts`
   - POST 方法（JSON）
   - GET 方法（URL 参数 + 重定向）

3. ✅ 创建群发 Server Action: `app/actions/email-broadcast.ts`
   - `sendEmailBroadcast()` - 群发邮件

---

### 阶段 4: 前端集成（1.5 小时）

**步骤**:

1. ✅ 更新捐赠表单: `components/donate/DonationFormCard.tsx`
   - 添加订阅复选框
   - 集成 `createEmailSubscription()` Server Action
   - 异步调用（不阻塞支付）

2. ✅ 创建取消订阅页面: `app/[locale]/unsubscribed/page.tsx`

3. ✅ 创建管理员页面: `app/admin/subscriptions/page.tsx`

4. ✅ 创建订阅管理组件: `components/admin/SubscriptionsTable.tsx`
   - 订阅列表展示
   - 多选功能
   - 过滤器（状态、语言）
   - 模板选择器
   - 群发按钮

5. ✅ 更新翻译文件
   - `messages/en.json`
   - `messages/zh.json`
   - `messages/ua.json`

---

### 阶段 5: 测试与验证（1 小时）

**测试清单**:

| 测试项 | 说明 |
|--------|------|
| ✅ 数据库函数测试 | 测试 upsert_email_subscription 和 unsubscribe_email |
| ✅ 订阅流程测试 | 捐赠表单勾选订阅 → 数据库记录创建 |
| ✅ 取消订阅测试 | 点击邮件 unsubscribe 链接 → 重定向到成功页 |
| ✅ 重复订阅测试（幂等性） | 同一邮箱多次订阅 → 语言偏好更新 |
| ✅ 邮件模板加载测试 | getAvailableTemplates 返回所有模板 |
| ✅ 群发邮件测试（小范围） | 选择 2-3 个订阅者 → 验证多语言发送 |
| ✅ 管理员页面测试 | 订阅列表展示、过滤器、多选、群发 |
| ✅ 多语言测试 | en/zh/ua 邮件内容正确 |
| ✅ 移动端 UI 测试 | 响应式布局、checkbox 易用性 |
| ✅ 安全测试（RLS） | 非管理员无法查看订阅列表 |

---

## 测试计划

### 单元测试

```typescript
// __tests__/subscription.test.ts

describe('Email Subscription', () => {
  test('should create new subscription', async () => {
    const result = await createEmailSubscription('new@example.com', 'en')
    expect(result.success).toBe(true)
  })

  test('should update existing subscription', async () => {
    await createEmailSubscription('existing@example.com', 'en')
    const result = await createEmailSubscription('existing@example.com', 'zh')
    expect(result.success).toBe(true)
    // 验证语言已更新为 zh
  })

  test('should reject invalid email', async () => {
    const result = await createEmailSubscription('invalid-email', 'en')
    expect(result.success).toBe(false)
  })
})
```

### 集成测试

```typescript
// __tests__/unsubscribe.test.ts

describe('Unsubscribe API', () => {
  test('POST /api/unsubscribe', async () => {
    const response = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  test('GET /api/unsubscribe', async () => {
    const response = await fetch('/api/unsubscribe?email=test@example.com')
    expect(response.status).toBe(302) // 重定向
  })
})
```

### 手动测试流程

1. **订阅测试**:
   - 访问捐赠页面
   - 勾选订阅选项
   - 完成捐赠
   - 验证数据库记录

2. **群发测试**:
   - 创建测试订阅（3 种语言各 1 个）
   - 调用 `sendProjectBroadcast()`
   - 检查收件箱（3 封邮件，不同语言）

3. **取消订阅测试**:
   - 点击邮件底部的取消订阅链接
   - 验证重定向到取消订阅页面
   - 验证数据库状态更新

---

## 后续优化建议

### 短期优化（1-2 周）

- [ ] **速率限制**: 为取消订阅 API 添加速率限制（防止滥用）
- [ ] **Honeypot 字段**: 在订阅表单添加隐藏字段（防止机器人）
- [ ] **邮件预览**: 管理员发送前可预览邮件（3 种语言）
- [ ] **批量导入**: 支持 CSV 批量导入订阅者

### 中期优化（1-2 月）

- [ ] **群发日志**: 添加 `email_broadcast_logs` 表记录发送历史
  - 记录发送时间、模板、收件人数、成功/失败数
  - 管理员可查看历史记录
- [ ] **邮件模板变量**: 支持动态变量替换（如 `{{project_url}}`）
- [ ] **定时群发**: 定时任务自动群发（如新项目发布时）
- [ ] **邮件打开追踪**: 添加像素追踪（可选）

### 长期优化（3-6 月）

- [ ] **用户自助页面**: 用户可通过链接管理订阅偏好
- [ ] **订阅偏好细化**: 按项目类型、地区订阅
- [ ] **模板编辑器**: Web 可视化邮件模板编辑器
- [ ] **A/B 测试**: 测试不同邮件主题和内容
- [ ] **多渠道通知**: SMS、Web Push 通知

---

## 附录

### A. 数据库迁移完整 SQL

见 `supabase/migrations/YYYYMMDDHHMMSS_email_subscriptions.sql`

### B. 环境变量检查清单

```bash
# Resend API（已有）
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Supabase（已有）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URL（已有）
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### C. 相关文档链接

- [Resend 官方文档](https://resend.com/docs)
- [React Email 组件库](https://react.email/docs/introduction)
- [RFC 2369 - List-Unsubscribe](https://www.rfc-editor.org/rfc/rfc2369)
- [CAN-SPAM Act 合规指南](https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business)

---

---

## 快速开始指南

### TL;DR（Too Long; Didn't Read）

1. **数据库**: 创建 `email_subscriptions` 表（1 个表，2 个函数，1 个触发器）
2. **模板**: 在 `lib/email/templates/broadcast/` 创建邮件模板文件
3. **前端**: 捐赠表单添加 checkbox + 管理员页面 `/admin/subscriptions`
4. **群发**: 管理员选择订阅者 + 模板 → 点击发送

### 最小可行实现（MVP）

**估计时间**: 3-4 小时

**步骤**:

1. **数据库迁移**（20分钟）
   ```sql
   -- 创建表
   CREATE TABLE email_subscriptions (...)
   -- 创建函数
   CREATE FUNCTION upsert_email_subscription(...)
   CREATE FUNCTION unsubscribe_email(...)
   ```

2. **邮件模板**（30分钟）
   ```bash
   mkdir -p lib/email/templates/broadcast
   # 创建 new-project.ts 模板
   ```

3. **后端 API**（40分钟）
   - `app/actions/subscription.ts` - 订阅管理
   - `app/actions/email-broadcast.ts` - 群发邮件
   - `app/api/unsubscribe/route.ts` - 取消订阅

4. **前端集成**（1.5小时）
   - 捐赠表单添加 checkbox
   - 取消订阅页面
   - 管理员订阅管理页面

5. **测试**（1小时）
   - 订阅流程测试
   - 群发邮件测试
   - 取消订阅测试

### 关键决策点

| 决策 | 选择 | 原因 |
|------|------|------|
| 模板存储 | 文件系统 | 简单、易于版本控制、无需数据库管理界面 |
| 群发触发 | 手动触发 | 避免自动发送误操作，管理员可控 |
| 群发日志 | 不记录 | 简化设计，后续可添加 |
| 用户管理 | 仅取消订阅 | 符合 GDPR，简单实现 |
| 订阅偏好 | 全局订阅 | MVP 阶段，后续可细化 |

### 核心文件清单

**数据库**:
- ✅ `supabase/migrations/20260104000000_email_subscriptions.sql` - 订阅表和函数

**邮件模板系统**:
- ✅ `lib/email/templates/index.ts` - 模板加载器核心 API
- ✅ `lib/email/templates/README.md` - 模板系统文档
- ✅ `lib/email/templates/broadcast/new-project.ts` - 新项目模板定义
- ✅ `lib/email/templates/content/new-project.en.html` - 英文内容
- ✅ `lib/email/templates/content/new-project.zh.html` - 中文内容
- ✅ `lib/email/templates/content/new-project.ua.html` - 乌克兰语内容
- ✅ `lib/email/templates/transactional/` - 事务性邮件（原有3个）
- ✅ `lib/email/broadcast.ts` - 群发邮件实现

**后端 API**:
- ✅ `app/actions/subscription.ts` - 订阅管理 Server Actions
- ✅ `app/actions/email-broadcast.ts` - 群发邮件 Server Action
- ✅ `app/api/unsubscribe/route.ts` - 取消订阅 API Route

**前端页面**:
- ✅ `app/[locale]/unsubscribed/page.tsx` - 取消订阅成功页
- ✅ `app/admin/subscriptions/page.tsx` - 管理员订阅管理页面
- ✅ `components/admin/SubscriptionsTable.tsx` - 订阅管理组件
- ✅ `components/donate/DonationFormCard.tsx` - 捐赠表单（添加订阅 checkbox）

**翻译文件**:
- ✅ `messages/en.json` - 英文翻译（更新）
- ✅ `messages/zh.json` - 中文翻译（更新）
- ✅ `messages/ua.json` - 乌克兰语翻译（更新）

### 环境变量检查

```bash
# Resend API（已有）
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Supabase（已有）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# App URL（已有）
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 部署检查清单

- [ ] 数据库迁移已推送到生产环境
- [ ] 邮件模板文件已部署
- [ ] 管理员可访问 `/admin/subscriptions`
- [ ] Resend 域名已验证
- [ ] 测试订阅流程（捐赠 → 订阅 → 群发 → 取消订阅）

---

**文档结束**

**文档版本**: 1.0.0 (简化版 - 无数据库模板管理)
**最后更新**: 2026-01-04
**审阅者**: ___________
**审批日期**: ___________
**下次审查**: ___________
