-- Migration: Drop unused description_i18n column from projects table
-- Date: 2026-01-21
-- Description: Remove the description_i18n field which was never used in production.
--              Project descriptions are stored in static JSON files instead.

-- Step 1: Drop the project_stats view (it references description_i18n)
DROP VIEW IF EXISTS "public"."project_stats";

-- Step 2: Drop the column from projects table
ALTER TABLE "public"."projects" DROP COLUMN IF EXISTS "description_i18n";

-- Step 3: Recreate the project_stats view without description_i18n
CREATE VIEW "public"."project_stats" AS
 SELECT "p"."id",
    "p"."project_name",
    "p"."project_name_i18n",
    "p"."location",
    "p"."location_i18n",
    "p"."status",
    "p"."target_units",
    "p"."current_units",
    "p"."unit_name",
    "p"."unit_name_i18n",
    "p"."unit_price",
    "p"."start_date",
    "p"."end_date",
    "p"."is_long_term",
    "p"."aggregate_donations",
    COALESCE("sum"(
        CASE
            WHEN (("d"."donation_status")::"text" = ANY ((ARRAY['paid'::character varying, 'confirmed'::character varying, 'delivering'::character varying, 'completed'::character varying])::"text"[])) THEN "d"."amount"
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_raised",
    "count"(DISTINCT
        CASE
            WHEN (("d"."donation_status")::"text" = ANY ((ARRAY['paid'::character varying, 'confirmed'::character varying, 'delivering'::character varying, 'completed'::character varying])::"text"[])) THEN "d"."order_reference"
            ELSE NULL::character varying
        END) AS "donation_count",
        CASE
            WHEN ("p"."target_units" > 0) THEN "round"(((("p"."current_units")::numeric / ("p"."target_units")::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "progress_percentage"
   FROM ("public"."projects" "p"
     LEFT JOIN "public"."donations" "d" ON (("p"."id" = "d"."project_id")))
  GROUP BY "p"."id";

-- Step 4: Restore view comment
COMMENT ON VIEW "public"."project_stats" IS 'Project statistics view. donation_count represents actual payment transactions (unique order_reference), not individual donation records. For example, if a user buys 10 blankets in one transaction, it counts as 1 donation.';
