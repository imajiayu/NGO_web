-- 创建捐赠状态历史表
-- 用于审计追踪所有捐赠状态的转换记录

-- 1. 创建表
CREATE TABLE donation_status_history (
  id BIGSERIAL PRIMARY KEY,
  donation_id BIGINT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  from_status TEXT,  -- 旧状态（首次创建时为 NULL）
  to_status TEXT NOT NULL,  -- 新状态
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 创建索引（优化查询性能）
CREATE INDEX idx_donation_status_history_donation_id
  ON donation_status_history(donation_id);

CREATE INDEX idx_donation_status_history_changed_at
  ON donation_status_history(changed_at DESC);

CREATE INDEX idx_donation_status_history_to_status
  ON donation_status_history(to_status);

-- 3. 创建触发器函数
CREATE OR REPLACE FUNCTION log_donation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: 记录初始状态
  IF TG_OP = 'INSERT' THEN
    INSERT INTO donation_status_history (
      donation_id,
      from_status,
      to_status
    ) VALUES (
      NEW.id,
      NULL,
      NEW.donation_status
    );
    RETURN NEW;
  END IF;

  -- UPDATE: 只在状态变化时记录
  IF TG_OP = 'UPDATE' AND OLD.donation_status IS DISTINCT FROM NEW.donation_status THEN
    INSERT INTO donation_status_history (
      donation_id,
      from_status,
      to_status
    ) VALUES (
      NEW.id,
      OLD.donation_status,
      NEW.donation_status
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 绑定触发器到 donations 表
CREATE TRIGGER donation_status_change_trigger
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION log_donation_status_change();

-- 5. 启用行级安全（RLS）
ALTER TABLE donation_status_history ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略：只有管理员可以查看
CREATE POLICY "Admins can view all status history"
ON donation_status_history
FOR SELECT
TO authenticated
USING (is_admin());

-- 7. 注释说明
COMMENT ON TABLE donation_status_history IS '捐赠状态转换历史记录，用于审计追踪';
COMMENT ON COLUMN donation_status_history.from_status IS '旧状态（首次创建时为 NULL）';
COMMENT ON COLUMN donation_status_history.to_status IS '新状态';
COMMENT ON COLUMN donation_status_history.changed_at IS '状态变更时间';
