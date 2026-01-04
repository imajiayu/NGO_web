'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

export interface LightboxImage {
  url: string
  caption?: string
  alt?: string
  isVideo?: boolean
  contentType?: string
  thumbnailUrl?: string | null
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export default function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Update current index when initial index changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
    setImageLoaded(false)
  }, [initialIndex])

  // Reset image loaded state when current index changes
  useEffect(() => {
    setImageLoaded(false)
  }, [currentIndex])

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  // Navigate to next image
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, goToPrevious, goToNext])

  // Touch swipe handling
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) goToNext()
    if (isRightSwipe) goToPrevious()
  }

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image/Video Container */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content */}
        <div className="relative max-w-7xl max-h-[80vh] w-full h-full flex items-center justify-center">
          {currentImage.isVideo ? (
            <video
              src={currentImage.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg object-contain"
              style={{ maxHeight: '80vh' }}
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Thumbnail placeholder (if available) - shown while loading */}
              {!imageLoaded && currentImage.thumbnailUrl && (
                <img
                  src={currentImage.thumbnailUrl}
                  alt={currentImage.alt || currentImage.caption || `Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg blur-sm"
                  style={{ maxHeight: '80vh' }}
                />
              )}

              {/* Main image - always hidden until loaded, then fade in */}
              <img
                src={currentImage.url}
                alt={currentImage.alt || currentImage.caption || `Image ${currentIndex + 1}`}
                className={`max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                }`}
                style={{ maxHeight: '80vh' }}
                onLoad={() => setImageLoaded(true)}
              />

              {/* Loading spinner - shown while loading */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption */}
        {currentImage.caption && (
          <div className="mt-6 max-w-3xl text-center">
            <p className="text-white text-sm md:text-base leading-relaxed px-4">
              {currentImage.caption}
            </p>
          </div>
        )}

        {/* Progress Dots */}
        {images.length > 1 && (
          <div className="mt-6 flex items-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(index)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        <div className="mt-4 text-white/60 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}
