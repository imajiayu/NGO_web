# 🔄 数据库迁移步骤

## 当前情况

你已经执行了旧的 `005` 迁移（创建了 `pending_payments` 表）。

现在需要：
1. ✅ 撤销旧的 `pending_payments` 表
2. ✅ 执行新的迁移（修改 `donations` 表）

---

## 📋 迁移步骤

### 步骤 1: 撤销旧迁移

在 Supabase Dashboard 执行以下 SQL：

```bash
# 方法 1: 使用 Supabase CLI (推荐)
supabase db push

# CLI 会自动检测并执行:
# - 005_rollback_pending_payments.sql
# - 006_wayforpay_donations_table.sql
```

或者手动执行：

```sql
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 1. 删除 RLS 策略
DROP POLICY IF EXISTS "Service role full access on pending_payments" ON pending_payments;
DROP POLICY IF EXISTS "Users can view their pending payments" ON pending_payments;

-- 2. 删除函数
DROP FUNCTION IF EXISTS cleanup_expired_pending_payments();
DROP FUNCTION IF EXISTS update_pending_payment_expires_at();

-- 3. 删除触发器
DROP TRIGGER IF EXISTS set_pending_payment_expires_at ON pending_payments;

-- 4. 删除索引
DROP INDEX IF EXISTS idx_pending_payments_order_reference;
DROP INDEX IF EXISTS idx_pending_payments_status;
DROP INDEX IF EXISTS idx_pending_payments_expires_at;
DROP INDEX IF EXISTS idx_pending_payments_created_at;

-- 5. 删除表
DROP TABLE IF EXISTS pending_payments CASCADE;

-- ✅ 撤销完成！
```

---

### 步骤 2: 执行新迁移

继续在 SQL Editor 中执行：

```sql
-- 1. 添加 order_reference 字段
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS order_reference VARCHAR(255);

-- 2. 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_order_reference
ON donations(order_reference)
WHERE order_reference IS NOT NULL;

-- 3. 更新状态约束（添加 pending）
ALTER TABLE donations
DROP CONSTRAINT IF EXISTS donations_donation_status_check;

ALTER TABLE donations
ADD CONSTRAINT donations_donation_status_check
CHECK (donation_status IN ('pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded'));

-- 4. 创建组合索引
CREATE INDEX IF NOT EXISTS idx_donations_order_ref_status
ON donations(order_reference, donation_status)
WHERE order_reference IS NOT NULL;

-- 5. 添加字段注释
COMMENT ON COLUMN donations.order_reference IS 'WayForPay order reference (format: DONATE-{project_id}-{timestamp})';

-- 6. 更新触发器函数
DROP TRIGGER IF EXISTS update_project_units_trigger ON donations;

CREATE OR REPLACE FUNCTION update_project_units()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update project units for non-pending donations
  IF (TG_OP = 'INSERT') THEN
    -- Increment project units for paid/confirmed/delivering/completed donations
    IF NEW.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
      UPDATE projects
      SET current_units = current_units + 1
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle status transitions
    -- FROM pending TO paid/confirmed/delivering/completed -> increment
    IF OLD.donation_status = 'pending' AND NEW.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
      UPDATE projects
      SET current_units = current_units + 1
      WHERE id = NEW.project_id;

    -- FROM paid/confirmed/delivering/completed TO refunded -> decrement
    ELSIF OLD.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') AND NEW.donation_status = 'refunded' THEN
      UPDATE projects
      SET current_units = current_units - 1
      WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement project units if deleting a counted donation
    IF OLD.donation_status IN ('paid', 'confirmed', 'delivering', 'completed') THEN
      UPDATE projects
      SET current_units = current_units - 1
      WHERE id = OLD.project_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. 重新创建触发器
CREATE TRIGGER update_project_units_trigger
  AFTER INSERT OR UPDATE OR DELETE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_project_units();

-- 8. 添加清理函数
CREATE OR REPLACE FUNCTION cleanup_expired_pending_donations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete pending donations older than 24 hours
  DELETE FROM donations
  WHERE donation_status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_pending_donations IS 'Deletes pending donations that are older than 24 hours';

-- ✅ 新迁移完成！
```

