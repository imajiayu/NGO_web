'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDownIcon, ChevronUpIcon } from '@/components/icons'
import ProjectResultsMasonry from '@/components/projects/shared/ProjectResultsMasonry'
import type { ProjectResult } from '@/types'

interface CollapsibleGalleryProps {
  results: ProjectResult[]
  className?: string
}

export default function CollapsibleGallery({
  results,
  className = '',
}: CollapsibleGalleryProps) {
  const t = useTranslations('projects')
  const [isExpanded, setIsExpanded] = useState(false)

  // Show only first 12 images when collapsed
  const displayedResults = isExpanded ? results : results.slice(0, 12)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const buttonText = isExpanded ? t('showLess') : t('viewAllPhotos')

  const photoCount = results.length - 12

  return (
    <div className={`relative ${className}`}>
      {/* Gallery Container */}
      <div className={`relative ${!isExpanded ? 'max-h-[160px] md:max-h-[200px] overflow-hidden' : ''}`}>
        <ProjectResultsMasonry
          results={displayedResults}
          allResultsForLightbox={results}
        />

        {/* Gradient Overlay - only show when collapsed and has more images */}
        {!isExpanded && results.length > 12 && (
          <div className="absolute -bottom-1 left-0 right-0 h-20 md:h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Toggle Button */}
      {results.length > 12 && (
        <div className="flex justify-center mt-3">
          <button
            onClick={toggleExpand}
            className="group relative flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-full border border-gray-200 hover:border-ukraine-blue-400 hover:text-ukraine-blue-600 transition-all duration-300 text-xs md:text-sm"
          >
            {/* Photo count badge */}
            {!isExpanded && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ukraine-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                +{photoCount}
              </span>
            )}

            <span className="font-medium">{buttonText}</span>
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
