# 数据库安全审计报告

**日期**: 2025-12-21
**审计范围**: Supabase RLS 策略使用情况
**风险等级**: 🔴 **高风险** - 需要立即修复

---

## 执行摘要

本次审计发现代码中**过度使用了 Service Role Client (绕过 RLS)**,导致多个严重的安全漏洞。主要问题是在用户可直接访问的 Server Actions 和公开 API 路由中使用了 service role,这完全绕过了数据库的 Row Level Security 保护。

### 关键发现
- ✅ 1 个合理使用 service role (webhook)
- ❌ 3 个不安全使用 service role (Server Actions + API)
- 🔴 高风险: 数据泄露、未授权访问、数据篡改

---

## 详细分析

### 1. Service Role Client 使用情况

#### ✅ 合理使用 (1处)

**文件**: `app/api/webhooks/wayforpay/route.ts`
- **用途**: 处理 WayForPay 支付回调
- **安全措施**: ✅ MD5 签名验证
- **评估**: **安全** - 这是正确使用 service role 的场景

```typescript
// ✅ 正确: 外部 webhook,有签名验证
const supabase = createServiceClient()
if (!verifyWayForPaySignature(body, body.merchantSignature)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
```

#### ❌ 不安全使用 (3处)

##### 🔴 严重问题 #1: `app/actions/donation.ts`

**问题**: Server Action 使用 service role 创建捐赠

```typescript
// ❌ 不安全: Server Action 可被客户端直接调用
export async function createWayForPayDonation(data: {...}) {
  const supabase = createServiceClient()  // Line 123
  // 插入捐赠记录,完全绕过 RLS
}
```

**风险**:
- 🚨 **数据篡改**: 用户可以修改 amount, project_id 等字段
- 🚨 **业务逻辑绕过**: 可以创建任意状态的捐赠
- 🚨 **欺诈风险**: 可能创建虚假的付费记录

**影响**: CRITICAL

---

##### 🔴 严重问题 #2: `app/actions/track-donation.ts`

**问题**: Server Actions 使用 service role 查询和修改捐赠

```typescript
// ❌ 不安全: 虽然有邮箱验证,但仍可被利用
export async function trackDonations(data: {...}) {
  const supabase = createServiceClient()  // Line 21
  // 查询捐赠信息
}

export async function requestRefund(data: {...}) {
  const supabase = createServiceClient()  // Line 75
  // 修改捐赠状态
}
```

**风险**:
- 🚨 **信息泄露**: 虽然验证邮箱,但可以枚举 donation IDs
- 🚨 **未授权操作**: 如果知道邮箱,可以请求退款
- 🚨 **隐私泄露**: 可以查询他人的捐赠历史

**影响**: HIGH

---

##### 🔴 严重问题 #3: `app/api/donations/order/[orderReference]/route.ts`

**问题**: 公开 API 使用 service role,无认证

```typescript
// ❌ 不安全: 完全公开的 API,无任何认证
export async function GET(request: Request, { params }: {...}) {
  const supabase = createServiceClient()  // Line 22
  // 返回包含 donor_email 的敏感信息
}
```

**风险**:
- 🚨 **敏感信息泄露**: 暴露 donor_email, amount 等信息
- 🚨 **枚举攻击**: orderReference 格式可预测 (DONATE-{id}-{timestamp}-{random})
- 🚨 **无认证**: 任何人都可以访问

**影响**: CRITICAL

---

### 2. 正确使用 RLS (createServerClient)

以下模块正确使用了普通客户端,RLS 策略生效:

#### ✅ `lib/supabase/queries.ts`
- 所有查询函数使用 `createServerClient()`
- RLS 策略正常工作
- **评估**: 安全

#### ✅ `app/api/donations/project-public/[projectId]/route.ts`
- 使用 `createServerClient()`
- 通过数据库视图 `public_project_donations` 获取脱敏数据
- **评估**: 安全

---

## 修复方案

### 🔴 优先级 1: 立即修复 (1-2天)

