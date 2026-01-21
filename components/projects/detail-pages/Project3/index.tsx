'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { FadeInSection } from '@/components/projects/shared'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import { clientLogger } from '@/lib/logger-client'
import type { LightboxImage } from '@/components/common/ImageLightbox'
import type { ProjectContent, SuppliesData, Project3DetailContentProps } from './types'

// Sections
import {
  HeroSection,
  StatisticsSection,
  SheltersSection,
  GiftsListSection,
  SuppliesSection,
  ResultsSection,
} from './sections'

const ImageLightbox = dynamic(() => import('@/components/common/ImageLightbox'), { ssr: false })

export default function Project3DetailContent({ project, locale }: Project3DetailContentProps) {
  const [content, setContent] = useState<ProjectContent | null>(null)
  const [suppliesData, setSuppliesData] = useState<SuppliesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedShelters, setExpandedShelters] = useState<Set<number>>(new Set())
  const [detailLightboxOpen, setDetailLightboxOpen] = useState(false)
  const [detailLightboxIndex, setDetailLightboxIndex] = useState(0)
  const [receiptLightboxOpen, setReceiptLightboxOpen] = useState(false)
  const [receiptLightboxIndex, setReceiptLightboxIndex] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contentRes, suppliesRes] = await Promise.all([
          fetch(`/content/projects/project-3-${locale}.json`),
          fetch(`/content/projects/project-3-supplies-${locale}.json`),
        ])
        if (contentRes.ok) setContent(await contentRes.json())
        if (suppliesRes.ok) setSuppliesData(await suppliesRes.json())
      } catch (error) {
        clientLogger.error('UI', 'Error loading project content', {
          project: 3,
          error: error instanceof Error ? error.message : String(error),
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [locale])

  const toggleShelter = useCallback((index: number) => {
    setExpandedShelters((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const detailLightboxImages = useMemo<LightboxImage[]>(
    () =>
      content?.images?.map((url, idx) => ({ url, caption: `${content.title} - ${idx + 1}` })) || [],
    [content]
  )
  const receiptLightboxImages = useMemo<LightboxImage[]>(
    () =>
      suppliesData?.receipts?.images?.map((url, idx) => ({ url, caption: `Receipt ${idx + 1}` })) ||
      [],
    [suppliesData]
  )

  // P2 优化: useCallback 避免不必要的重渲染
  const handleDetailImageClick = useCallback((index: number) => {
    setDetailLightboxIndex(index)
    setDetailLightboxOpen(true)
  }, [])

  const handleReceiptClick = useCallback((index: number) => {
    setReceiptLightboxIndex(index)
    setReceiptLightboxOpen(true)
  }, [])

  const handleDetailLightboxClose = useCallback(() => {
    setDetailLightboxOpen(false)
  }, [])

  const handleReceiptLightboxClose = useCallback(() => {
    setReceiptLightboxOpen(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="relative h-[40vh] min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-christmas-berry/20 to-christmas-pine/20 animate-pulse">
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

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Hero */}
      <HeroSection content={content} project={project} locale={locale} />

      {/* Main Content */}
      <article className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 space-y-5 md:space-y-6">
          {/* Introduction */}
          {content?.introduction && (
            <FadeInSection>
              <section className="max-w-3xl">
                <div className="text-christmas-gold/30 text-5xl md:text-6xl font-serif leading-none mb-1 select-none">
                  "
                </div>
                {content.introduction.map((p, idx) => (
                  <p key={idx} className="text-sm md:text-base text-gray-700 leading-relaxed">
                    {p}
                  </p>
                ))}
              </section>
            </FadeInSection>
          )}

          {/* Images */}
          {content?.images && content.images.length > 0 && (
            <FadeInSection delay={100}>
              <section>
                <div className="grid grid-cols-12 gap-2 md:gap-3">
                  <div
                    className="col-span-8 row-span-2 relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => handleDetailImageClick(0)}
                  >
                    <Image
                      src={content.images[0]}
                      alt="Event"
                      fill
                      sizes="(max-width: 768px) 66vw, 50vw"
                      className="object-cover transition-all duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {content.images.slice(1, 3).map((img, idx) => (
                    <div
                      key={idx}
                      className="col-span-4 relative aspect-square rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
                      onClick={() => handleDetailImageClick(idx + 1)}
                    >
                      <Image
                        src={img}
                        alt={`Event ${idx + 2}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 25vw"
                        className="object-cover transition-all duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                  {content.images.slice(3, 6).map((img, idx) => (
                    <div
                      key={idx}
                      className="col-span-4 relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group"
                      onClick={() => handleDetailImageClick(idx + 3)}
                    >
                      <Image
                        src={img}
                        alt={`Event ${idx + 4}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 25vw"
                        className="object-cover transition-all duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </FadeInSection>
          )}

          {/* Statistics */}
          {content?.statistics && (
            <FadeInSection delay={150}>
              <StatisticsSection content={content} />
            </FadeInSection>
          )}

          {/* Shelters */}
          {content?.shelters && (
            <FadeInSection delay={200}>
              <SheltersSection content={content} locale={locale} />
            </FadeInSection>
          )}

          {/* Gifts List */}
          {content?.giftsList && (
            <FadeInSection delay={250}>
              <GiftsListSection
                content={content}
                expandedShelters={expandedShelters}
                onToggleShelter={toggleShelter}
              />
            </FadeInSection>
          )}
        </div>
      </article>

      {/* Supplies */}
      {suppliesData && (
        <FadeInSection>
          <SuppliesSection
            suppliesData={suppliesData}
            locale={locale}
            onReceiptClick={handleReceiptClick}
          />
        </FadeInSection>
      )}

      {/* Progress */}
      <FadeInSection>
        <ProjectProgressSection project={project} locale={locale} />
      </FadeInSection>

      {/* Results */}
      {content?.results && content.results.length > 0 && (
        <FadeInSection>
          <ResultsSection results={content.results} />
        </FadeInSection>
      )}

      {/* Lightboxes */}
      {detailLightboxOpen && (
        <ImageLightbox
          images={detailLightboxImages}
          initialIndex={detailLightboxIndex}
          isOpen={detailLightboxOpen}
          onClose={handleDetailLightboxClose}
        />
      )}
      {receiptLightboxOpen && (
        <ImageLightbox
          images={receiptLightboxImages}
          initialIndex={receiptLightboxIndex}
          isOpen={receiptLightboxOpen}
          onClose={handleReceiptLightboxClose}
        />
      )}
    </div>
  )
}
