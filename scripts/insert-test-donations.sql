-- =============================================================================================================
-- Insert Test Donations for Projects 1 and 2
-- =============================================================================================================
-- Description: Inserts 8 test donation records with different statuses to test filtering and display logic
-- Usage: Run this script in Supabase SQL Editor or via `supabase db execute`
--
-- Test coverage:
-- - Project 1: paid, confirmed, delivering, completed, pending, refunding (6 donations)
-- - Project 2: paid, refunded (2 donations)
--
-- Expected behavior:
-- - Donations with status 'paid', 'confirmed', 'delivering', 'completed' should be visible in project pages
-- - Donations with status 'pending', 'refunding', 'refunded' should NOT be visible in project pages
-- - Project progress should only count donations with valid statuses
-- =============================================================================================================

-- Clean up existing test donations (optional - comment out if you want to keep existing data)
-- DELETE FROM public.donations WHERE donor_email LIKE '%test.example.com';

-- =============================================
-- PROJECT 1 DONATIONS
-- =============================================

-- 1. Project 1 - Paid (VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    donor_message,
    contact_telegram,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '1-ABC123',
    1,
    'John Smith',
    'john.smith@test.example.com',
    'Happy to support this great cause!',
    '@johnsmith',
    50.00,
    'USD',
    'WayForPay',
    'DONATE-1-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'paid',
    'en',
    NOW() - INTERVAL '5 days'
);

-- 2. Project 1 - Confirmed (VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    donor_message,
    contact_whatsapp,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '1-DEF456',
    1,
    '李明',
    'liming@test.example.com',
    '支持你们的工作！',
    '+86 138 0000 0001',
    100.00,
    'USD',
    'WayForPay',
    'DONATE-1-' || (EXTRACT(EPOCH FROM NOW()) + 1)::TEXT,
    'confirmed',
    'zh',
    NOW() - INTERVAL '4 days'
);

-- 3. Project 1 - Delivering (VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    donor_message,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '1-GHI789',
    1,
    'Maria Garcia',
    'maria.garcia@test.example.com',
    'God bless your work!',
    75.00,
    'USD',
    'WayForPay',
    'DONATE-1-' || (EXTRACT(EPOCH FROM NOW()) + 2)::TEXT,
    'delivering',
    'en',
    NOW() - INTERVAL '3 days'
);

-- 4. Project 1 - Completed (VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    donor_message,
    contact_telegram,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '1-JKL012',
    1,
    'Олександр Коваленко',
    'oleksandr@test.example.com',
    'Дякую за вашу роботу!',
    '@oleksandr_ua',
    60.00,
    'USD',
    'WayForPay',
    'DONATE-1-' || (EXTRACT(EPOCH FROM NOW()) + 3)::TEXT,
    'completed',
    'ua',
    NOW() - INTERVAL '10 days'
);

-- 5. Project 1 - Pending (NOT VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '1-MNO345',
    1,
    'Pending User',
    'pending@test.example.com',
    30.00,
    'USD',
    'WayForPay',
    'DONATE-1-' || (EXTRACT(EPOCH FROM NOW()) + 4)::TEXT,
    'pending',
    'en',
    NOW() - INTERVAL '1 hour'
);

-- 6. Project 1 - Refunding (NOT VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    donor_message,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '1-PQR678',
    1,
    'Refund Requester',
    'refund@test.example.com',
    'Need to cancel my donation',
    40.00,
    'USD',
    'WayForPay',
    'DONATE-1-' || (EXTRACT(EPOCH FROM NOW()) + 5)::TEXT,
    'refunding',
    'en',
    NOW() - INTERVAL '2 days'
);

-- =============================================
-- PROJECT 2 DONATIONS
-- =============================================

-- 7. Project 2 - Paid (VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    donor_message,
    contact_whatsapp,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '2-STU901',
    2,
    '张伟',
    'zhangwei@test.example.com',
    '加油！',
    '+86 139 0000 0002',
    80.00,
    'USD',
    'WayForPay',
    'DONATE-2-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'paid',
    'zh',
    NOW() - INTERVAL '1 day'
);

-- 8. Project 2 - Refunded (NOT VISIBLE)
INSERT INTO public.donations (
    donation_public_id,
    project_id,
    donor_name,
    donor_email,
    donor_message,
    amount,
    currency,
    payment_method,
    order_reference,
    donation_status,
    locale,
    donated_at
) VALUES (
    '2-VWX234',
    2,
    'Refunded User',
    'refunded@test.example.com',
    'Changed my mind',
    25.00,
    'USD',
    'WayForPay',
    'DONATE-2-' || (EXTRACT(EPOCH FROM NOW()) + 1)::TEXT,
    'refunded',
    'en',
    NOW() - INTERVAL '7 days'
);

-- =============================================================================================================
-- VERIFICATION QUERIES
-- =============================================================================================================

-- Check inserted donations
SELECT
    donation_public_id,
    project_id,
    donor_email,
    amount,
    donation_status,
    locale,
    donated_at
FROM public.donations
WHERE donor_email LIKE '%test.example.com'
ORDER BY project_id, donated_at DESC;

-- Check project stats (should only count visible donations)
SELECT
    id,
    project_name,
    current_units,
    target_units,
    total_raised,
    donation_count,
    progress_percentage
FROM public.project_stats
WHERE id IN (1, 2);

-- Check public donation feed (should only show visible donations)
SELECT
    donation_public_id,
    project_id,
    project_name,
    donor_display_name,
    amount,
    donation_status
FROM public.public_donation_feed
WHERE project_id IN (1, 2)
ORDER BY donated_at DESC;

-- =============================================================================================================
-- EXPECTED RESULTS
-- =============================================================================================================
--
-- Total donations inserted: 8
--
-- Project 1:
--   - Total inserted: 6
--   - Visible (paid/confirmed/delivering/completed): 4
--   - Hidden (pending/refunding): 2
--   - Current units should increase by: 4
--   - Total raised should be: 50 + 100 + 75 + 60 = 285 USD
--
-- Project 2:
--   - Total inserted: 2
--   - Visible (paid): 1
--   - Hidden (refunded): 1
--   - Current units should increase by: 1
--   - Total raised should be: 80 USD
--
-- The pending, refunding, and refunded donations should:
--   ✗ NOT appear in project_stats
--   ✗ NOT appear in public_donation_feed
--   ✗ NOT appear in project donation lists
--   ✗ NOT be counted in current_units
--   ✗ NOT be counted in total_raised
--
-- Users can still track their own donations (including hidden ones) using:
--   - /api/donations/order/[orderReference]
--   - trackDonations() server action
-- =============================================================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test donations inserted successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Project 1: 6 donations (4 visible, 2 hidden)';
    RAISE NOTICE 'Project 2: 2 donations (1 visible, 1 hidden)';
    RAISE NOTICE '';
    RAISE NOTICE 'Run the verification queries above to check results.';
    RAISE NOTICE '========================================';
END $$;
