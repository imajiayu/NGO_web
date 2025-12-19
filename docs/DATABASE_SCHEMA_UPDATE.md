# 数据库架构更新说明

## 📋 变更总结

**日期**: 2024-12-19
**类型**: 架构优化
**影响**: WayForPay 支付集成

---

## 🎯 更新目标

简化 WayForPay 支付集成的数据库架构，**不创建额外的临时表**，直接使用现有的 `donations` 表。

---

## ✅ 已删除

### ❌ `pending_payments` 表（已移除）

之前设计的临时表，用于存储 WayForPay 支付元数据。

**为什么删除？**
- ✅ 不需要额外的表
- ✅ 减少数据迁移操作
- ✅ 简化数据模型
- ✅ 降低维护成本

---

## ✅ 现有方案

### 📊 修改现有 `donations` 表

#### 新增字段

```sql
ALTER TABLE donations
ADD COLUMN order_reference VARCHAR(255);
```

**字段说明:**
- `order_reference` - WayForPay 订单号
- 格式: `DONATE-{project_id}-{timestamp}`
- 示例: `DONATE-1-1702992000000`

#### 新增索引

```sql
-- 唯一索引（用于 webhook 查询）
CREATE UNIQUE INDEX idx_donations_order_reference
ON donations(order_reference)
WHERE order_reference IS NOT NULL;

-- 组合索引（优化状态查询）
CREATE INDEX idx_donations_order_ref_status
ON donations(order_reference, donation_status)
WHERE order_reference IS NOT NULL;
```

#### 新增状态

```sql
ALTER TABLE donations
ADD CONSTRAINT donations_donation_status_check
CHECK (donation_status IN ('pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded'));
```

**新状态说明:**
- `pending` - 支付前创建的待处理状态
- 现有状态保持不变

#### 更新触发器

```sql
CREATE OR REPLACE FUNCTION update_project_units()
```

**逻辑变化:**
- `pending` 状态的捐赠**不计入** `current_units`
- 只有 `paid/confirmed/delivering/completed` 状态才计入
- `pending → paid` 转换时自动增加计数

#### 新增清理函数

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_pending_donations()
```

**功能:**
- 删除 24 小时前创建的 `pending` 状态捐赠
- 防止未完成支付的记录累积

---

## 🔄 工作流程

### 支付前（Server Action）

```typescript
// 创建 pending 状态的捐赠记录
await supabase.from('donations').insert([
  {
    donation_public_id: '1-A1B2C3',
    order_reference: 'DONATE-1-1702992000000',
    donation_status: 'pending',
    // ... 其他字段
  }
])
```

### 支付后（Webhook）

```typescript
// 通过 order_reference 查询 pending 捐赠
const donations = await supabase
  .from('donations')
  .select('*')
  .eq('order_reference', orderReference)
  .eq('donation_status', 'pending')

// 更新为 paid 状态
await supabase
  .from('donations')
  .update({ donation_status: 'paid' })
  .eq('order_reference', orderReference)
  .eq('donation_status', 'pending')
```

---

## 📊 数据状态转换

```
用户提交表单
  ↓
创建 donations 记录 (status: pending)
  ↓
用户完成支付
  ↓
Webhook 回调
  ↓
更新 donations (pending → paid)
  ↓
触发器自动增加 current_units
  ↓
发送确认邮件
```

---

## 🔍 状态说明

| 状态 | 说明 | 计入 current_units | 可见性 |
|------|------|-------------------|--------|
| `pending` | 支付前创建 | ❌ 否 | 仅后台可见 |
| `paid` | 支付成功 | ✅ 是 | 公开可见 |
| `confirmed` | 已确认 | ✅ 是 | 公开可见 |
| `delivering` | 配送中 | ✅ 是 | 公开可见 |
| `completed` | 已完成 | ✅ 是 | 公开可见 |
| `refunding` | 退款中 | ✅ 是（暂时） | 公开可见 |
| `refunded` | 已退款 | ❌ 否 | 公开可见 |

---

## 🔑 关键优势

### 1. 简化的数据模型
- ❌ 不需要 `pending_payments` 临时表
- ✅ 只使用一个 `donations` 表
- ✅ 减少表间关系复杂度

### 2. 减少数据操作
- ❌ 不需要从临时表迁移到正式表
- ✅ 直接在 donations 表中更新状态
- ✅ 更少的数据库查询

### 3. 更好的用户体验
- ✅ 捐赠 ID 在支付前就生成
- ✅ 用户可以立即看到捐赠 ID
- ✅ 即使支付失败，记录也不丢失

### 4. 更容易维护
- ✅ 更少的表需要管理
- ✅ 更少的清理任务
- ✅ 更简单的调试过程

---

## 🚀 迁移步骤

### 1. 运行数据库迁移

```bash
# 使用 Supabase CLI
supabase db push

# 或手动在 Supabase Dashboard 执行
# supabase/migrations/005_wayforpay_support.sql
```

### 2. 验证迁移

```sql
-- 检查字段是否添加
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'donations'
AND column_name = 'order_reference';

-- 检查索引是否创建
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'donations'
AND indexname LIKE '%order_reference%';

-- 检查约束是否更新
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'donations_donation_status_check';
```

### 3. 测试支付流程

```bash
# 启动开发服务器
npm run dev

# 访问捐赠页面
http://localhost:3000/en/donate

# 完成测试支付
# 检查 donations 表中的记录状态
```

---

## 📝 后续维护

### 定期清理（可选）

```sql
-- 每天执行一次
SELECT cleanup_expired_pending_donations();

-- 返回: 删除的记录数
```

### 监控 SQL

```sql
-- 查看 pending 捐赠数量
SELECT COUNT(*)
FROM donations
WHERE donation_status = 'pending';

-- 查看超过 24 小时的 pending 捐赠
SELECT COUNT(*)
FROM donations
WHERE donation_status = 'pending'
AND created_at < NOW() - INTERVAL '24 hours';

-- 查看按状态分组的统计
SELECT donation_status, COUNT(*)
FROM donations
GROUP BY donation_status;
```

---

## 🔧 回滚方案（如需要）

如果需要回滚到之前的方案：

```sql
-- 删除新增的字段
ALTER TABLE donations DROP COLUMN IF EXISTS order_reference;

-- 删除新增的索引
DROP INDEX IF EXISTS idx_donations_order_reference;
DROP INDEX IF EXISTS idx_donations_order_ref_status;

-- 恢复原始约束
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_donation_status_check;
ALTER TABLE donations ADD CONSTRAINT donations_donation_status_check
CHECK (donation_status IN ('paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded'));

-- 删除清理函数
DROP FUNCTION IF EXISTS cleanup_expired_pending_donations();
```

---

## ✅ 总结

**更新完成** ✨

- ✅ 删除了 `pending_payments` 临时表
- ✅ 优化了 `donations` 表
- ✅ 添加了 `order_reference` 字段
- ✅ 新增了 `pending` 状态
- ✅ 更新了触发器逻辑
- ✅ 简化了数据库架构

**收益:**
- 更简单的数据模型
- 更少的维护工作
- 更好的性能
- 更容易理解和调试

---

**版本**: 1.0
**日期**: 2024-12-19
**迁移文件**: `supabase/migrations/005_wayforpay_support.sql`
