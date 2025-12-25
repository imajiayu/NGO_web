-- =============================================================================================================
-- Add Donation Status Constraints
-- =============================================================================================================
-- Description:
--   Adds CHECK constraint to donation_status field to enforce valid status values.
--   This implements the improved status handling from the payment workflow redesign.
--
-- Date: 2025-12-24
-- Version: 1.0
--
-- New Status Values:
--   支付前 (Pre-payment):
--     - pending: 待支付（订单已创建）
--     - widget_load_failed: 支付窗口加载失败
--     - user_cancelled: 用户取消支付
--
--   支付中 (Processing):
--     - processing: 支付处理中（WayForPay inProcessing）
--     - fraud_check: 反欺诈审核中（WayForPay Pending）
--
--   支付完成 (Payment Complete):
--     - paid: 已支付
--     - confirmed: 已确认
--     - delivering: 配送中
--     - completed: 已完成
--
--   支付失败 (Payment Failed):
--     - expired: 支付超时（WayForPay Expired）
--     - declined: 银行拒绝（WayForPay Declined）
--     - failed: 其他失败
--
--   退款 (Refund):
--     - refunding: 退款申请中
--     - refund_processing: 退款处理中（WayForPay RefundInProcessing）
--     - refunded: 已退款（包含 WayForPay Refunded 和 Voided）
--
-- Reference: docs/PAYMENT_WORKFLOW.md
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Adding donation_status constraints...';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PART 1: ADD CHECK CONSTRAINT
-- =============================================================================================================

-- Drop existing constraint if any (for idempotency)
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS donations_status_check;

-- Add new CHECK constraint with all valid status values
ALTER TABLE public.donations
ADD CONSTRAINT donations_status_check CHECK (
  donation_status IN (
    -- Pre-payment
    'pending',
    'widget_load_failed',
    'user_cancelled',

    -- Processing
    'processing',
    'fraud_check',

    -- Payment complete
    'paid',
    'confirmed',
    'delivering',
    'completed',

    -- Payment failed
    'expired',
    'declined',
    'failed',

    -- Refund
    'refunding',
    'refund_processing',
    'refunded'
  )
);

DO $$
BEGIN
    RAISE NOTICE '✓ CHECK constraint added to donation_status';
END $$;

-- =============================================================================================================
-- PART 2: ADD COMMENT
-- =============================================================================================================

COMMENT ON CONSTRAINT donations_status_check ON public.donations IS
'Enforces valid donation status values. See docs/PAYMENT_WORKFLOW.md for status definitions and transitions.';

DO $$
BEGIN
    RAISE NOTICE '✓ Documentation comment added';
END $$;

-- =============================================================================================================
-- PART 3: VERIFICATION
-- =============================================================================================================

DO $$
DECLARE
    constraint_exists BOOLEAN;
    valid_statuses TEXT[];
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifying constraint...';
    RAISE NOTICE '========================================';

    -- Check if constraint exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'donations_status_check'
          AND table_name = 'donations'
          AND table_schema = 'public'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RAISE NOTICE '✓ Constraint donations_status_check exists';
    ELSE
        RAISE WARNING '⚠ Constraint donations_status_check not found';
    END IF;

    -- List all valid statuses
    valid_statuses := ARRAY[
        'pending', 'widget_load_failed', 'user_cancelled',
        'processing', 'fraud_check',
        'paid', 'confirmed', 'delivering', 'completed',
        'expired', 'declined', 'failed',
        'refunding', 'refund_processing', 'refunded'
    ];

    RAISE NOTICE '';
    RAISE NOTICE 'Valid donation status values (% total):', array_length(valid_statuses, 1);
    FOR i IN 1..array_length(valid_statuses, 1) LOOP
        RAISE NOTICE '  % %',
            LPAD(i::TEXT, 2, ' '),
            valid_statuses[i];
    END LOOP;

    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- PART 4: DATA INTEGRITY CHECK
-- =============================================================================================================

DO $$
DECLARE
    invalid_count INTEGER;
    invalid_statuses TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checking existing data integrity...';
    RAISE NOTICE '========================================';

    -- Check if any existing records have invalid status
    SELECT COUNT(*), STRING_AGG(DISTINCT donation_status, ', ')
    INTO invalid_count, invalid_statuses
    FROM public.donations
    WHERE donation_status NOT IN (
        'pending', 'widget_load_failed', 'user_cancelled',
        'processing', 'fraud_check',
        'paid', 'confirmed', 'delivering', 'completed',
        'expired', 'declined', 'failed',
        'refunding', 'refund_processing', 'refunded'
    );

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠ Found % records with invalid status: %', invalid_count, invalid_statuses;
        RAISE NOTICE '';
        RAISE NOTICE 'ACTION REQUIRED: Update these records before the constraint can be enforced:';
        RAISE NOTICE 'Example: UPDATE donations SET donation_status = ''failed'' WHERE donation_status = ''invalid_status'';';
    ELSE
        RAISE NOTICE '✓ All existing records have valid status values';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- =============================================================================================================
-- COMPLETION SUMMARY
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  ✓ Added CHECK constraint to donation_status';
    RAISE NOTICE '  ✓ Total valid statuses: 16';
    RAISE NOTICE '  ✓ Documentation updated';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Update TypeScript types (types/index.ts)';
    RAISE NOTICE '  2. Update WayForPay constants (lib/wayforpay/server.ts)';
    RAISE NOTICE '  3. Regenerate database types: npx supabase gen types typescript';
    RAISE NOTICE '';
    RAISE NOTICE 'Reference: docs/PAYMENT_WORKFLOW.md';
    RAISE NOTICE '========================================';
END $$;
