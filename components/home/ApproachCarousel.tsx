'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

type Card = {
  image: string
  objectPosition: string
  accentText: string
  accentBar: string
  title: string
  summary: string
}

export default function ApproachCarousel({
  sectionTitle,
  titleSizeClass,
  cards,
}: {
  sectionTitle: string
  titleSizeClass: string
  cards: Card[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const pausedUntilRef = useRef(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (!window.matchMedia('(max-width: 639px)').matches) return

    const tick = () => {
      if (Date.now() < pausedUntilRef.current) return
      indexRef.current = (indexRef.current + 1) % cards.length
      const cardWidth = el.offsetWidth * 0.8
      el.scrollTo({ left: cardWidth * indexRef.current, behavior: 'smooth' })
    }

    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [cards.length])

  const handleTouchStart = () => {
    // 用户触摸后暂停 2s
    pausedUntilRef.current = Date.now() + 2000
  }

  return (
    <section className="relative overflow-hidden bg-black sm:bg-transparent">
      {/* 标题：绝对定位叠于图片顶部，全端统一（移动右对齐，平板居中，桌面左对齐） */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-6 text-right sm:px-6 sm:pt-10 sm:text-center lg:px-12 lg:pt-14 lg:text-left">
        <h2
          className={`font-display text-4xl font-bold text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] sm:text-5xl ${titleSizeClass}`}
        >
          {sectionTitle}
        </h2>
      </div>

      {/* 卡片容器：移动横向滑动80vw/卡无缝无圆角，平板三列网格，桌面三列全宽无缝 */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto sm:grid sm:grid-cols-3 sm:snap-none sm:overflow-visible sm:gap-6 sm:px-6 lg:gap-0 lg:px-0"
        onTouchStart={handleTouchStart}
      >
        {cards.map(({ image, objectPosition, accentText, accentBar, title, summary }) => (
          <div
            key={image}
            className="relative h-[300px] w-[80vw] shrink-0 snap-start [&:last-child]:snap-end overflow-hidden sm:w-auto sm:rounded-3xl sm:shadow-lg lg:h-[400px] lg:rounded-none lg:shadow-none"
          >
            <Image
              src={image}
              alt={title}
              fill
              className={`object-cover ${objectPosition}`}
              sizes="(max-width: 639px) 85vw, (max-width: 1023px) 32vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

            <div className="relative z-10 flex h-full flex-col justify-end p-6 lg:p-9">
              <div className="flex items-center gap-3">
                <span
                  className={`h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b lg:h-9 ${accentBar}`}
                />
                <h3
                  className={`font-display text-3xl font-bold tracking-tight [text-shadow:0_2px_14px_rgba(0,0,0,0.9)] lg:text-4xl ${accentText}`}
                >
                  {title}
                </h3>
              </div>
              {/* summary 以空行（\n\n）分句、单换行（\n）拆句内行：
                  句间用 space-y 留出更大行距，句内由 whitespace-pre-line 保持紧凑 */}
              <div className="mt-3.5 max-w-sm space-y-2 lg:mt-4 lg:space-y-2.5">
                {summary.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className="whitespace-pre-line text-base font-normal leading-relaxed text-gray-100 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] lg:text-xl"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
