-- 调试脚本：检查订单 DONATE-3-1766161687520-83FMXU 的状态

-- 1. 查找这个订单号的所有捐赠记录（不限状态）
SELECT
  id,
  donation_public_id,
  order_reference,
  donation_status,
  amount,
  currency,
  donor_email,
  created_at,
  donated_at
FROM donations
WHERE order_reference = 'DONATE-3-1766161687520-83FMXU'
ORDER BY created_at DESC;

-- 2. 查找所有 pending 状态的捐赠
SELECT
  id,
  donation_public_id,
  order_reference,
  donation_status,
  created_at
FROM donations
WHERE donation_status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 3. 查找最近创建的所有捐赠（最近 1 小时）
SELECT
  id,
  donation_public_id,
  order_reference,
  donation_status,
  created_at
FROM donations
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. 检查是否有任何以 DONATE-3-1766161687520 开头的订单
SELECT
  id,
  donation_public_id,
  order_reference,
  donation_status
FROM donations
WHERE order_reference LIKE 'DONATE-3-1766161687520%'
ORDER BY created_at DESC;
