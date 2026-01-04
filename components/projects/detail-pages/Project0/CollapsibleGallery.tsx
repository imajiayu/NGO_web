'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ProjectResultsMasonry from '@/components/projects/shared/ProjectResultsMasonry'
import type { ProjectResult } from '@/types'

interface CollapsibleGalleryProps {
  results: ProjectResult[]
  locale: string
  className?: string
}

export default function CollapsibleGallery({
  results,
  locale,
  className = '',
}: CollapsibleGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Show only first 12 images when collapsed (2 rows × 6 columns on desktop, 2 rows × 4 columns on mobile)
  const displayedResults = isExpanded ? results : results.slice(0, 12)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const buttonText = isExpanded
    ? locale === 'en'
      ? 'Show Less'
      : locale === 'zh'
      ? '收起'
      : 'Показати менше'
    : locale === 'en'
      ? 'View More'
      : locale === 'zh'
      ? '查看更多'
      : 'Дивитись більше'

  return (
    <div className={`relative ${className}`}>
      {/* Gallery Container */}
      <div className={`relative ${!isExpanded ? 'max-h-[170px] md:max-h-[220px] overflow-hidden' : ''}`}>
        <ProjectResultsMasonry results={displayedResults} />

        {/* Gradient Overlay - only show when collapsed */}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Toggle Button */}
      {results.length > 12 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={toggleExpand}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <span className="font-medium text-sm md:text-base">{buttonText}</span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
