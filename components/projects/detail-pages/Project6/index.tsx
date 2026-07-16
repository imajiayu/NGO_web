'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import type { LightboxImage } from '@/components/common/ImageLightbox'
import ImageLightbox from '@/components/common/LazyImageLightbox'
import { SparklesIcon } from '@/components/icons'
import type { ResultImage } from '@/components/projects/shared'
import { FadeInSection, SectionNav, UnifiedResultsSection } from '@/components/projects/shared'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import { useActiveSection } from '@/lib/hooks/useActiveSection'
import { useLightbox, useLightboxFromUrls } from '@/lib/hooks/useLightbox'
import { useProjectContent } from '@/lib/hooks/useProjectContent'

import { HeroSection, IntroductionSection, SuppliesSection } from './sections'
import type { Project6Content, Project6DetailContentProps } from './types'

export default function Project6DetailContent({ project, locale }: Project6DetailContentProps) {
  const t = useTranslations('projects')
  const { data: content, loading } = useProjectContent<Project6Content>(
    `/content/projects/project-6-${locale}.json`,
    6
  )

  const lightboxImageUrls = useMemo(() => {
    if (!content?.introduction?.images) return []
    const { opening, arrival, bedroomHero, bedroomDetails, daily, closing, groupPhoto } =
      content.introduction.images
    return [
      opening,
      ...arrival,
      bedroomHero,
      ...bedroomDetails,
      ...daily,
      ...closing,
      groupPhoto,
    ].map((img) => img.src)
  }, [content?.introduction?.images])

  const { lightbox, images: lightboxImages } = useLightboxFromUrls(lightboxImageUrls)

  const receiptLightbox = useLightbox()
  const receiptLightboxImages = useMemo<LightboxImage[]>(
    () =>
      (content?.introduction?.bundle?.receipts ?? []).map((url, idx) => ({
        url,
        caption: t('receiptImageAlt', { index: idx + 1 }),
      })),
    [content?.introduction?.bundle?.receipts, t]
  )

  const sections = useMemo(() => {
    if (!content) return []
    return [
      { id: 'p6-introduction', label: t('sectionNav.introduction') },
      { id: 'p6-supplies', label: t('sectionNav.supplies') },
      { id: 'p6-project-progress', label: t('sectionNav.projectProgress') },
      ...(content.results?.length ? [{ id: 'p6-results', label: t('sectionNav.results') }] : []),
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

      <FadeInSection id="p6-supplies" delay={50}>
        <SuppliesSection
          bundle={content.introduction.bundle}
          onReceiptClick={receiptLightbox.open}
        />
      </FadeInSection>

      <FadeInSection id="p6-project-progress" delay={100}>
        <ProjectProgressSection project={project} locale={locale} />
      </FadeInSection>

      {content.results && content.results.length > 0 && (
        <FadeInSection id="p6-results" delay={150}>
          <UnifiedResultsSection
            title={t('project6.resultsTitle')}
            icon={
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
            }
            gradient="from-rose-500 via-rose-600 to-amber-500"
            images={content.results.map(
              (r): ResultImage => ({
                imageUrl: r.imageUrl,
                caption: r.caption,
                priority: r.priority,
              })
            )}
            getAltText={(i) => t('project6.resultAlt', { index: i + 1 })}
            layoutThreshold={0}
          />
        </FadeInSection>
      )}

      {lightbox.isOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightbox.currentIndex}
          isOpen={lightbox.isOpen}
          onClose={lightbox.close}
        />
      )}

      {receiptLightbox.isOpen && (
        <ImageLightbox
          images={receiptLightboxImages}
          initialIndex={receiptLightbox.currentIndex}
          isOpen={receiptLightbox.isOpen}
          onClose={receiptLightbox.close}
        />
      )}
    </div>
  )
}
