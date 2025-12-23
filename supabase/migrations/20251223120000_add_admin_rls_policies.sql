-- 管理员 RLS 策略

-- ============================================
-- Projects 表策略
-- ============================================

-- 管理员可以插入新项目
CREATE POLICY "Admins can insert projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- 管理员可以更新项目（但不能修改 id, created_at, updated_at）
CREATE POLICY "Admins can update projects"
ON projects FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (
  is_admin() AND
  -- 确保不修改这些字段
  id = (SELECT id FROM projects WHERE projects.id = id) AND
  created_at = (SELECT created_at FROM projects WHERE projects.id = id) AND
  updated_at IS NOT DISTINCT FROM (SELECT updated_at FROM projects WHERE projects.id = id)
);

-- 注意：没有 DELETE 策略，管理员无法删除项目

-- ============================================
-- Donations 表策略
-- ============================================

-- 管理员可以更新捐赠状态（仅限特定状态转换）
CREATE POLICY "Admins can update donation status"
ON donations FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (
  is_admin() AND
  -- 只能修改 donation_status 字段（其他字段不变）
  id = (SELECT id FROM donations WHERE donations.id = id) AND
  donation_public_id = (SELECT donation_public_id FROM donations WHERE donations.id = id) AND
  project_id = (SELECT project_id FROM donations WHERE donations.id = id) AND
  donor_name = (SELECT donor_name FROM donations WHERE donations.id = id) AND
  donor_email = (SELECT donor_email FROM donations WHERE donations.id = id) AND
  donor_message IS NOT DISTINCT FROM (SELECT donor_message FROM donations WHERE donations.id = id) AND
  contact_telegram IS NOT DISTINCT FROM (SELECT contact_telegram FROM donations WHERE donations.id = id) AND
  contact_whatsapp IS NOT DISTINCT FROM (SELECT contact_whatsapp FROM donations WHERE donations.id = id) AND
  amount = (SELECT amount FROM donations WHERE donations.id = id) AND
  currency IS NOT DISTINCT FROM (SELECT currency FROM donations WHERE donations.id = id) AND
  payment_method IS NOT DISTINCT FROM (SELECT payment_method FROM donations WHERE donations.id = id) AND
  order_reference = (SELECT order_reference FROM donations WHERE donations.id = id) AND
  locale IS NOT DISTINCT FROM (SELECT locale FROM donations WHERE donations.id = id) AND
  donated_at = (SELECT donated_at FROM donations WHERE donations.id = id) AND
  created_at = (SELECT created_at FROM donations WHERE donations.id = id) AND
  -- 检查状态转换是否合法
  (
    -- refunding → refunded
    (donation_status = 'refunded' AND (SELECT donation_status FROM donations WHERE donations.id = id) = 'refunding') OR
    -- paid → confirmed
    (donation_status = 'confirmed' AND (SELECT donation_status FROM donations WHERE donations.id = id) = 'paid') OR
    -- confirmed → delivering
    (donation_status = 'delivering' AND (SELECT donation_status FROM donations WHERE donations.id = id) = 'confirmed') OR
    -- delivering → completed
    (donation_status = 'completed' AND (SELECT donation_status FROM donations WHERE donations.id = id) = 'delivering')
  )
);

-- 管理员可以查看所有捐赠（用于后台管理）
CREATE POLICY "Admins can view all donations"
ON donations FOR SELECT
TO authenticated
USING (is_admin());

-- ============================================
-- Storage 策略（donation-results bucket）
-- ============================================

-- 管理员可以上传文件到 donation-results bucket
CREATE POLICY "Admins can upload to donation-results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-results' AND
  is_admin()
);

-- 管理员可以删除 donation-results bucket 中的文件
CREATE POLICY "Admins can delete from donation-results"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'donation-results' AND
  is_admin()
);

-- 管理员可以查看 donation-results bucket 中的文件
CREATE POLICY "Admins can view donation-results"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-results' AND
  is_admin()
);

-- 管理员可以更新文件元数据
CREATE POLICY "Admins can update donation-results metadata"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'donation-results' AND
  is_admin()
);

-- ============================================
-- 注释
-- ============================================

COMMENT ON POLICY "Admins can update projects" ON projects IS
'Admins can update projects but cannot modify id, created_at, updated_at';

COMMENT ON POLICY "Admins can update donation status" ON donations IS
'Admins can only update status field with valid transitions: refunding→refunded, paid→confirmed, confirmed→delivering, delivering→completed';
