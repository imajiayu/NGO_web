'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useState, useEffect } from 'react'
import type { ProjectStats } from '@/types'
import { getProjectName, getLocation, getUnitName, formatDate, type SupportedLocale } from '@/lib/i18n-utils'
import ProjectProgressBar from './shared/ProjectProgressBar'
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner'
import ProjectStatusBadge from './ProjectStatusBadge'

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
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  // Reset loading state when pathname changes
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  // Get translated project data
  const projectName = getProjectName(project.project_name_i18n, project.project_name, locale as SupportedLocale)
  const location = getLocation(project.location_i18n, project.location, locale as SupportedLocale)
  const unitName = getUnitName(project.unit_name_i18n, project.unit_name, locale as SupportedLocale)

  const handleDonateClick = () => {
    setIsNavigating(true)
    router.push(`/donate?project=${project.id}`)
  }

  const handleSelectClick = () => {
    if (project.id !== null && project.id !== undefined && onSelect) {
      onSelect(project.id)
    }
  }

  // Calculate totals using unit count
  const currentUnits = project.current_units ?? 0
  const targetUnits = project.target_units ?? 0
  const hasValidTarget = targetUnits > 0

  // ===================================================================
  // COMPACT MODE RENDERING
  // ===================================================================
  if (mode === 'compact') {
    return (
      <button
        type="button"
        onClick={handleSelectClick}
        className={`
          group flex-shrink-0 w-64 bg-white rounded-2xl border-2 overflow-hidden
          transition-all duration-300 transform relative bg-cover bg-center bg-no-repeat
          ${isSelected
            ? 'border-blue-600 bg-blue-50 scale-105'
            : 'border-gray-200 hover:border-blue-400'
          }
        `}
        style={{
          backgroundImage: `url(/images/projects/project-${project.id}/card/bg.webp)`,
          backgroundColor: 'white'
        }}
      >
        {/* Semi-transparent overlay for the entire card */}
        <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px]"></div>

        {/* Content wrapper */}
        <div className="relative z-10">
          {/* Header with Tags - Always Visible */}
          <div className={`
            p-4 border-b transition-colors
            ${isSelected ? 'bg-gradient-to-br from-blue-100/80 to-blue-50/80 border-blue-200' : 'bg-gradient-to-br from-blue-50/80 to-white/80 border-gray-100'}
          `}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-start gap-2 flex-wrap">
                {/* Status Badge */}
                <ProjectStatusBadge status={project.status || 'active'} />

                {/* Long-term Badge */}
                {project.is_long_term === true && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    {t('longTerm')}
                  </span>
                )}
              </div>

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            <h3 className={`
              text-base font-bold leading-tight line-clamp-2 text-left
              ${isSelected ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-600'}
              transition-colors
            `}>
              {projectName}
            </h3>
          </div>

          {/* Details - Show on hover only */}
          <div className={`
            overflow-hidden transition-all duration-300 ease-in-out
            max-h-0 group-hover:max-h-[32rem]
          `}>
            <div className="p-4 pt-3 space-y-2.5">
              {/* Location */}
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-700 text-left">{location}</span>
              </div>

              {/* Unit Price or Flexible Amount */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {project.aggregate_donations ? (
                  <span className="text-sm font-semibold text-purple-700 text-left">
                    {locale === 'en' ? 'Any Amount' : locale === 'zh' ? '任意金额' : 'Будь-яка сума'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-700 text-left">
                    <span className="font-semibold text-gray-900">${(project.unit_price || 0).toFixed(2)}</span>
                    {' '}{t('perUnit', { unitName })}
                  </span>
                )}
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-700 text-left">
                  {t('startDate')}: <span className="font-medium">{formatDate(project.start_date, locale as SupportedLocale)}</span>
                </span>
              </div>

              {/* End Date - Only show for fixed-term projects */}
              {project.is_long_term !== true && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="text-sm text-gray-700 text-left">
                    {t('endDate')}: <span className="font-medium">{formatDate(project.end_date, locale as SupportedLocale)}</span>
                  </span>
                </div>
              )}

              {/* Funding Information */}
              <div className="pt-2 border-t border-gray-100">
                {/* Show current units for long-term NON-aggregated projects (since they don't have progress bar) */}
                {project.is_long_term === true && !project.aggregate_donations && (
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{t('currentUnits')}</span>
                    <span className="font-semibold text-blue-600">
                      {currentUnits} {unitName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{project.donation_count || 0} {t('donations')}</span>
                  <span className="font-semibold text-gray-900">
                    ${(project.total_raised || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress Bar - Only show for fixed-term projects with valid targets */}
              {project.is_long_term !== true && hasValidTarget && (
                <ProjectProgressBar
                  current={currentUnits}
                  target={targetUnits}
                  unitName={unitName}
                  showAsAmount={project.aggregate_donations ?? false}
                  className="mt-1"
                />
              )}
            </div>
          </div>
        </div>
      </button>
    )
  }

  // ===================================================================
  // FULL MODE RENDERING
  // ===================================================================

  return (
    <>
      <GlobalLoadingSpinner isLoading={isNavigating} />
      <div
        className="group flex-shrink-0 w-80 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative bg-cover bg-center bg-no-repeat flex flex-col"
        style={{
          backgroundImage: `url(/images/projects/project-${project.id}/card/bg.webp)`,
          backgroundColor: 'white'
        }}
      >
      {/* Semi-transparent overlay for the entire card */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px]"></div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Tags */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-blue-50/80 to-white/80">
          <div className="flex items-start justify-between gap-2 mb-3">
            {/* Status Badge */}
            <ProjectStatusBadge status={project.status || 'active'} />

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
        <div className="p-5 space-y-3 flex-grow">
          {/* Location */}
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-700">{location}</span>
          </div>

          {/* Unit Price or Flexible Amount */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {project.aggregate_donations ? (
              <span className="text-sm font-semibold text-purple-700">
                {locale === 'en' ? 'Any Amount' : locale === 'zh' ? '任意金额' : 'Будь-яка сума'}
              </span>
            ) : (
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">${(project.unit_price || 0).toFixed(2)}</span>
                {' '}{t('perUnit', { unitName })}
              </span>
            )}
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700">
              {t('startDate')}: <span className="font-medium">{formatDate(project.start_date, locale as SupportedLocale)}</span>
            </span>
          </div>

          {/* End Date - Only show for fixed-term projects */}
          {project.is_long_term !== true && (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-sm text-gray-700">
                {t('endDate')}: <span className="font-medium">{formatDate(project.end_date, locale as SupportedLocale)}</span>
              </span>
            </div>
          )}

          {/* Funding Information */}
          <div className="pt-3 border-t border-gray-100">
            {/* Show current units for long-term NON-aggregated projects (since they don't have progress bar) */}
            {project.is_long_term === true && !project.aggregate_donations && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{t('currentUnits')}</span>
                <span className="font-semibold text-blue-600">
                  {currentUnits} {unitName}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{project.donation_count || 0} {t('donations')}</span>
              <span className="font-semibold text-gray-900">
                ${(project.total_raised || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Progress Bar - Only show for fixed-term projects with valid targets */}
          {project.is_long_term !== true && showProgress && hasValidTarget && (
            <ProjectProgressBar
              current={currentUnits}
              target={targetUnits}
              unitName={unitName}
              showAsAmount={project.aggregate_donations ?? false}
              className="mt-2"
            />
          )}
        </div>

        {/* Action Button - Fixed at bottom */}
        <div className="p-5 pt-0 mt-auto">
          <button
            onClick={handleDonateClick}
            className="block w-full text-center py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-xl"
          >
            {t('viewDetails')}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
