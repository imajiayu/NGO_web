-- Admin-entered offline donations (bank transfer, cash, in-person handover).
--
-- The only INSERT policy on donations forces donation_status = 'pending', which
-- serves the online flow (create pending row -> payment webhook flips to paid).
-- Off-platform donations have no gateway callback, so admins need to insert a
-- 'paid' row directly. This migration:
--   1. adds an admin-only INSERT policy locked to payment_method = 'Offline'
--   2. extends get_donations_by_email_verified with payment_method so the
--      track-donation page can hide the refund button for offline donations

BEGIN;

-- 1. Admin INSERT policy
--
-- Locked to donation_status = 'paid' + payment_method = 'Offline' so this policy
-- cannot be used to forge records that look like gateway payments. Deliberately
-- omits the anon policy's $10,000 cap: that is a payment-gateway risk limit and
-- does not apply to off-platform donations.
--
-- Currency is pinned to USD because project_stats.total_raised is a plain
-- SUM(amount) with no currency awareness, and every online path writes USD.
--
-- is_admin() is wrapped in a subquery so PostgreSQL hoists it into an InitPlan
-- and evaluates it once per statement instead of once per row — this path
-- inserts one row per donated unit. Same treatment as the market_orders
-- policies in 20260612140000_rls_initplan_market_orders.sql.
CREATE POLICY "Admins can insert offline donations" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    AND (donation_status)::text = 'paid'
    AND (payment_method)::text = 'Offline'
    AND amount > 0
    AND (currency)::text = 'USD'
    AND order_reference IS NOT NULL AND (order_reference)::text <> ''
    AND donation_public_id IS NOT NULL AND (donation_public_id)::text <> ''
    AND donor_name IS NOT NULL AND (donor_name)::text <> ''
    AND donor_email IS NOT NULL AND (donor_email)::text <> ''
    AND (locale)::text = ANY (ARRAY['en', 'zh', 'ua'])
    AND project_id IS NOT NULL
  );

COMMENT ON POLICY "Admins can insert offline donations" ON public.donations IS
'Allows admins to record off-platform donations directly as paid.
Pinned to payment_method = ''Offline'' and currency = ''USD''.
No amount cap (unlike the anon pending-insert policy) since offline donations
are not constrained by payment-gateway limits.';

-- 2. Recreate the track-donation RPC with payment_method
--
-- RETURNS TABLE signature changes, so CREATE OR REPLACE cannot be used.
-- Body is otherwise byte-identical to 20260505000000_drop_legacy_project_text_columns.sql.
DROP FUNCTION IF EXISTS public.get_donations_by_email_verified(text, text);

CREATE OR REPLACE FUNCTION public.get_donations_by_email_verified(p_email text, p_donation_id text)
RETURNS TABLE(
  id bigint,
  donation_public_id character varying,
  order_reference character varying,
  project_id bigint,
  donor_email character varying,
  amount numeric,
  currency character varying,
  donation_status character varying,
  payment_method character varying,
  donated_at timestamp with time zone,
  updated_at timestamp with time zone,
  project_name_i18n jsonb,
  location_i18n jsonb,
  unit_name_i18n jsonb,
  aggregate_donations boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Step 1: Verify that the donation ID belongs to the provided email
  IF NOT EXISTS (
    SELECT 1
    FROM donations verify
    WHERE verify.donation_public_id = p_donation_id
      AND LOWER(verify.donor_email) = LOWER(p_email)
  ) THEN
    RETURN;
  END IF;

  -- Step 2: Return all donations for this email
  RETURN QUERY
  SELECT
    d.id,
    d.donation_public_id,
    d.order_reference,
    d.project_id,
    d.donor_email,
    d.amount,
    d.currency,
    d.donation_status,
    d.payment_method,
    d.donated_at,
    d.updated_at,
    p.project_name_i18n,
    p.location_i18n,
    p.unit_name_i18n,
    p.aggregate_donations
  FROM donations d
  INNER JOIN projects p ON d.project_id = p.id
  WHERE LOWER(d.donor_email) = LOWER(p_email)
  ORDER BY d.donated_at DESC;
END;
$function$;

ALTER FUNCTION public.get_donations_by_email_verified(text, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_donations_by_email_verified(text, text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_donations_by_email_verified(text, text) IS 'Securely retrieves all donations for an email address after verifying ownership.
Includes order_reference for grouping, aggregate_donations for conditional display,
and payment_method so offline donations can hide the refund action.
Used by track donation feature.';

COMMIT;
