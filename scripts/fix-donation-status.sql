-- =============================================
-- Script: Fix donation status for testing
-- =============================================

-- Check current status of donation 2-055A09
SELECT
  donation_public_id,
  donation_status,
  amount,
  currency,
  project_id,
  donated_at
FROM donations
WHERE donation_public_id = '2-055A09';

-- Update status to completed (if needed)
-- Uncomment the line below to execute:
-- UPDATE donations SET donation_status = 'completed' WHERE donation_public_id = '2-055A09';

-- Verify the update
SELECT
  donation_public_id,
  donation_status
FROM donations
WHERE donation_public_id = '2-055A09';

-- Check if image folder exists in storage
-- (Run this in your app, not in SQL)
-- supabase.storage.from('donation-results').list('2-055A09')
