'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import type { LightboxImage } from '@/components/common/ImageLightbox'
import ImageLightbox from '@/components/common/LazyImageLightbox'
import { FadeInSection, SectionNav } from '@/components/projects/shared'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import { useActiveSection } from '@/lib/hooks/useActiveSection'
import { useLightbox } from '@/lib/hooks/useLightbox'
import { useProjectContent } from '@/lib/hooks/useProjectContent'

import {
  AttributionSection,
  CostsSection,
  HeroSection,
  RehabSection,
  StorySection,
} from './sections'
import type { Project7Content, Project7DetailContentProps, Project7Image } from './types'

/**
 * 把一组图片包装成一个自成一体的灯箱：下标只在这组内计算，
 * 因此两个模块的「第 n / 共 m 张」互不干扰。
 * 传 alt 而非 caption——灯箱不显示说明文字条，但无障碍描述保留。
 */
function useSectionLightbox(images: Project7Image[]) {
  const lightbox = useLightbox()

  const lightboxImages = useMemo<LightboxImage[]>(
    () => images.map((img) => ({ url: img.src, alt: img.alt })),
    [images]
  )

  return { lightbox, lightboxImages }
}

export default function Project7DetailContent({ project, locale }: Project7DetailContentProps) {
  const t = useTranslations('projects')
  const { data: content, loading } = useProjectContent<Project7Content>(
    `/content/projects/project-7-${locale}.json`,
    7
  )

  // 故事与康复各自独立的灯箱：翻页不会从时间线一路串到康复照片
  const storyImages = useMemo<Project7Image[]>(
    () => content?.timeline.flatMap((event) => event.images ?? []) ?? [],
    [content]
  )
  const rehabImages = useMemo<Project7Image[]>(() => content?.rehab.gallery ?? [], [content])

  // 每个时间线节点的首张图在 storyImages 里的下标，供 StorySection 算出各缩略图的绝对位置
  const storyStartIndices = useMemo(() => {
    const starts: number[] = []
    let offset = 0
    for (const event of content?.timeline ?? []) {
      starts.push(offset)
      offset += event.images?.length ?? 0
    }
    return starts
  }, [content])

  const storyLightbox = useSectionLightbox(storyImages)
  const rehabLightbox = useSectionLightbox(rehabImages)

  const sections = useMemo(() => {
    if (!content) return []
    return [
      { id: 'p7-story', label: t('sectionNav.story') },
      { id: 'p7-rehab', label: t('sectionNav.rehabilitation') },
      { id: 'p7-costs', label: t('sectionNav.expenses') },
      { id: 'p7-project-progress', label: t('sectionNav.projectProgress') },
    ]
  }, [content, t])

  const activeSectionId = useActiveSection(sections.map((s) => s.id))

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="relative h-[45vh] min-h-[320px] animate-pulse overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 to-teal-100">
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

      <FadeInSection id="p7-story">
        <StorySection
          title={content.storyTitle}
          intro={content.intro}
          timeline={content.timeline}
          startIndices={storyStartIndices}
          onImageClick={storyLightbox.lightbox.open}
        />
      </FadeInSection>

      <FadeInSection id="p7-rehab" delay={50}>
        <RehabSection rehab={content.rehab} onImageClick={rehabLightbox.lightbox.open} />
      </FadeInSection>

      <FadeInSection id="p7-costs" delay={100}>
        <CostsSection costs={content.rehab.costs} therapies={content.rehab.therapies} />
      </FadeInSection>

      <FadeInSection id="p7-project-progress" delay={150}>
        <ProjectProgressSection project={project} locale={locale} />
      </FadeInSection>

      <FadeInSection delay={200}>
        <AttributionSection attribution={content.attribution} />
      </FadeInSection>

      {storyLightbox.lightbox.isOpen && (
        <ImageLightbox
          images={storyLightbox.lightboxImages}
          initialIndex={storyLightbox.lightbox.currentIndex}
          isOpen={storyLightbox.lightbox.isOpen}
          onClose={storyLightbox.lightbox.close}
        />
      )}

      {rehabLightbox.lightbox.isOpen && (
        <ImageLightbox
          images={rehabLightbox.lightboxImages}
          initialIndex={rehabLightbox.lightbox.currentIndex}
          isOpen={rehabLightbox.lightbox.isOpen}
          onClose={rehabLightbox.lightbox.close}
        />
      )}
    </div>
  )
}
