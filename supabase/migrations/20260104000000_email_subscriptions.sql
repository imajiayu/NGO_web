-- Email Subscriptions Feature Migration
-- Description: Add email subscription system for newsletter broadcasts
-- Created: 2026-01-04

-- ============================================================================
-- 1. Create email_subscriptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_subscriptions (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,

  -- Email address (unique)
  email TEXT NOT NULL UNIQUE,

  -- Language preference (en/zh/ua)
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh', 'ua')),

  -- Subscription status
  is_subscribed BOOLEAN NOT NULL DEFAULT true,

  -- Timestamp
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Create indexes
-- ============================================================================

CREATE INDEX idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX idx_email_subscriptions_is_subscribed ON email_subscriptions(is_subscribed) WHERE is_subscribed = true;
CREATE INDEX idx_email_subscriptions_locale ON email_subscriptions(locale);

-- ============================================================================
-- 3. Add table and column comments
-- ============================================================================

COMMENT ON TABLE email_subscriptions IS 'Email subscription management table for newsletter broadcasts';
COMMENT ON COLUMN email_subscriptions.id IS 'Primary key';
COMMENT ON COLUMN email_subscriptions.email IS 'Subscriber email address';
COMMENT ON COLUMN email_subscriptions.locale IS 'User language preference (en/zh/ua)';
COMMENT ON COLUMN email_subscriptions.is_subscribed IS 'Subscription status (true=subscribed, false=unsubscribed)';
COMMENT ON COLUMN email_subscriptions.updated_at IS 'Last update timestamp';

-- ============================================================================
-- 4. Create trigger function to auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_email_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER update_email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_email_subscription_updated_at();

-- ============================================================================
-- 5. Create business functions
-- ============================================================================

-- Function: Upsert email subscription (idempotent)
CREATE OR REPLACE FUNCTION upsert_email_subscription(
  p_email TEXT,
  p_locale TEXT
)
RETURNS BIGINT AS $$
DECLARE
  v_subscription_id BIGINT;
BEGIN
  -- Validate input
  IF p_email IS NULL OR p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  IF p_locale NOT IN ('en', 'zh', 'ua') THEN
    RAISE EXCEPTION 'Invalid locale. Must be en, zh, or ua';
  END IF;

  -- Upsert operation
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

COMMENT ON FUNCTION upsert_email_subscription IS 'Subscribe or update subscription information (idempotent operation)';

-- Function: Unsubscribe email
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

COMMENT ON FUNCTION unsubscribe_email IS 'Unsubscribe email from newsletter';

-- ============================================================================
-- 6. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role can do everything (for Server Actions)
-- Note: Service role bypasses RLS, so no explicit policy needed

-- Policy 2: Admins can view all subscriptions (read-only)
CREATE POLICY "Admins can view all subscriptions"
  ON email_subscriptions
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy 3: Public functions (upsert_email_subscription, unsubscribe_email) use SECURITY DEFINER
-- No additional RLS policies needed for public access

-- ============================================================================
-- 7. Optional: Trigger to protect immutable fields
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_subscription_immutable_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect field: id
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify immutable field: id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER prevent_subscription_immutable_fields_trigger
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_subscription_immutable_fields();

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Test queries (comment out in production):
-- SELECT upsert_email_subscription('test@example.com', 'en');
-- SELECT unsubscribe_email('test@example.com');
-- SELECT * FROM email_subscriptions;
