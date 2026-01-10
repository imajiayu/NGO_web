'use client'

import { useTranslations } from 'next-intl'
import { STATUS_COLORS, type DonationStatus } from '@/lib/donation-status'

interface Props {
  status: DonationStatus
  namespace?: 'trackDonation' | 'projectDonationList'
}

/**
 * Donation Status Badge Component
 *
 * Displays a color-coded badge for donation status with user-friendly translations
 *
 * Color Scheme:
 * - Pre-payment: Yellow/Gray (pending, widget_load_failed)
 * - Processing: Blue/Purple (processing, fraud_check)
 * - Success: Green (paid, confirmed, completed)
 * - In Progress: Blue (delivering)
 * - Failed: Red/Gray (expired, declined, failed)
 * - Refund: Orange/Gray (refunding, refund_processing, refunded)
 */
export default function DonationStatusBadge({ status, namespace = 'trackDonation' }: Props) {
  const t = useTranslations(namespace)

  // Get status color classes based on donation status
  const getStatusClasses = (status: DonationStatus): string => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-700' }
    return `${baseClasses} ${colors.bg} ${colors.text}`
  }

  return (
    <span className={getStatusClasses(status)}>
      {t(`status.${status}`)}
    </span>
  )
}
