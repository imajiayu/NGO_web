'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface ScrollableRowProps {
  /** 横向排布的内容（通常是一个 flex 容器） */
  children: ReactNode
  /** 外层包裹元素的额外类名 */
  className?: string
  /** 滚动容器（overflow-x-auto）的额外类名，用于控制上下内边距 */
  scrollClassName?: string
  /** 滑块的额外类名，用于覆盖默认渐变 */
  thumbClassName?: string
  /** 提示文案（说明这是可横向拖动浏览的控件） */
  hint?: string
  /** 左箭头无障碍标签 */
  scrollLeftLabel?: string
  /** 右箭头无障碍标签 */
  scrollRightLabel?: string
  /** 滚动条位置：内容上方或下方，默认下方 */
  scrollbarPosition?: 'top' | 'bottom'
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  )
}

/**
 * 横向滚动行 + 自定义滚动条（金色「可拖动药丸」+ 两端箭头 + 文字提示）。
 *
 * 原生横向滚动条在桌面端（鼠标用户无触摸板、不知道 shift+滚轮）几乎无法操作，
 * 这里隐藏原生条，渲染一条「仅桌面端可见」的控件：金色药丸滑块（带握把纹、首次微动提示）、
 * 两端可点击的翻页箭头、左侧文字提示，明确告诉用户这是「横向浏览全部」的控件。
 * 支持拖拽滑块 / 点击轨道跳转 / 点击箭头翻页，并随滚动与尺寸变化实时同步。
 * 移动端保留原有触摸滑动 + 滚动提示，不显示该控件。
 */
export default function ScrollableRow({
  children,
  className,
  scrollClassName,
  thumbClassName,
  hint,
  scrollLeftLabel,
  scrollRightLabel,
  scrollbarPosition = 'bottom',
}: ScrollableRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const [thumbRatio, setThumbRatio] = useState(1) // 滑块宽度占轨道比例
  const [thumbLeft, setThumbLeft] = useState(0) // 滑块 left 百分比
  const [canScroll, setCanScroll] = useState(false) // 是否有溢出（决定是否显示控件）
  const [canLeft, setCanLeft] = useState(false) // 是否还能向左滚
  const [canRight, setCanRight] = useState(false) // 是否还能向右滚

  // 根据容器滚动状态更新滑块与箭头可用性
  const updateScrollbar = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollWidth, clientWidth, scrollLeft } = el
    const maxScroll = scrollWidth - clientWidth
    const hasOverflow = maxScroll > 1
    setCanScroll(hasOverflow)
    if (!hasOverflow) return
    setThumbRatio(clientWidth / scrollWidth)
    setThumbLeft((scrollLeft / scrollWidth) * 100)
    setCanLeft(scrollLeft > 1)
    setCanRight(scrollLeft < maxScroll - 1)
  }, [])

  // 监听滚动和尺寸变化
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollbar()
    el.addEventListener('scroll', updateScrollbar, { passive: true })

    const ro = new ResizeObserver(updateScrollbar)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollbar)
      ro.disconnect()
    }
  }, [updateScrollbar])

  // 点击轨道跳转到对应位置
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    const track = trackRef.current
    if (!el || !track) return

    const trackRect = track.getBoundingClientRect()
    const clickRatio = (e.clientX - trackRect.left) / trackRect.width
    const targetScroll = clickRatio * el.scrollWidth - el.clientWidth / 2
    el.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }

  // 点击箭头翻页（约 80% 视口宽度）
  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  // 拖拽滑块滚动
  const handleThumbDrag = useCallback((startEvent: React.MouseEvent | React.TouchEvent) => {
    startEvent.preventDefault()
    startEvent.stopPropagation()
    const el = scrollRef.current
    const track = trackRef.current
    if (!el || !track) return

    const trackRect = track.getBoundingClientRect()
    const thumbWidth = trackRect.width * (el.clientWidth / el.scrollWidth)
    const draggableWidth = trackRect.width - thumbWidth
    const startX = 'touches' in startEvent ? startEvent.touches[0].clientX : startEvent.clientX
    const startScrollLeft = el.scrollLeft

    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const dx = clientX - startX
      if (draggableWidth <= 0) return
      el.scrollLeft = startScrollLeft + (dx / draggableWidth) * (el.scrollWidth - el.clientWidth)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onUp)
  }, [])

  // 自定义控件 —— 仅桌面端显示，有溢出时才出现
  const control = canScroll ? (
    <div
      className={cn(
        'hidden items-center gap-3 px-6 md:flex',
        scrollbarPosition === 'top' ? 'mb-4' : 'mt-4'
      )}
    >
      {hint && (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-ukraine-blue-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-4 w-4 text-ukraine-gold-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 9l-3 3 3 3M16 9l3 3-3 3M5 12h14"
            />
          </svg>
          {hint}
        </span>
      )}

      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={!canLeft}
        aria-label={scrollLeftLabel}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors',
          canLeft
            ? 'text-ukraine-gold-600 hover:bg-ukraine-gold-100 hover:text-ukraine-gold-700'
            : 'cursor-default text-gray-300'
        )}
      >
        <Chevron dir="left" />
      </button>

      {/* 轨道 */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="group h-2 flex-1 cursor-pointer rounded-full bg-ukraine-gold-100 transition-[height] duration-150 hover:h-2.5"
      >
        {/* 金色药丸滑块 */}
        <div
          onMouseDown={handleThumbDrag}
          onTouchStart={handleThumbDrag}
          className={cn(
            'animate-scrollbar-nudge flex h-full min-w-[2.5rem] cursor-grab items-center justify-center gap-[3px] rounded-full bg-gradient-to-r from-ukraine-gold-400 to-ukraine-gold-500 shadow-[0_1px_4px_rgba(245,184,0,0.5)] active:cursor-grabbing',
            thumbClassName
          )}
          style={{
            width: `${thumbRatio * 100}%`,
            marginLeft: `${thumbLeft}%`,
          }}
        >
          {/* 握把纹：暗示可拖动 */}
          <span className="h-1 w-px rounded-full bg-ukraine-blue-900/25" />
          <span className="h-1.5 w-px rounded-full bg-ukraine-blue-900/30" />
          <span className="h-1 w-px rounded-full bg-ukraine-blue-900/25" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={!canRight}
        aria-label={scrollRightLabel}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors',
          canRight
            ? 'text-ukraine-gold-600 hover:bg-ukraine-gold-100 hover:text-ukraine-gold-700'
            : 'cursor-default text-gray-300'
        )}
      >
        <Chevron dir="right" />
      </button>
    </div>
  ) : null

  return (
    <div className={className}>
      {scrollbarPosition === 'top' && control}
      <div ref={scrollRef} className={cn('scrollbar-hide overflow-x-auto', scrollClassName)}>
        {children}
      </div>
      {scrollbarPosition === 'bottom' && control}
    </div>
  )
}
