'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

import { logger } from '@/lib/logger'
import { OFFLINE_PAYMENT_METHOD } from '@/lib/payment-method'
import { getAdminClient } from '@/lib/supabase/action-clients'
import { getProjectStats, PROJECTS_CACHE_TAG } from '@/lib/supabase/queries'
import { type OfflineDonationInput, offlineDonationSchema } from '@/lib/validations'
import type { ProjectStats } from '@/types'
import type { AdminDonationListItem } from '@/types/dtos'

/**
 * Admin entry point for off-platform donations (bank transfer, cash, in-person
 * handover) that still need to show up on the site.
 *
 * Rows are built the same way as the online flow in
 * `app/actions/donation/_shared.ts` (insertPendingDonations), but that helper is
 * intentionally not reused: its header contract requires the payment paths to
 * stay byte-equal, and parameterizing status/currency would put the live payment
 * flow at risk for no real gain.
 *
 * Differences from the online flow:
 *   - donation_status is 'paid' from the start (no gateway callback exists)
 *   - payment_method is 'Offline' (also enforced by the RLS insert policy)
 *   - donated_at is admin-supplied so past donations can be backfilled
 *   - no $10,000 per-order cap (that is a gateway risk limit)
 *
 * Everything downstream is handled by DB triggers: `update_project_units`
 * increments projects.current_units per inserted row, and
 * `log_donation_status_change` writes the initial history entry.
 */

/** Retries per row when the generated public id collides within the batch. */
const MAX_ID_ATTEMPTS = 5

/** Round to cents — unit_price * quantity is float math and can drift. */
function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Business-rule rejection. Logged before throwing because Next.js redacts
 * Server Action error messages in production builds — without the log there is
 * no way to tell afterwards why a submission was rejected.
 */
function reject(message: string, context: Record<string, unknown>): never {
  logger.warn('ADMIN', `Offline donation rejected: ${message}`, context)
  throw new Error(message)
}

export async function createOfflineDonation(
  input: OfflineDonationInput
): Promise<AdminDonationListItem[]> {
  const supabase = await getAdminClient()

  let validated: z.infer<typeof offlineDonationSchema>
  try {
    validated = offlineDonationSchema.parse(input)
  } catch (err) {
    if (err instanceof z.ZodError) {
      reject(`Validation failed: ${err.errors.map((e) => e.message).join(', ')}`, {
        projectId: input?.project_id,
      })
    }
    throw err
  }

  // Project lookup goes through project_stats so total_raised / current_units
  // are the same numbers the public progress bars use.
  const project = (await getProjectStats(validated.project_id)) as ProjectStats | undefined

  if (!project) {
    reject(`Project ${validated.project_id} not found`, { projectId: validated.project_id })
  }

  // Row count and per-row amount are driven entirely by aggregate_donations:
  //   aggregated     -> 1 row carrying the full amount
  //   non-aggregated -> one row per unit, each at unit_price
  // projects.current_units is a per-row counter, so non-aggregated projects
  // must be split or the progress bar under-counts.
  const isAggregate = project.aggregate_donations === true
  const unitPrice = project.unit_price ?? 0

  let rowCount: number
  let rowAmount: number

  if (isAggregate) {
    if (!validated.amount || validated.amount <= 0) {
      reject('Amount is required for aggregated projects', { projectId: project.id })
    }
    rowCount = 1
    rowAmount = roundCents(validated.amount)
  } else {
    if (unitPrice <= 0) {
      reject('Project has no unit price configured', { projectId: project.id })
    }
    rowCount = validated.quantity
    rowAmount = roundCents(unitPrice)
  }

  // Fixed-term projects keep the same target ceiling as the online flow so the
  // progress bar can't exceed 100%. Long-term projects have no cap.
  if (!project.is_long_term) {
    const target = project.target_units ?? 0
    if (isAggregate) {
      const remaining = roundCents(target - (project.total_raised ?? 0))
      if (rowAmount > remaining) {
        reject(
          `Amount exceeds remaining target. Remaining: $${remaining.toFixed(2)}. ` +
            `Raise target_units in project settings if this donation should still be recorded.`,
          { projectId: project.id, requested: rowAmount, remaining }
        )
      }
    } else {
      const remaining = target - (project.current_units ?? 0)
      if (rowCount > remaining) {
        reject(
          `Quantity exceeds remaining target. Remaining: ${remaining} unit(s). ` +
            `Raise target_units in project settings if this donation should still be recorded.`,
          { projectId: project.id, requested: rowCount, remaining }
        )
      }
    }
  }

  // Distinct prefix from the online `DONATE-` reference. Must be non-empty:
  // the public donation list, the track page and project_stats.donation_count
  // all group/count by order_reference.
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  const orderReference = `OFFLINE-${project.id}-${Date.now()}-${randomSuffix}`

  // `generate_donation_public_id` only de-duplicates against rows already
  // committed to `donations` — the IDs generated earlier in this loop are still
  // in memory and invisible to it. With a 6-hex-char suffix (16^6 values) a
  // batch of 100 collides ~0.03% of the time, and the whole multi-row INSERT
  // would abort on the UNIQUE constraint. Track them locally and retry.
  const seenIds = new Set<string>()
  const rows = []
  for (let i = 0; i < rowCount; i++) {
    let donationPublicId: string | null = null

    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS && !donationPublicId; attempt++) {
      const { data, error: idError } = await supabase.rpc('generate_donation_public_id', {
        project_id_input: validated.project_id,
      })

      if (idError || !data) {
        logger.error('ADMIN', 'Failed to generate offline donation ID', { error: idError?.message })
        throw new Error('Failed to generate donation ID')
      }

      if (!seenIds.has(data)) {
        donationPublicId = data
      }
    }

    if (!donationPublicId) {
      logger.error('ADMIN', 'Exhausted donation ID attempts', {
        projectId: validated.project_id,
        generated: seenIds.size,
      })
      throw new Error('Failed to generate a unique donation ID')
    }

    seenIds.add(donationPublicId)

    rows.push({
      donation_public_id: donationPublicId,
      order_reference: orderReference,
      project_id: validated.project_id,
      donor_name: validated.donor_name,
      donor_email: validated.donor_email,
      donor_message: validated.donor_message || null,
      contact_telegram: validated.contact_telegram || null,
      contact_whatsapp: validated.contact_whatsapp || null,
      amount: rowAmount,
      currency: 'USD',
      payment_method: OFFLINE_PAYMENT_METHOD,
      donation_status: 'paid',
      donated_at: new Date(validated.donated_at).toISOString(),
      locale: validated.locale,
    })
  }

  const { data, error } = await supabase
    .from('donations')
    .insert(rows)
    .select('*, projects(project_name_i18n)')

  if (error) {
    logger.error('ADMIN', 'Failed to create offline donations', {
      error: error.message,
      orderReference,
    })
    throw new Error(`Failed to create offline donation: ${error.message}`)
  }

  logger.info('ADMIN', 'Offline donations created', {
    count: rows.length,
    orderReference,
    projectId: validated.project_id,
  })

  revalidatePath('/admin/donations')
  // Public pages read project_stats through a 120s unstable_cache; without the
  // tag bust the new total wouldn't show up for up to two minutes.
  revalidatePath('/[locale]', 'page')
  revalidateTag(PROJECTS_CACHE_TAG)

  return data as AdminDonationListItem[]
}
