'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { ProjectStats } from '@/types'
import ProjectCard from './ProjectCard'

interface ProjectsGalleryProps {
  // Project data
  projects: ProjectStats[]
  locale: string

  // Display mode
  mode?: 'full' | 'compact'  // 'full' for home page, 'compact' for donate page

  // Selection state (for compact mode)
  selectedProjectId?: number | null
  onProjectSelect?: (id: number) => void

  // Show header
  showHeader?: boolean
}

export default function ProjectsGallery({
  projects,
  locale,
  mode = 'full',
  selectedProjectId,
  onProjectSelect,
  showHeader = false,
}: ProjectsGalleryProps) {
  const t = useTranslations(mode === 'compact' ? 'donate' : 'home')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('noProjects')}</p>
      </div>
    )
  }

  return (
    <section className={`
      ${mode === 'compact' ? 'py-6' : ''}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header - Only show when explicitly requested and not in compact mode */}
        {showHeader && mode !== 'compact' && (
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 font-display">
              {t('hero.projects.title')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('hero.projects.subtitle')}
            </p>
          </div>
        )}

        {/* Horizontal Scrolling Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4 pt-6 scrollbar-hide"
          >
            <div className="flex gap-6 min-w-min px-2 py-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  id={`project-card-${project.id}`}
                >
                  <ProjectCard
                    project={project}
                    locale={locale}
                    mode={mode}
                    showProgress={true}
                    isSelected={selectedProjectId === project.id}
                    onSelect={onProjectSelect}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Hint */}
          {projects.length > 3 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('scrollToViewAll')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
