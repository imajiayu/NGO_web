'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import ScrollableRow from '@/components/common/ScrollableRow'
import { isBodyScrollLocked } from '@/lib/hooks/useBodyScrollLock'
import type { ProjectStats } from '@/types'

import ProjectCard from './ProjectCard'

interface ProjectsGalleryProps {
  // Project data
  projects: ProjectStats[]
  locale: string

  // Display mode
  mode?: 'full' | 'compact' // 'full' for home page, 'compact' for donate page

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
  const tc = useTranslations('common')

  // Scroll-based collapse/expand for compact mode
  // Default: all cards expanded. Scroll down: collapse. Scroll to top: expand.
  const [isCollapsedByScroll, setIsCollapsedByScroll] = useState(false)

  useEffect(() => {
    // Only enable scroll detection in compact mode
    if (mode !== 'compact') return

    const SCROLL_THRESHOLD = 50 // px from top to consider "at top"
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      if (isBodyScrollLocked()) return
      ticking = true

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY

        // Scroll down past threshold -> collapse
        if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD) {
          setIsCollapsedByScroll(true)
        }
        // Scroll to top -> expand
        else if (currentScrollY <= SCROLL_THRESHOLD) {
          setIsCollapsedByScroll(false)
        }

        lastScrollY = currentScrollY
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mode])

  // 新打开页面时，若已有选中项目（如直链 /donate/[id]），把该卡横向滚动到可见位置。
  // 仅 compact 模式、仅首次：block:'nearest' 保证只动横向滚动容器、不滚动整页。
  const selectedCardRef = useRef<HTMLDivElement>(null)
  const didInitialScrollRef = useRef(false)

  useEffect(() => {
    if (mode !== 'compact' || didInitialScrollRef.current) return
    // 首次挂载即锁定，无论有无选中——避免后续用户点选卡片时触发非预期的横向跳动
    didInitialScrollRef.current = true
    if (selectedProjectId == null) return
    const el = selectedCardRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' })
  }, [mode, selectedProjectId])

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{t('noProjects')}</p>
      </div>
    )
  }

  return (
    <section className={` ${mode === 'compact' ? 'pb-2 pt-4 md:pb-3 md:pt-6' : ''} `}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header - Only show when explicitly requested and not in compact mode */}
        {showHeader && mode !== 'compact' && (
          <div className="mb-8 text-center">
            <h2 className="mb-3 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
              {t('hero.projects.title')}
            </h2>
            <p className="text-lg text-gray-600">{t('hero.projects.subtitle')}</p>
          </div>
        )}

        {/* Horizontal Scrolling Container */}
        <ScrollableRow
          className="relative"
          scrollClassName="pb-4 pt-6"
          scrollbarPosition="bottom"
          hint={tc('carousel.dragHint')}
          scrollLeftLabel={tc('carousel.scrollLeft')}
          scrollRightLabel={tc('carousel.scrollRight')}
        >
          <div className="flex min-w-min items-start gap-6 px-2 py-2">
            {projects.map((project, index) => (
              <div
                key={project.id}
                ref={selectedProjectId === project.id ? selectedCardRef : undefined}
                className="flex-shrink-0"
              >
                <ProjectCard
                  project={project}
                  locale={locale}
                  mode={mode}
                  showProgress={true}
                  isSelected={selectedProjectId === project.id}
                  onSelect={onProjectSelect}
                  forceCollapse={mode === 'compact' ? isCollapsedByScroll : false}
                  // LCP 候选：有选中卡时为放大的那张，否则退回最左第一张（仅 compact 首屏需要）
                  priority={
                    mode === 'compact' &&
                    (selectedProjectId != null
                      ? selectedProjectId === project.id
                      : index === 0)
                  }
                />
              </div>
            ))}
          </div>
        </ScrollableRow>

        {/* Scroll Hint（仅移动端） */}
        <div className={`text-center md:hidden ${mode === 'compact' ? 'mt-2' : 'mt-4'}`}>
          <p className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('scrollToViewAll')}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </p>
        </div>
      </div>
    </section>
  )
}
