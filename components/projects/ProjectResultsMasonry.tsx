'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import type { ProjectResult } from '@/types'
import ImageLightbox, { type LightboxImage } from '@/components/ImageLightbox'

interface ProjectResultsMasonryProps {
  results: ProjectResult[]
  className?: string
}

type ImageSize = 'small' | 'medium' | 'large' | 'xlarge'

interface MasonryItem extends ProjectResult {
  size: ImageSize
}

// Get CSS classes based on image size
const getSizeClasses = (size: ImageSize): string => {
  switch (size) {
    case 'small':
      return 'col-span-1 row-span-1'
    case 'medium':
      return 'col-span-1 row-span-2'
    case 'large':
      return 'col-span-2 row-span-2'
    case 'xlarge':
      return 'col-span-2 row-span-3'
    default:
      return 'col-span-1 row-span-1'
  }
}

// Convert priority to image size
const getSizeFromPriority = (priority?: number): ImageSize => {
  const p = priority ?? 5 // Default priority is 5

  if (p >= 9) return 'xlarge'  // Highest priority images
  if (p >= 7) return 'large'   // High priority images
  if (p >= 5) return 'medium'  // Medium priority images
  return 'small'               // Low priority images
}

export default function ProjectResultsMasonry({
  results,
  className = '',
}: ProjectResultsMasonryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Assign sizes to results based on priority
  const masonryItems = useMemo<MasonryItem[]>(() => {
    return results.map((result) => ({
      ...result,
      size: getSizeFromPriority(result.priority),
    }))
  }, [results])

  // Prepare images for lightbox
  const lightboxImages = useMemo<LightboxImage[]>(
    () =>
      results.map((result) => ({
        url: result.imageUrl,
        caption: result.caption,
        alt: result.caption,
      })),
    [results]
  )

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  if (results.length === 0) {
    return null
  }

  return (
    <>
      <div className={`w-full ${className}`}>
        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[150px] gap-3 md:gap-4">
          {masonryItems.map((item, index) => (
            <div
              key={index}
              className={`${getSizeClasses(item.size)} group relative overflow-hidden rounded-lg cursor-pointer`}
              onClick={() => openLightbox(index)}
            >
              {/* Image */}
              <Image
                src={item.imageUrl}
                alt={item.caption || `Result ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Hover Overlay with Caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 md:p-4">
                <p className="text-white text-xs md:text-sm font-medium leading-tight line-clamp-3">
                  {item.caption}
                </p>
                {item.date && (
                  <div className="flex items-center gap-1.5 mt-2 text-white/80 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
