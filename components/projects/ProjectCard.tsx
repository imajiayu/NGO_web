'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { ProjectStats } from '@/types'
import { getProjectName, getLocation, getUnitName, type SupportedLocale } from '@/lib/i18n-utils'
import ProjectProgressBar from './ProjectProgressBar'
import ProjectCardCompact from './ProjectCardCompact'

interface ProjectCardProps {
  project: ProjectStats
  locale: string

  // Display mode
  mode?: 'full' | 'compact'  // Default: 'full'

  // Configuration
  showProgress?: boolean

  // Selection state (only for compact mode)
  isSelected?: boolean
  onSelect?: (id: number) => void
}

export default function ProjectCard({
  project,
  locale,
  mode = 'full',
  showProgress = true,
  isSelected = false,
  onSelect,
}: ProjectCardProps) {
  const t = useTranslations('projects')

  // Get translated project data
  const projectName = getProjectName(project.project_name_i18n, project.project_name, locale as SupportedLocale)
  const location = getLocation(project.location_i18n, project.location, locale as SupportedLocale)
  const unitName = getUnitName(project.unit_name_i18n, project.unit_name, locale as SupportedLocale)

  // Use compact mode component if specified
  if (mode === 'compact') {
    return (
      <ProjectCardCompact
        project={project}
        locale={locale}
        isSelected={isSelected}
        onSelect={onSelect || (() => {})}
      />
    )
  }

  // Full mode rendering below

  // Calculate totals using unit count
  const currentUnits = project.current_units || 0
  const targetUnits = project.target_units || 1

  // Format date with null check
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  // Status badge color mapping
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    planned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paused: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div
      className="group flex-shrink-0 w-80 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(/images/projects/${project.id}/background.webp)`,
        backgroundColor: 'white'
      }}
    >
      {/* Semi-transparent overlay for the entire card */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px]"></div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Header with Tags */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-blue-50/80 to-white/80">
          <div className="flex items-start justify-between gap-2 mb-3">
            {/* Status Badge */}
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[project.status || 'active']}`}>
              {t(`status.${project.status}` as any)}
            </span>

            {/* Long-term Badge */}
            {project.is_long_term === true && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {t('longTerm')}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
            {projectName}
          </h3>
        </div>

        {/* Project Details */}
        <div className="p-5 space-y-3">
          {/* Location */}
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-700">{location}</span>
          </div>

          {/* Unit Price */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">${(project.unit_price || 0).toFixed(2)}</span>
              {' '}{t('perUnit', { unitName })}
            </span>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700">
              {t('startDate')}: <span className="font-medium">{formatDate(project.start_date!)}</span>
            </span>
          </div>

          {/* End Date - Only show for fixed-term projects */}
          {project.is_long_term !== true && (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-sm text-gray-700">
                {t('endDate')}: <span className="font-medium">{formatDate(project.end_date)}</span>
              </span>
            </div>
          )}

          {/* Funding Information */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('fundingProgress')}
              </span>
              <span className="text-sm font-bold text-blue-600">
                {project.is_long_term === true
                  ? `${currentUnits} ${unitName}`
                  : `${currentUnits} / ${targetUnits} ${unitName}`
                }
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{project.donation_count || 0} {t('donations')}</span>
              <span className="font-medium text-gray-600">
                ${(project.total_raised || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Progress Bar - Only show for fixed-term projects */}
          {project.is_long_term !== true && showProgress && (
            <ProjectProgressBar
              current={currentUnits}
              target={targetUnits}
              unitName={unitName}
              className="mt-2"
            />
          )}
        </div>

        {/* Action Button */}
        <div className="p-5 pt-0">
          {project.status === 'active' ? (
            <Link
              href={`/donate?project=${project.id}`}
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-xl"
            >
              {t('donateNow')}
            </Link>
          ) : (
            <Link
              href={`/donate?project=${project.id}`}
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md hover:shadow-xl"
            >
              {locale === 'en' ? 'View Details' : '查看详情'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