#### 修复 #1: `app/actions/donation.ts`

**方案 A (推荐)**: 改用 RLS + 匿名插入策略

```typescript
// ✅ 安全方案
export async function createWayForPayDonation(data: {...}) {
  // 使用普通客户端,依赖 RLS
  const supabase = createServerClient()

  // 或使用匿名客户端
  const supabase = createAnonClient()

  // RLS 策略应允许匿名用户插入 'pending' 状态的捐赠
  const { data: insertedData, error } = await supabase
    .from('donations')
    .insert(donationRecords)
    .select()
}
```

**需要的 RLS 策略**:
```sql
-- 允许匿名用户插入 pending 状态的捐赠
CREATE POLICY "Allow anonymous insert pending donations"
ON donations FOR INSERT
TO anon, authenticated
WITH CHECK (
  donation_status = 'pending' AND
  amount > 0 AND
  project_id IN (SELECT id FROM projects WHERE status = 'active')
);

-- 只允许 service role 更新为 paid 状态
-- (这个策略已经通过 webhook 中的 service role 实现)
```

---

#### 修复 #2: `app/actions/track-donation.ts`

**方案**: 改用 RLS + 临时访问令牌

```typescript
// ✅ 方案 A: 使用 RLS
export async function trackDonations(data: {...}) {
  const supabase = createServerClient()

  // RLS 策略:允许查询自己邮箱的捐赠
  const { data: donations, error } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_email', validated.email)
    .eq('donation_public_id', validated.donationId)
}

// ✅ 方案 B: 使用一次性访问令牌
// 1. 用户输入邮箱 + donation ID
// 2. 发送包含临时令牌的邮件
// 3. 用户点击链接,使用令牌访问
```

**需要的 RLS 策略**:
```sql
-- 方案 A: 允许查询自己的捐赠 (需要认证或临时令牌)
-- 这个比较复杂,因为我们没有用户认证系统

-- 推荐使用方案 B: 邮件验证 + 临时令牌
```

---

#### 修复 #3: `app/api/donations/order/[orderReference]/route.ts`

**方案 A (推荐)**: 使用临时令牌

```typescript
// ✅ 安全方案: 使用一次性令牌
export async function GET(request: Request, { params }: {...}) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // 验证令牌 (存储在数据库或 Redis 中)
  if (!isValidToken(orderReference, token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 使用普通客户端
  const supabase = createServerClient()
  // ...
}
```

**方案 B**: 移除敏感字段

```typescript
// ✅ 如果必须公开,至少移除敏感信息
const { data: donations, error } = await supabase
  .from('donations')
  .select(`
    donation_public_id,
    amount,
    donation_status,
    // ❌ 不要包含: donor_email, donor_name
  `)
  .eq('order_reference', orderReference)
```

---

### 🟡 优先级 2: 短期改进 (1周内)

1. **添加 Rate Limiting**
```typescript
// 使用 Vercel Rate Limiting 或 upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: ...,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
})
```

2. **添加请求日志**
```typescript
// 记录所有敏感操作
console.log('[AUDIT]', {
  action: 'create_donation',
  ip: request.headers.get('x-forwarded-for'),
  timestamp: new Date().toISOString(),
})
```

3. **添加监控和告警**
- 监控异常的捐赠创建频率
- 监控失败的认证尝试
- 设置告警阈值

---

### 🟢 优先级 3: 长期改进 (1个月内)

1. **实现真正的用户认证系统**
   - 使用 Supabase Auth
   - 捐赠者可以注册账号
   - 通过 RLS 策略基于 auth.uid() 保护数据

2. **审计日志系统**
   - 记录所有数据修改操作
   - 追踪可疑行为

3. **定期安全审计**
   - 每季度审查 RLS 策略
   - 检查新代码是否遵循安全最佳实践

---

## RLS 策略建议

### 当前缺失的策略

