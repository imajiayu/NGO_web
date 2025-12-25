'use client'

import { useTranslations } from 'next-intl'
import type { DonationStatus } from '@/types'

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

    switch (status) {
      // Pre-payment - Yellow
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`

      // Pre-payment - Gray (widget failed to load)
      case 'widget_load_failed':
        return `${baseClasses} bg-gray-100 text-gray-700`

      // Processing - Blue
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800`

      // Processing - Purple (security review)
      case 'fraud_check':
        return `${baseClasses} bg-purple-100 text-purple-800`

      // Success - Green
      case 'paid':
      case 'confirmed':
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`

      // In Progress - Blue
      case 'delivering':
        return `${baseClasses} bg-blue-100 text-blue-700`

      // Failed - Gray
      case 'expired':
        return `${baseClasses} bg-gray-100 text-gray-600`

      // Failed - Red
      case 'declined':
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`

      // Refund - Orange
      case 'refunding':
      case 'refund_processing':
        return `${baseClasses} bg-orange-100 text-orange-800`

      // Refunded - Gray
      case 'refunded':
        return `${baseClasses} bg-gray-100 text-gray-700`

      default:
        return `${baseClasses} bg-gray-100 text-gray-700`
    }
  }

  return (
    <span className={getStatusClasses(status)}>
      {t(`status.${status}`)}
    </span>
  )
}