---

### 步骤 3: 验证迁移

执行以下查询验证：

```sql
-- 1. 检查 pending_payments 表是否已删除
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'pending_payments'
);
-- 应该返回: false

-- 2. 检查 order_reference 字段是否添加
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'donations'
AND column_name = 'order_reference';
-- 应该返回: order_reference | character varying

-- 3. 检查索引是否创建
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'donations'
AND indexname LIKE '%order_reference%';
-- 应该返回 2 个索引

-- 4. 检查状态约束
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'donations_donation_status_check';
-- 应该包含 'pending' 状态

-- 5. 测试清理函数
SELECT cleanup_expired_pending_donations();
-- 应该返回数字（删除的记录数）

-- ✅ 验证通过！
```

---

## 🎉 迁移完成检查清单

验证以下所有项目：

- [ ] `pending_payments` 表已删除
- [ ] `donations.order_reference` 字段已添加
- [ ] `idx_donations_order_reference` 索引已创建
- [ ] `idx_donations_order_ref_status` 索引已创建
- [ ] `donations_donation_status_check` 约束包含 `pending`
- [ ] `update_project_units()` 函数已更新
- [ ] `cleanup_expired_pending_donations()` 函数已创建
- [ ] 触发器 `update_project_units_trigger` 已重新创建

---

## 🧪 测试支付流程

迁移完成后测试：

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问捐赠页面
http://localhost:3000/en/donate

# 3. 填写表单并提交
# - 选择项目
# - 输入数量
# - 填写捐赠者信息

# 4. 检查数据库
# 应该在 donations 表中看到 pending 状态的记录
```

**在 Supabase Dashboard 查询：**

```sql
-- 查看 pending 捐赠
SELECT
  donation_public_id,
  order_reference,
  donation_status,
  donor_name,
  donor_email,
  created_at
FROM donations
WHERE donation_status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 如果遇到问题

### 问题 1: 约束冲突

**错误**: `violates check constraint "donations_donation_status_check"`

**解决**:
```sql
-- 删除旧约束
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_donation_status_check;

-- 添加新约束
ALTER TABLE donations
ADD CONSTRAINT donations_donation_status_check
CHECK (donation_status IN ('pending', 'paid', 'confirmed', 'delivering', 'completed', 'refunding', 'refunded'));
```

### 问题 2: 索引已存在

**错误**: `relation "idx_donations_order_reference" already exists`

**解决**:
```sql
-- 删除并重建
DROP INDEX IF EXISTS idx_donations_order_reference;
CREATE UNIQUE INDEX idx_donations_order_reference
ON donations(order_reference)
WHERE order_reference IS NOT NULL;
```

### 问题 3: 函数冲突

**错误**: `function already exists`

**解决**:
```sql
-- 使用 CREATE OR REPLACE
CREATE OR REPLACE FUNCTION update_project_units()
-- ... 函数定义
```

---

## 📝 迁移文件位置

所有迁移文件在：

```
supabase/migrations/
├── 001_init_schema.sql
├── 002_init_functions_views.sql
├── 003_init_policies.sql
├── 005_rollback_pending_payments.sql  ← 撤销旧迁移
└── 006_wayforpay_donations_table.sql  ← 新迁移
```

---

## ✅ 完成！

迁移成功后：

1. ✅ `pending_payments` 表已删除
2. ✅ `donations` 表已优化
3. ✅ 支付流程更简单
4. ✅ 数据库更易维护

现在可以正常使用 WayForPay 支付功能了！ 🎉

---

**最后更新**: 2024-12-19
**相关文档**:
- `docs/DATABASE_SCHEMA_UPDATE.md` - 架构更新说明
- `docs/WAYFORPAY_SETUP.md` - WayForPay 配置指南
- `docs/STRIPE_TO_WAYFORPAY_MIGRATION.md` - 迁移总结
