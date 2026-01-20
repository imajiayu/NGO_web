'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDownIcon } from '@/components/icons'
import ProjectResultsMasonry from '@/components/projects/shared/ProjectResultsMasonry'
import type { ProjectResult } from '@/types'

interface CollapsibleGalleryProps {
  results: ProjectResult[]
  className?: string
}

// Collapsed height in pixels
const COLLAPSED_HEIGHT_MOBILE = 160
const COLLAPSED_HEIGHT_DESKTOP = 200

export default function CollapsibleGallery({
  results,
  className = '',
}: CollapsibleGalleryProps) {
  const t = useTranslations('projects')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [contentHeight, setContentHeight] = useState<number | null>(null)

  const galleryRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Get collapsed height based on screen size
  const getCollapsedHeight = useCallback(() => {
    if (typeof window === 'undefined') return COLLAPSED_HEIGHT_MOBILE
    return window.innerWidth >= 768 ? COLLAPSED_HEIGHT_DESKTOP : COLLAPSED_HEIGHT_MOBILE
  }, [])

  // Measure content height when expanded
  useEffect(() => {
    if (contentRef.current && isExpanded) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [isExpanded, results])

  const handleExpand = useCallback(() => {
    if (isAnimating) return

    setIsAnimating(true)

    // First, measure the full content height
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }

    // Then expand
    setIsExpanded(true)

    // Animation complete
    setTimeout(() => {
      setIsAnimating(false)
    }, 500)
  }, [isAnimating])

  const handleCollapse = useCallback(() => {
    if (isAnimating || !galleryRef.current) return

    setIsAnimating(true)

    // Calculate where to scroll
    const galleryTop = galleryRef.current.getBoundingClientRect().top + window.scrollY
    const headerOffset = 80
    const targetScroll = Math.max(0, galleryTop - headerOffset)

    // Collapse content and scroll simultaneously
    setIsExpanded(false)
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    })

    // Animation complete after the longer of the two animations
    setTimeout(() => {
      setIsAnimating(false)
    }, 450)
  }, [isAnimating])

  const toggleExpand = useCallback(() => {
    if (isExpanded) {
      handleCollapse()
    } else {
      handleExpand()
    }
  }, [isExpanded, handleExpand, handleCollapse])

  const photoCount = results.length - 12
  const hasMorePhotos = results.length > 12

  // Calculate the style for the content container
  const getContentStyle = () => {
    if (!hasMorePhotos) return {}

    const collapsedHeight = getCollapsedHeight()

    if (isExpanded) {
      return {
        maxHeight: contentHeight ? `${contentHeight}px` : '5000px',
        transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }

    return {
      maxHeight: `${collapsedHeight}px`,
      transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }

  return (
    <div ref={galleryRef} className={`relative ${className}`}>
      {/* Gallery Container with smooth height transition */}
      <div
        ref={contentRef}
        className="relative overflow-hidden"
        style={getContentStyle()}
      >
        <ProjectResultsMasonry
          results={results}
          allResultsForLightbox={results}
        />
      </div>

      {/* Gradient Overlay with fade transition */}
      {hasMorePhotos && (
        <div
          className={`
            absolute -bottom-1 left-0 right-0 h-24 md:h-28
            bg-gradient-to-t from-white via-white/95 to-transparent
            pointer-events-none
            transition-opacity duration-300 ease-out
            ${isExpanded ? 'opacity-0' : 'opacity-100'}
          `}
        />
      )}

      {/* Toggle Button with micro-interactions */}
      {hasMorePhotos && (
        <div className={`
          flex justify-center
          transition-all duration-300
          ${isExpanded ? 'mt-4' : 'mt-1 relative -top-4'}
        `}>
          <button
            onClick={toggleExpand}
            disabled={isAnimating}
            className={`
              group relative flex items-center gap-2.5
              px-5 py-2.5
              bg-white text-gray-700
              rounded-full
              border border-gray-200
              shadow-sm hover:shadow-md
              hover:border-ukraine-blue-400 hover:text-ukraine-blue-600
              active:scale-95
              transition-all duration-300 ease-out
              text-xs md:text-sm
              ${isAnimating ? 'cursor-wait opacity-80' : 'cursor-pointer'}
            `}
          >
            {/* Photo count badge with scale animation */}
            <span
              className={`
                absolute -top-2 -right-2
                w-6 h-6
                bg-ukraine-blue-500 text-white
                text-[10px] font-bold
                rounded-full
                flex items-center justify-center
                shadow-sm
                transition-all duration-300 ease-out
                ${isExpanded
                  ? 'opacity-0 scale-75'
                  : 'opacity-100 scale-100'
                }
              `}
            >
              +{photoCount}
            </span>

            <span className="font-medium">
              {isExpanded ? t('showLess') : t('viewAllPhotos')}
            </span>

            {/* Animated arrow icon */}
            <span
              className={`
                inline-flex
                transition-transform duration-300 ease-out
                ${isExpanded ? 'rotate-180' : 'rotate-0'}
              `}
            >
              <ChevronDownIcon className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
