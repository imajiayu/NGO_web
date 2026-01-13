'use client'

import { useTranslations } from 'next-intl'
import ProjectProgressBar from './ProjectProgressBar'
import type { ProjectStats } from '@/types'
import { getLocation, getUnitName, formatDate, type SupportedLocale } from '@/lib/i18n-utils'

interface ProjectProgressSectionProps {
  project: ProjectStats
  locale: string
}

const statusColors: Record<string, string> = {
  active: 'bg-life-100 text-life-800 border-life-200',
  completed: 'bg-ukraine-blue-100 text-ukraine-blue-800 border-ukraine-blue-200',
  planned: 'bg-ukraine-gold-100 text-ukraine-gold-800 border-ukraine-gold-200',
  paused: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function ProjectProgressSection({ project, locale }: ProjectProgressSectionProps) {
  const t = useTranslations('projects')

  const location = getLocation(project.location_i18n, project.location, locale as SupportedLocale)
  const unitName = getUnitName(project.unit_name_i18n, project.unit_name, locale as SupportedLocale)
  const currentUnits = project.current_units ?? 0
  const targetUnits = project.target_units ?? 0
  const hasValidTarget = targetUnits > 0

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-ukraine-blue-500 px-3 md:px-4 py-2 md:py-3 text-white">
        <h2 className="text-lg md:text-xl font-bold font-display">
          {t('projectProgress')}
        </h2>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 space-y-2 md:space-y-3">
        {/* Status and Long-term Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`px-2 py-0.5 text-[10px] md:text-xs font-semibold rounded-full border ${statusColors[project.status || 'active']}`}
          >
            {t(`status.${project.status}` as any)}
          </span>
          {project.is_long_term === true && (
            <span className="px-2 py-0.5 text-[10px] md:text-xs font-semibold rounded-full bg-ukraine-blue-100 text-ukraine-blue-800 border border-ukraine-blue-200">
              {t('longTerm')}
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Location */}
          <div className="flex items-start gap-1.5">
            <svg
              className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-[10px] md:text-xs text-gray-700 leading-tight">{location}</span>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-1.5">
            <svg
              className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[10px] md:text-xs text-gray-700 leading-tight">
              <span className="font-medium">
                {formatDate(project.start_date, locale as SupportedLocale)}
              </span>
              {project.is_long_term !== true && (
                <>
                  {' '}
                  →{' '}
                  <span className="font-medium">
                    {formatDate(project.end_date, locale as SupportedLocale)}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-2 mt-2">
          {/* Funding Information */}
          <div className="space-y-1.5">
            {/* Show current units for long-term NON-aggregated projects */}
            {project.is_long_term === true && !project.aggregate_donations && (
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-600">{t('currentUnits')}</span>
                <span className="font-semibold text-ukraine-gold-600">
                  {currentUnits} {unitName}
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs md:text-sm text-gray-600">
              <span>
                {project.donation_count || 0} {t('donations')}
              </span>
              <span className="font-semibold text-gray-900">
                ${(project.total_raised || 0).toFixed(2)}
              </span>
            </div>

            {/* Progress Bar */}
            {project.is_long_term !== true && hasValidTarget && (
              <ProjectProgressBar
                current={currentUnits}
                target={targetUnits}
                unitName={unitName}
                showAsAmount={project.aggregate_donations ?? false}
                className="mt-1.5"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
