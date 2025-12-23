-- 启用管理员认证系统
-- 说明：只有管理员登录，无用户注册功能
-- 判断逻辑：只要能通过 auth.uid() 获取到用户 ID，就是管理员

-- 创建辅助函数检查是否已登录（即是否为管理员）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Check if user is logged in (admin-only system)';
