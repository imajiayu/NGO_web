'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import ImageLightbox from '@/components/common/LazyImageLightbox'
import { FadeInSection, SectionNav } from '@/components/projects/shared'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import { useActiveSection } from '@/lib/hooks/useActiveSection'
import { useLightboxFromUrls } from '@/lib/hooks/useLightbox'
import { useProjectContent } from '@/lib/hooks/useProjectContent'

import { HeroSection, IntroductionSection } from './sections'
import type { Project6Content, Project6DetailContentProps } from './types'

export default function Project6DetailContent({ project, locale }: Project6DetailContentProps) {
  const t = useTranslations('projects')
  const { data: content, loading } = useProjectContent<Project6Content>(
    `/content/projects/project-6-${locale}.json`,
    6
  )

  const lightboxImageUrls = useMemo(() => {
    if (!content?.introduction?.images) return []
    const { opening, arrival, bedroomHero, bedroomDetails, daily, closing } =
      content.introduction.images
    return [opening, ...arrival, bedroomHero, ...bedroomDetails, ...daily, ...closing].map(
      (img) => img.src
    )
  }, [content?.introduction?.images])

  const { lightbox, images: lightboxImages } = useLightboxFromUrls(lightboxImageUrls)

  const sections = useMemo(() => {
    if (!content) return []
    return [
      { id: 'p6-introduction', label: t('sectionNav.introduction') },
      { id: 'p6-project-progress', label: t('sectionNav.projectProgress') },
    ]
  }, [content, t])

  const activeSectionId = useActiveSection(sections.map((s) => s.id))

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="relative h-[45vh] min-h-[320px] animate-pulse overflow-hidden rounded-xl bg-gradient-to-br from-rose-100 to-amber-100">
          <div className="absolute inset-0 flex items-end p-4">
            <div className="w-full max-w-xl space-y-2">
              <div className="h-7 w-3/4 rounded bg-white/30" />
              <div className="h-4 w-1/2 rounded bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-center text-gray-600">{t('contentNotAvailable')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <HeroSection content={content} project={project} locale={locale} />

      <SectionNav sections={sections} activeSectionId={activeSectionId} />

      <FadeInSection id="p6-introduction">
        <IntroductionSection introduction={content.introduction} onImageClick={lightbox.open} />
      </FadeInSection>

      <FadeInSection id="p6-project-progress" delay={100}>
        <ProjectProgressSection project={project} locale={locale} />
      </FadeInSection>

      {lightbox.isOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightbox.currentIndex}
          isOpen={lightbox.isOpen}
          onClose={lightbox.close}
        />
      )}
    </div>
  )
}
