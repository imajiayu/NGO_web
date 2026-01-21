'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { FadeInSection } from '@/components/projects/shared'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import { clientLogger } from '@/lib/logger-client'
import type { LightboxImage } from '@/components/common/ImageLightbox'
import type { Project4Content, Project4DetailContentProps, AidListData } from './types'

// Sections
import {
  HeroSection,
  FamilySection,
  LivingConditionsSection,
  StorySection,
  AidListSection,
  WhyGiftsSection,
  FamilyGallerySection,
} from './sections'

const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false })

export default function Project4DetailContent({ project, locale }: Project4DetailContentProps) {
  const [content, setContent] = useState<Project4Content | null>(null)
  const [aidData, setAidData] = useState<AidListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLightboxOpen, setDetailLightboxOpen] = useState(false)
  const [detailLightboxIndex, setDetailLightboxIndex] = useState(0)
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false)
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(0)
  const [livingConditionsLightboxOpen, setLivingConditionsLightboxOpen] = useState(false)
  const [livingConditionsLightboxIndex, setLivingConditionsLightboxIndex] = useState(0)
  const [talentLightboxOpen, setTalentLightboxOpen] = useState(false)
  const [talentLightboxIndex, setTalentLightboxIndex] = useState(0)
  const [receiptLightboxOpen, setReceiptLightboxOpen] = useState(false)
  const [receiptLightboxIndex, setReceiptLightboxIndex] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both content and aid data in parallel
        const [contentResponse, aidResponse] = await Promise.all([
          fetch(`/content/projects/project-4-${locale}.json`),
          fetch(`/content/projects/project-4-aid-${locale}.json`),
        ])

        if (contentResponse.ok) {
          setContent(await contentResponse.json())
        } else {
          clientLogger.warn('UI', 'No content found for project-4', { locale })
        }

        if (aidResponse.ok) {
          setAidData(await aidResponse.json())
        } else {
          clientLogger.warn('UI', 'No aid data found for project-4', { locale })
        }
      } catch (error) {
        clientLogger.error('UI', 'Error loading project content', {
          project: 4,
          error: error instanceof Error ? error.message : String(error),
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [locale])

  const detailLightboxImages = useMemo<LightboxImage[]>(
    () => content?.images?.map((url) => ({ url })) || [],
    [content]
  )

  const galleryLightboxImages = useMemo<LightboxImage[]>(
    () => content?.familyGallery?.images?.map((img) => ({ url: img.url })) || [],
    [content]
  )

  const livingConditionsLightboxImages = useMemo<LightboxImage[]>(() => {
    const defaultImages = [
      '/images/projects/project-4/details/wood-stove.webp',
      '/images/projects/project-4/details/desk.webp',
    ]
    const images = content?.livingConditions?.images || defaultImages
    return images.map((url) => ({ url }))
  }, [content])

  const talentLightboxImages = useMemo<LightboxImage[]>(() => {
    const images: LightboxImage[] = []
    content?.childrenTalents?.talents?.forEach((t) => images.push({ url: t.image }))
    if (content?.childrenTalents?.artworkImage) {
      images.push({ url: content.childrenTalents.artworkImage })
    }
    return images
  }, [content])

  const receiptLightboxImages = useMemo<LightboxImage[]>(
    () => aidData?.receipts?.images?.map((url) => ({ url })) || [],
    [aidData]
  )

  const handleDetailImageClick = (index: number) => {
    setDetailLightboxIndex(index)
    setDetailLightboxOpen(true)
  }

  const handleGalleryImageClick = (index: number) => {
    setGalleryLightboxIndex(index)
    setGalleryLightboxOpen(true)
  }

  const handleLivingConditionsImageClick = (index: number) => {
    setLivingConditionsLightboxIndex(index)
    setLivingConditionsLightboxOpen(true)
  }

  const handleTalentImageClick = (index: number) => {
    setTalentLightboxIndex(index)
    setTalentLightboxOpen(true)
  }

  const handleReceiptClick = (index: number) => {
    setReceiptLightboxIndex(index)
    setReceiptLightboxOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="relative h-[45vh] min-h-[320px] rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 animate-pulse">
          <div className="absolute inset-0 flex items-end p-4">
            <div className="space-y-2 w-full max-w-xl">
              <div className="h-7 bg-white/30 rounded w-3/4" />
              <div className="h-4 bg-white/20 rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-8">
        <p className="text-gray-600 text-center">Content not available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Hero */}
      <HeroSection content={content} project={project} locale={locale} />

      {/* Main Content */}
      <article className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Introduction with Highlights */}
          {content.introduction && (
            <FadeInSection>
              <section>
                {/* Highlights - Key Numbers */}
                {content.highlights && content.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-3 md:gap-4 mb-5">
                    {content.highlights.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100/80"
                      >
                        <span className="text-xl md:text-2xl font-bold text-amber-600">{h.number}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800 leading-tight">{h.label}</span>
                          <span className="text-xs text-gray-500 leading-tight">{h.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Introduction Text */}
                <div className="max-w-3xl space-y-3">
                  {content.introduction.map((p, idx) => (
                    <p key={idx} className="text-sm md:text-base text-gray-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            </FadeInSection>
          )}

          {/* Images Grid - 3 vertical images side by side */}
          {content.images && content.images.length > 0 && (
            <FadeInSection delay={100}>
              <section>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {content.images.slice(0, 3).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[3/4] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
                      onClick={() => handleDetailImageClick(idx)}
                    >
                      <Image
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 33vw"
                        className="object-cover transition-all duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>
              </section>
            </FadeInSection>
          )}

          {/* Family Section */}
          <FadeInSection delay={150}>
            <FamilySection content={content} locale={locale} />
          </FadeInSection>

          {/* Living Conditions */}
          <FadeInSection delay={200}>
            <LivingConditionsSection content={content} onImageClick={handleLivingConditionsImageClick} />
          </FadeInSection>

          {/* Children's Talents */}
          <FadeInSection delay={250}>
            <StorySection content={content} onTalentImageClick={handleTalentImageClick} />
          </FadeInSection>

          {/* Family Gallery */}
          {content.familyGallery && content.familyGallery.images.length > 0 && (
            <FadeInSection delay={300}>
              <FamilyGallerySection content={content} onImageClick={handleGalleryImageClick} />
            </FadeInSection>
          )}

          {/* Why Gifts */}
          <FadeInSection delay={350}>
            <WhyGiftsSection content={content} />
          </FadeInSection>
        </div>
      </article>

      {/* Aid List - Standalone Section */}
      {aidData && (
        <FadeInSection delay={450}>
          <AidListSection aidData={aidData} locale={locale} onReceiptClick={handleReceiptClick} />
        </FadeInSection>
      )}

      {/* Progress */}
      <FadeInSection>
        <ProjectProgressSection project={project} locale={locale} />
      </FadeInSection>

      {/* Lightboxes */}
      {detailLightboxOpen && (
        <ImageLightbox
          images={detailLightboxImages}
          initialIndex={detailLightboxIndex}
          isOpen={detailLightboxOpen}
          onClose={() => setDetailLightboxOpen(false)}
        />
      )}
      {galleryLightboxOpen && (
        <ImageLightbox
          images={galleryLightboxImages}
          initialIndex={galleryLightboxIndex}
          isOpen={galleryLightboxOpen}
          onClose={() => setGalleryLightboxOpen(false)}
        />
      )}
      {livingConditionsLightboxOpen && (
        <ImageLightbox
          images={livingConditionsLightboxImages}
          initialIndex={livingConditionsLightboxIndex}
          isOpen={livingConditionsLightboxOpen}
          onClose={() => setLivingConditionsLightboxOpen(false)}
        />
      )}
      {talentLightboxOpen && (
        <ImageLightbox
          images={talentLightboxImages}
          initialIndex={talentLightboxIndex}
          isOpen={talentLightboxOpen}
          onClose={() => setTalentLightboxOpen(false)}
        />
      )}
      {receiptLightboxOpen && receiptLightboxImages.length > 0 && (
        <ImageLightbox
          images={receiptLightboxImages}
          initialIndex={receiptLightboxIndex}
          isOpen={receiptLightboxOpen}
          onClose={() => setReceiptLightboxOpen(false)}
        />
      )}
    </div>
  )
}
