'use client'

import { useTranslations } from 'next-intl'
import type { ProjectStatus } from '@/types'

interface Props {
  status: ProjectStatus | string | null
  namespace?: 'projects' | 'admin'
}

/**
 * Project Status Badge Component
 *
 * Displays a color-coded badge for project status with user-friendly translations
 *
 * Color Scheme (aligned with DonationStatusBadge):
 * - planned: Yellow (准备中/计划中)
 * - active: Green (进行中/活跃)
 * - completed: Blue (已完成)
 * - paused: Gray (已暂停)
 */
export default function ProjectStatusBadge({ status, namespace = 'projects' }: Props) {
  const t = useTranslations(namespace)

  // Normalize status to valid ProjectStatus or default to 'active'
  const validStatus = (status === 'planned' || status === 'active' || status === 'completed' || status === 'paused')
    ? status
    : 'active'

  // Get status color classes based on project status
  const getStatusClasses = (status: ProjectStatus): string => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (status) {
      // Planned - Yellow (similar to donation pending)
      case 'planned':
        return `${baseClasses} bg-yellow-100 text-yellow-800`

      // Active - Green (similar to donation paid/confirmed/completed)
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`

      // Completed - Blue (similar to donation delivering)
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`

      // Paused - Gray (similar to donation expired/refunded)
      case 'paused':
        return `${baseClasses} bg-gray-100 text-gray-700`

      default:
        return `${baseClasses} bg-gray-100 text-gray-700`
    }
  }

  return (
    <span className={getStatusClasses(validStatus)}>
      {t(`status.${validStatus}` as any)}
    </span>
  )
}
