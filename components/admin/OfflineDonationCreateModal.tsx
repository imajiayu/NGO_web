'use client'

import { useMemo, useState } from 'react'

import { createOfflineDonation } from '@/app/actions/admin'
import { useAsyncForm } from '@/lib/hooks/useAsyncForm'
import { getTranslatedText } from '@/lib/i18n-utils'
import type { AppLocale, ProjectStats } from '@/types'
import type { AdminDonationListItem } from '@/types/dtos'

import AdminBaseModal from './AdminBaseModal'
import AdminButton from './ui/AdminButton'
import { SelectField, TextField } from './ui/FormField'

interface Props {
  projects: ProjectStats[]
  onClose: () => void
  onCreated: (donations: AdminDonationListItem[]) => void
}

interface FormState {
  project_id: string
  quantity: number
  amount: number
  donor_name: string
  donor_email: string
  donor_message: string
  contact_telegram: string
  contact_whatsapp: string
  donated_at: string
  locale: AppLocale
}

/**
 * Records an off-platform donation (bank transfer, cash, in-person handover) as
 * a paid donation so it shows up in project progress and the public donation
 * list exactly like an online one.
 *
 * The quantity/amount split is not cosmetic: projects.current_units is a
 * per-row counter, so a non-aggregated project needs one row per unit or its
 * progress bar under-counts. The server action enforces the same rule.
 */
