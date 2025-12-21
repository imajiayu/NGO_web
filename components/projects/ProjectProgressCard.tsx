'use client'

import { useTranslations } from 'next-intl'
import type { ProjectStats } from '@/types'
import { getLocation, getUnitName, formatDate, type SupportedLocale } from '@/lib/i18n-utils'
import ProjectProgressBar from './ProjectProgressBar'

interface ProjectProgressCardProps {
  project: ProjectStats
  locale: string
}

export default function ProjectProgressCard({
  project,
  locale
}: ProjectProgressCardProps) {
  const t = useTranslations('projects')

  // Get translated data
  const location = getLocation(project.location_i18n, project.location, locale as SupportedLocale)
  const unitName = getUnitName(project.unit_name_i18n, project.unit_name, locale as SupportedLocale)

  // Calculate totals
  const currentUnits = project.current_units || 0
  const targetUnits = project.target_units || 1

  // Status badge color mapping
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    planned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paused: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 text-white">
        <h2 className="text-xl font-bold">
          {locale === 'en' ? 'Project Progress' : locale === 'zh' ? '项目进度' : 'Прогрес проекту'}
        </h2>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Status and Long-term Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[project.status || 'active']}`}>
            {t(`status.${project.status}` as any)}
          </span>
          {project.is_long_term === true && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {t('longTerm')}
            </span>
          )}
        </div>

        {/* Info Grid - Horizontal layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Location */}
          <div className="flex items-start gap-1.5">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-gray-700 leading-tight">{location}</span>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-1.5">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-700 leading-tight">
              <span className="font-medium">{formatDate(project.start_date, locale as SupportedLocale)}</span>
              {project.is_long_term !== true && (
                <> → <span className="font-medium">{formatDate(project.end_date, locale as SupportedLocale)}</span></>
              )}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3 mt-3">
          {/* Funding Information */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('fundingProgress')}
              </span>
              <span className="text-sm font-bold text-purple-600">
                {project.is_long_term === true
                  ? `${currentUnits} ${unitName}`
                  : `${currentUnits} / ${targetUnits}`
                }
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>{project.donation_count || 0} {t('donations')}</span>
              <span className="font-medium text-gray-600">
                ${(project.total_raised || 0).toFixed(2)}
              </span>
            </div>

            {/* Progress Bar - Only show for fixed-term projects */}
            {project.is_long_term !== true && (
              <ProjectProgressBar
                current={currentUnits}
                target={targetUnits}
                unitName={unitName}
                className="mt-2"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
