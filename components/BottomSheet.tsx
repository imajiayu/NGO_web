'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  snapPoints?: number[] // Percentages of viewport height [min, mid, max]
  title?: string
  minimizedHint?: string // Text to show when minimized
  hideWhenMinimized?: boolean // Hide completely when minimized (to show footer)
}

// Constants
const NAV_BAR_HEIGHT = 64 // px - height of navigation bar
const MINIMIZED_HEIGHT = 64 // px - height of minimized button bar
const DRAG_THRESHOLD_RATIO = 0.1 // 10% of viewport height

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [0.15, 1], // Two states: minimized and full
  title,
  minimizedHint,
  hideWhenMinimized = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [currentSnap, setCurrentSnap] = useState(0) // Start minimized
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)

  // Calculate snap point in pixels
  const getSnapHeight = useCallback((snapIndex: number) => {
    const vh = window.innerHeight
    if (snapIndex === 1) {
      // Full screen: height to just below the navigation bar
      return vh - NAV_BAR_HEIGHT
    }
    // Minimized: fixed height for the button bar only
    return MINIMIZED_HEIGHT
  }, [])

  const isMinimized = currentSnap === 0
  const isExpanded = currentSnap === 1

  // Handle drag start
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true)
    setStartY(clientY)
    setCurrentY(clientY)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)

    const dragDistance = currentY - startY
    const vh = window.innerHeight
    const dragThreshold = vh * DRAG_THRESHOLD_RATIO

    // Toggle between minimized and expanded based on drag direction
    if (dragDistance > dragThreshold) {
      // Dragged down - minimize
      setCurrentSnap(0)
    } else if (dragDistance < -dragThreshold) {
      // Dragged up - expand
      setCurrentSnap(1)
    }
  }, [currentY, startY])

  // Toggle between minimized and expanded
  const toggleSheet = useCallback(() => {
    setCurrentSnap(prev => (prev === 0 ? 1 : 0))
  }, [])

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientY)
    },
    [handleDragStart]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY)
    },
    [handleDragStart]
  )

  // Add/remove event listeners for drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setCurrentY(e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      setCurrentY(e.touches[0].clientY)
    }

    const handleMouseUp = () => {
      handleDragEnd()
    }

    const handleTouchEnd = () => {
      handleDragEnd()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, handleDragEnd])

  // Lock body scroll when sheet is expanded
  useEffect(() => {
    if (isOpen && isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isExpanded])

  if (!isOpen) return null

  // Hide completely when minimized and hideWhenMinimized is true
  const shouldHide = isMinimized && hideWhenMinimized

  const currentHeight = getSnapHeight(currentSnap)

  return (
    <>
      {/* Backdrop - only show when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={toggleSheet}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-all duration-300 ease-out"
        style={{
          height: isDragging
            ? `${Math.max(getSnapHeight(0), currentHeight - (currentY - startY))}px`
            : `${currentHeight}px`,
          maxHeight: '95vh',
          transform: shouldHide ? 'translateY(100%)' : 'translateY(0)',
          opacity: shouldHide ? 0 : 1,
        }}
      >
        {/* Drag Handle */}
        <div
          className={`sticky top-0 z-10 cursor-pointer ${isMinimized ? '' : 'bg-white rounded-t-2xl'}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={toggleSheet}
        >
          {/* Minimized State */}
          {isMinimized && (
            <div className="flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl shadow-lg h-16">
              <ChevronUp className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">
                {minimizedHint || 'Donate Now'}
              </span>
              <ChevronUp className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Expanded State */}
          {isExpanded && (
            <div className="py-2 border-b border-gray-200 bg-white rounded-t-2xl">
              <div className="flex items-center justify-center">
                <ChevronDown className="w-6 h-6 text-blue-600 stroke-[2]" />
              </div>
            </div>
          )}
        </div>

        {/* Content - always render but hide when minimized */}
        <div
          className="overflow-y-auto bg-white"
          style={{
            height: isExpanded ? 'calc(100% - 40px)' : '0px',
            opacity: isExpanded ? 1 : 0,
            visibility: isExpanded ? 'visible' : 'hidden',
            pointerEvents: isExpanded ? 'auto' : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
