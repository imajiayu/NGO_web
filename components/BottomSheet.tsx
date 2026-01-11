'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@/components/icons'

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

  // Spring-like cubic bezier for smooth, bouncy animation
  const springTransition = 'cubic-bezier(0.32, 0.72, 0, 1)'

  return (
    <>
      {/* Bottom Sheet - No backdrop since sheet is nearly full screen */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50"
        style={{
          height: isDragging
            ? `${Math.max(getSnapHeight(0), currentHeight - (currentY - startY))}px`
            : `${currentHeight}px`,
          maxHeight: '95vh',
          transform: shouldHide ? 'translateY(100%)' : 'translateY(0)',
          opacity: shouldHide ? 0 : 1,
          // Smooth spring animation for height changes, instant for dragging
          transition: isDragging
            ? 'none'
            : `height 400ms ${springTransition}, transform 350ms ${springTransition}, opacity 250ms ease-out`,
          // Elegant shadow that grows with expansion
          boxShadow: isExpanded
            ? '0 -8px 40px -12px rgba(0, 0, 0, 0.25), 0 -4px 16px -8px rgba(0, 0, 0, 0.1)'
            : '0 -4px 20px -8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="sticky top-0 z-10 cursor-pointer touch-none select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={toggleSheet}
        >
          {/* Minimized State - CTA Button */}
          <div
            className="overflow-hidden rounded-t-3xl"
            style={{
              opacity: isMinimized ? 1 : 0,
              height: isMinimized ? '64px' : '0px',
              // 收起时：延迟出现，等内容先消失
              transition: isMinimized
                ? `opacity 200ms ease-out 200ms, height 300ms ${springTransition} 100ms`
                : `opacity 150ms ease-out, height 200ms ${springTransition}`,
            }}
          >
            <div className="flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 h-16">
              <ChevronUpIcon className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">
                {minimizedHint || 'Donate Now'}
              </span>
              <ChevronUpIcon className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Expanded State - Down Arrow */}
          <div
            className="bg-white rounded-t-3xl"
            style={{
              opacity: isExpanded ? 1 : 0,
              height: isExpanded ? 'auto' : '0px',
              overflow: 'hidden',
              // 收起时：快速消失；展开时：延迟出现
              transition: isExpanded
                ? `opacity 200ms ease-out 150ms, height 300ms ${springTransition}`
                : `opacity 100ms ease-out, height 150ms ease-out`,
            }}
          >
            <div className="pt-2 pb-1 flex items-center justify-center">
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Content with fade-in animation */}
        <div
          className="overflow-y-auto bg-white"
          style={{
            height: isExpanded ? 'calc(100% - 32px)' : '0px',
            opacity: isExpanded ? 1 : 0,
            visibility: isExpanded ? 'visible' : 'hidden',
            pointerEvents: isExpanded ? 'auto' : 'none',
            // Staggered content fade-in for polish
            transition: isExpanded
              ? `height 350ms ${springTransition}, opacity 300ms ease-out 100ms`
              : `height 300ms ${springTransition}, opacity 150ms ease-out`,
          }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