```sql
-- ============================================
-- Donations Table RLS Policies
-- ============================================

-- 1. 允许匿名用户插入 pending 状态的捐赠
CREATE POLICY "Allow anonymous insert pending donations"
ON donations FOR INSERT
TO anon, authenticated
WITH CHECK (
  donation_status = 'pending' AND
  amount > 0 AND
  amount <= 10000 AND  -- 添加合理的上限
  project_id IN (SELECT id FROM projects WHERE status = 'active')
);

-- 2. 只允许查询非敏感的公开捐赠信息
CREATE POLICY "Allow public read confirmed donations"
ON donations FOR SELECT
TO anon, authenticated
USING (
  donation_status IN ('paid', 'confirmed', 'delivering', 'completed')
);

-- 3. 禁止直接更新 (只能通过 webhook 使用 service role)
-- 不创建 UPDATE 策略,这样只有 service role 可以更新

-- 4. 禁止删除
-- 不创建 DELETE 策略

-- ============================================
-- Projects Table RLS Policies
-- ============================================

-- 1. 允许所有人查看 active 和 completed 项目
CREATE POLICY "Allow public read active projects"
ON projects FOR SELECT
TO anon, authenticated
USING (status IN ('active', 'completed'));

-- 2. 禁止插入/更新/删除 (只有 admin 可以,通过现有策略)
```

---

## 检查清单

实施修复后,请确保:

- [ ] 所有 Server Actions 使用 `createServerClient()` 或 `createAnonClient()`
- [ ] 所有公开 API 要么有认证,要么使用 RLS
- [ ] Service role 只在 webhook 中使用
- [ ] RLS 策略正确配置并测试
- [ ] 添加了 rate limiting
- [ ] 添加了审计日志
- [ ] 敏感操作有额外验证 (邮件确认等)
- [ ] 测试了绕过场景 (尝试未授权访问)

---

## 测试计划

### 安全测试用例

1. **测试 RLS 是否生效**
```typescript
// 测试: 尝试插入非 pending 状态的捐赠
// 预期: 应该失败

// 测试: 尝试修改已存在的捐赠
// 预期: 应该失败

// 测试: 尝试查询其他人的捐赠 (包含敏感信息)
// 预期: 应该失败或返回脱敏数据
```

2. **测试枚举攻击防护**
```bash
# 测试: 尝试枚举 orderReference
for i in {1..1000}; do
  curl "/api/donations/order/DONATE-1-$TIMESTAMP-$RANDOM"
done
# 预期: Rate limiting 应该触发
```

3. **测试认证机制**
```typescript
// 测试: 无令牌访问敏感 API
// 预期: 401 Unauthorized

// 测试: 过期令牌
// 预期: 401 Unauthorized
```

---

## 附录

### A. Supabase 客户端对比

| 客户端 | RLS | 使用场景 | 安全性 |
|-------|-----|---------|--------|
| `createServerClient()` | ✅ 生效 | 用户操作、Server Components | ✅ 安全 |
| `createAnonClient()` | ✅ 生效 | 匿名操作、公开 API | ✅ 安全 |
| `createServiceClient()` | ❌ 绕过 | **仅** Webhooks | ⚠️ 谨慎使用 |

### B. Service Role 使用原则

**唯一合理场景**:
1. ✅ 外部系统 Webhooks (必须有签名验证)
2. ✅ 后台定时任务 (Cron jobs)
3. ✅ 数据迁移脚本 (一次性操作)

**禁止场景**:
1. ❌ Server Actions (用户可调用)
2. ❌ 公开 API 路由
3. ❌ 客户端组件
4. ❌ 需要用户身份验证的操作

---

## 总结

当前系统存在严重的安全漏洞,主要原因是**过度依赖 Service Role Client**。建议:

1. **立即停止在 Server Actions 中使用 service role**
2. **迁移到 RLS + 匿名插入模式**
3. **为敏感操作添加额外验证 (邮件令牌等)**
4. **实施 Rate Limiting 和监控**

预计修复时间: **1-2 天 (优先级 1 项)**
完全加固时间: **2-4 周 (包含所有改进)**

---

**审计人员**: Claude Code
**下次审计**: 修复完成后 1 周
