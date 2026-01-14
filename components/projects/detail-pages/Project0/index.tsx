'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import CollapsibleGallery from './CollapsibleGallery'
import type { LightboxImage } from '@/components/common/ImageLightbox'
import { FadeInSection } from '@/components/projects/shared'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import type { Project0Content, Project0DetailContentProps } from './types'
import { clientLogger } from '@/lib/logger-client'

// Sections
import {
  HeroSection,
  IntroductionSection,
  EventGallerySection,
  StatisticsSection,
  TeamSection,
  TreatmentSection,
  SuccessStoriesSection,
  ChallengesSection,
  FinancialSection,
  CallToActionSection,
} from './sections'

// Dynamic import for Lightbox
const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false })

export default function Project0DetailContent({ project, locale }: Project0DetailContentProps) {
  const t = useTranslations('projects')
  const [content, setContent] = useState<Project0Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [employerImages, setEmployerImages] = useState<string[]>([])

  // Lightbox states
  const [eventLightboxOpen, setEventLightboxOpen] = useState(false)
  const [eventLightboxIndex, setEventLightboxIndex] = useState(0)
  const [successLightboxOpen, setSuccessLightboxOpen] = useState(false)
  const [successLightboxIndex, setSuccessLightboxIndex] = useState(0)
  const [reportLightboxOpen, setReportLightboxOpen] = useState(false)
  const [reportLightboxIndex, setReportLightboxIndex] = useState(0)
  const [employerLightboxOpen, setEmployerLightboxOpen] = useState(false)
  const [employerLightboxIndex, setEmployerLightboxIndex] = useState(0)

  // Load content from JSON file
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`/content/projects/project-0-${locale}.json`)
        if (response.ok) {
          const data = await response.json()
          setContent(data)
        } else {
          clientLogger.warn('UI', `No content found for project-0`, { locale })
        }
      } catch (error) {
        clientLogger.error('UI', 'Error loading project content', {
          project: 0,
          error: error instanceof Error ? error.message : String(error),
        })
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [locale])

  // Load employer images
  useEffect(() => {
    const images = Array.from({ length: 13 }, (_, i) =>
      `/images/projects/project-0/employer/employer${i}.webp`
    )
    setEmployerImages(images)
  }, [])

  // Prepare lightbox images
  const eventLightboxImages = useMemo<LightboxImage[]>(
    () => (content?.images || []).map((url) => ({ url })),
    [content?.images]
  )

  const successLightboxImages = useMemo<LightboxImage[]>(
    () => (content?.successStories || []).map((story) => ({ url: story.image })),
    [content?.successStories]
  )

  const reportLightboxImages = useMemo<LightboxImage[]>(
    () =>
      (content?.financialStatus?.yearlyData || [])
        .filter((year) => year.reportImage)
        .map((year) => ({ url: year.reportImage! })),
    [content?.financialStatus?.yearlyData]
  )

  const employerLightboxImages = useMemo<LightboxImage[]>(
    () => employerImages.map((url) => ({ url })),
    [employerImages]
  )

  // Lightbox handlers
  const handleEventImageClick = (index: number) => {
    setEventLightboxIndex(index)
    setEventLightboxOpen(true)
  }

  const handleSuccessImageClick = (index: number) => {
    setSuccessLightboxIndex(index)
    setSuccessLightboxOpen(true)
  }

  const handleReportClick = (index: number) => {
    setReportLightboxIndex(index)
    setReportLightboxOpen(true)
  }

  const handleEmployerImageClick = (index: number) => {
    setEmployerLightboxIndex(index)
    setEmployerLightboxOpen(true)
  }

  if (loading) {
    return (
      <article className="space-y-4">
        {/* Hero Skeleton */}
        <div className="relative h-[60vh] min-h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse">
          <div className="absolute inset-0 flex items-end p-8">
            <div className="space-y-4 w-full max-w-2xl">
              <div className="h-10 bg-white/30 rounded-lg w-3/4"></div>
              <div className="h-6 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="bg-white rounded-2xl p-8 space-y-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </article>
    )
  }

  if (!content) {
    return (
      <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-ukraine-blue-500 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2 font-display">Way to Health</h1>
          <p className="text-ukraine-blue-100">{t('rehabilitationCenter')}</p>
        </div>
        <div className="p-8">
          <div className="p-8 bg-ukraine-blue-50 border-2 border-ukraine-blue-200 rounded-lg text-center">
            <p className="text-gray-600">{t('contentLoading')}</p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Hero Section */}
      <HeroSection content={content} locale={locale} />

      {/* Main Content Card */}
      <article className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Introduction */}
          <FadeInSection>
            <IntroductionSection content={content} />
          </FadeInSection>

          {/* Event Gallery */}
          {content.images && content.images.length > 0 && (
            <FadeInSection delay={100}>
              <EventGallerySection content={content} onImageClick={handleEventImageClick} />
            </FadeInSection>
          )}

          {/* Statistics */}
          <FadeInSection delay={200}>
            <StatisticsSection content={content} />
          </FadeInSection>

          {/* Progress Gallery */}
          {content.progressGallery && content.results && (
            <FadeInSection delay={300}>
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-ukraine-blue-500 to-ukraine-gold-500 rounded-full" />
                  <h2 className="font-display text-lg md:text-xl font-bold text-gray-900">
                    {content.progressGallery.title}
                  </h2>
                </div>
                <CollapsibleGallery
                  results={[
                    ...content.progressGallery.images.map((img) => ({
                      imageUrl: img.url,
                      caption: img.caption,
                      priority: img.priority,
                    })),
                    ...content.results,
                  ].filter((img) => {
                    const excludedImages = [
                      '/images/projects/project-0/result/result1.webp',
                      '/images/projects/project-0/progress/progress14.webp',
                      '/images/projects/project-0/result/result13 2.webp',
                      '/images/projects/project-0/progress/progress13.webp',
                    ]
                    return !excludedImages.includes(img.imageUrl)
                  })}
                />
              </section>
            </FadeInSection>
          )}

          {/* Team Section */}
          {content.team && (
            <FadeInSection delay={400}>
              <TeamSection
                content={content}
                employerImages={employerImages}
                onImageClick={handleEmployerImageClick}
              />
            </FadeInSection>
          )}

          {/* Treatment Programs */}
          <FadeInSection delay={500}>
            <TreatmentSection content={content} />
          </FadeInSection>

          {/* Success Stories */}
          <FadeInSection delay={600}>
            <SuccessStoriesSection content={content} onImageClick={handleSuccessImageClick} />
          </FadeInSection>

          {/* Challenges */}
          <FadeInSection delay={700}>
            <ChallengesSection content={content} />
          </FadeInSection>

          {/* Financial Status */}
          {content.financialStatus && (
            <FadeInSection delay={800}>
              <FinancialSection content={content} onReportClick={handleReportClick} />
            </FadeInSection>
          )}

          {/* Call to Action */}
          {content.callToAction && (
            <FadeInSection delay={900}>
              <CallToActionSection content={content} />
            </FadeInSection>
          )}
        </div>

        {/* Lightboxes */}
        {eventLightboxOpen && (
          <ImageLightbox
            images={eventLightboxImages}
            initialIndex={eventLightboxIndex}
            isOpen={eventLightboxOpen}
            onClose={() => setEventLightboxOpen(false)}
          />
        )}
        {successLightboxOpen && (
          <ImageLightbox
            images={successLightboxImages}
            initialIndex={successLightboxIndex}
            isOpen={successLightboxOpen}
            onClose={() => setSuccessLightboxOpen(false)}
          />
        )}
        {reportLightboxOpen && (
          <ImageLightbox
            images={reportLightboxImages}
            initialIndex={reportLightboxIndex}
            isOpen={reportLightboxOpen}
            onClose={() => setReportLightboxOpen(false)}
          />
        )}
        {employerLightboxOpen && (
          <ImageLightbox
            images={employerLightboxImages}
            initialIndex={employerLightboxIndex}
            isOpen={employerLightboxOpen}
            onClose={() => setEmployerLightboxOpen(false)}
          />
        )}
      </article>

      {/* Project Progress Section */}
      <ProjectProgressSection project={project} locale={locale} />
    </div>
  )
}