export default function OfflineDonationCreateModal({ projects, onClose, onCreated }: Props) {
  const [formData, setFormData] = useState<FormState>({
    project_id: '',
    quantity: 1,
    amount: 0,
    donor_name: '',
    donor_email: '',
    donor_message: '',
    contact_telegram: '',
    contact_whatsapp: '',
    donated_at: new Date().toISOString().split('T')[0],
    locale: 'en',
  })

  const selectedProject = useMemo(
    () => projects.find((p) => String(p.id) === formData.project_id),
    [projects, formData.project_id]
  )

  const isAggregate = selectedProject?.aggregate_donations === true
  const unitPrice = selectedProject?.unit_price ?? 0

  // Fixed-term projects cap at the remaining target (same rule as the online
  // flow). Long-term projects have no cap.
  const remainingHint = useMemo(() => {
    if (!selectedProject) return undefined
    if (selectedProject.is_long_term) return 'Long-term project — no target cap.'
    const target = selectedProject.target_units ?? 0
    if (isAggregate) {
      const remaining = target - (selectedProject.total_raised ?? 0)
      return `Remaining target: $${remaining.toFixed(2)} of $${target.toFixed(2)}.`
    }
    const remaining = target - (selectedProject.current_units ?? 0)
    return `Remaining target: ${remaining} of ${target} unit(s).`
  }, [selectedProject, isAggregate])

  const totalPreview = isAggregate ? formData.amount : unitPrice * formData.quantity

  const {
    loading,
    error,
    onSubmit: handleSubmit,
  } = useAsyncForm(
    async () => {
      if (!selectedProject) {
        throw new Error('Please select a project')
      }

      const created = await createOfflineDonation({
        project_id: Number(formData.project_id),
        quantity: isAggregate ? 1 : formData.quantity,
        amount: isAggregate ? formData.amount : undefined,
        donor_name: formData.donor_name.trim(),
        donor_email: formData.donor_email.trim(),
        donor_message: formData.donor_message.trim() || undefined,
        contact_telegram: formData.contact_telegram.trim() || undefined,
        contact_whatsapp: formData.contact_whatsapp.trim() || undefined,
        donated_at: formData.donated_at,
        locale: formData.locale,
      })
      onCreated(created)
    },
    { fallbackError: 'Failed to record offline donation' }
  )

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <AdminBaseModal title="Record Offline Donation" onClose={onClose} error={error}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          For donations received outside the platform (bank transfer, cash, in-person handover).
          The record is created directly as <strong>paid</strong>, marked{' '}
          <strong>Offline</strong>, and <strong>no email is sent</strong>. It then follows the
          normal paid → confirmed → delivering → completed flow, and the donor gets the completion
          email at the last step.
        </div>

        {/* Project */}
        <div className="border-b pb-4">
          <h3 className="mb-3 font-body text-lg font-semibold">Project</h3>
          <SelectField
            label="Project"
            required
            value={formData.project_id}
            hint={remainingHint}
            // Reset the amount inputs on every switch: their meaning depends on
            // the project (unit count vs USD, different unit prices), and a
            // carried-over value would silently create the wrong rows — which
            // can't be corrected afterwards, since amount/project_id are
            // immutable once inserted (prevent_donation_immutable_fields).
            onChange={(v) => setFormData({ ...formData, project_id: v, quantity: 1, amount: 0 })}
          >
            <option value="">— Select a project —</option>
            {projects.map((p) => (
              <option key={p.id} value={String(p.id)}>
                #{p.id} {getTranslatedText(p.project_name_i18n, 'en')} [{p.status}
                {p.aggregate_donations ? ', by amount' : ', by unit'}
                {p.is_long_term ? ', long-term' : ''}]
              </option>
            ))}
          </SelectField>
        </div>

        {/* Amount */}
        <div className="border-b pb-4">
          <h3 className="mb-3 font-body text-lg font-semibold">Amount</h3>
          {!selectedProject ? (
            <p className="text-sm text-gray-600">Select a project first.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isAggregate ? (
                <TextField
                  label="Amount (USD)"
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  hint="Aggregated project — one record is created for this amount."
                  value={formData.amount || ''}
                  onChange={(v) => updateField('amount', Number(v))}
                />
              ) : (
                <TextField
                  label="Quantity (units)"
                  type="number"
                  required
                  min={1}
                  max={100}
                  step={1}
                  hint={`Unit price $${unitPrice.toFixed(2)} — ${formData.quantity} record(s) will be created, one per unit.`}
                  value={formData.quantity || ''}
                  onChange={(v) => updateField('quantity', Number(v))}
                />
              )}
              <TextField
                label="Donation date"
                type="date"
                required
                hint="Backdate this for donations received earlier."
                value={formData.donated_at}
                onChange={(v) => updateField('donated_at', v)}
              />
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 sm:col-span-2">
                Total recorded: <strong>${totalPreview.toFixed(2)} USD</strong>. Currency is always
                USD — project totals sum amounts without converting, so convert other currencies
                yourself before entering.
              </div>
            </div>
          )}
        </div>

        {/* Donor */}
        <div className="border-b pb-4">
          <h3 className="mb-3 font-body text-lg font-semibold">Donor</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Donor name"
              required
              value={formData.donor_name}
              onChange={(v) => updateField('donor_name', v)}
            />
            <TextField
              label="Donor email"
              type="email"
              required
              hint="Must be real — the donor uses it to look the donation up on the tracking page."
              value={formData.donor_email}
              onChange={(v) => updateField('donor_email', v)}
            />
            <SelectField
              label="Locale"
              required
              hint="Language of the completion email sent later."
              value={formData.locale}
              onChange={(v) => updateField('locale', v as AppLocale)}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ua">Українська</option>
            </SelectField>
            <TextField
              label="Message (optional)"
              value={formData.donor_message}
              onChange={(v) => updateField('donor_message', v)}
            />
            <TextField
              label="Telegram (optional)"
              value={formData.contact_telegram}
              onChange={(v) => updateField('contact_telegram', v)}
            />
            <TextField
              label="WhatsApp (optional)"
              value={formData.contact_whatsapp}
              onChange={(v) => updateField('contact_whatsapp', v)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4">
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" variant="primary" disabled={loading || !selectedProject}>
            {loading ? 'Recording...' : 'Record Donation'}
          </AdminButton>
        </div>
      </form>
    </AdminBaseModal>
  )
}
