'use client'

import Image from 'next/image'

import type { IntroContent, Project7Image, TimelineEvent } from '../types'

interface StorySectionProps {
  title: string
  intro: IntroContent
  timeline: TimelineEvent[]
  /** 各时间线节点首张图在灯箱数组中的下标，与 timeline 等长 */
  startIndices: number[]
  onImageClick: (index: number) => void
}

/**
 * 时间线配图，始终按原始比例缩放（不裁剪）：
 * - 移动端排成统一高度的横向条带，宽度随各自比例伸缩
 * - 桌面端收进正文右侧的窄栏，同节点多图平分栏宽
 * 两种模式都避免了多图纵向堆叠——竖构图照片原先能把单个节点撑到 1300px 以上。
 */
function TimelinePhoto({
  img,
  index,
  onClick,
}: {
  img: Project7Image
  index: number
  onClick: (i: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className="group relative block overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/70 transition-shadow hover:shadow-md md:min-w-0 md:flex-1"
    >
      <Image
        src={img.src}
        alt={img.alt}
        width={img.width}
        height={img.height}
        sizes="(max-width: 768px) 280px, 240px"
        className="h-44 w-auto transition-transform duration-500 group-hover:scale-105 md:h-auto md:w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

function EventList({ event }: { event: TimelineEvent }) {
  if (!event.list || event.list.length === 0) return null

  const label = event.listTitle && (
    <p className="mb-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      {event.listTitle}
    </p>
  )

  // 伤情清单不适合做成"成就 chip"，用克制的双栏列表；进展清单则是短动作短语，chip 更紧凑
  if (event.listTone === 'clinical') {
    return (
      <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-3">
        {label}
        <ul className="gap-x-5 text-sm leading-snug text-slate-700 sm:columns-2">
          {event.list.map((item, i) => (
            <li key={i} className="relative break-inside-avoid py-[3px] pl-3.5">
              <span
                aria-hidden
                className="absolute left-0 top-[10px] h-1 w-1 rounded-full bg-slate-400"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="mt-3">
      {label}
      <ul className="flex flex-wrap gap-1.5">
        {event.list.map((item, i) => (
          <li
            key={i}
            className="rounded-full border border-teal-100 bg-teal-50/70 px-2.5 py-1 text-xs font-medium text-teal-900"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function StorySection({
  title,
  intro,
  timeline,
  startIndices,
  onImageClick,
}: StorySectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-sky-400 to-teal-500" />
        <h2 className="font-display text-lg font-bold text-gray-900 md:text-xl">{title}</h2>
      </div>

      {/* 开篇引言：桌面端引言与正文并排，不再上下堆叠 */}
      <div className="mb-6 rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-teal-50/40 p-4 md:flex md:items-center md:gap-6 md:p-5">
        <p className="font-display text-lg leading-snug text-slate-800 md:flex-[3] md:text-xl">
          {intro.quote}
        </p>
        <div className="md:flex-[2]">
          {intro.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="mt-3 text-sm leading-relaxed text-slate-600 md:mt-0 md:text-[15px]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* 时间线 */}
      <ol className="relative">
        {timeline.map((event, eventIndex) => {
          const isLast = eventIndex === timeline.length - 1
          const images = event.images ?? []
          const startIndex = startIndices[eventIndex] ?? 0

          return (
            <li
              key={event.id}
              id={`p7-story-${event.id}`}
              className={`relative border-l-2 pl-5 md:pl-7 ${
                isLast ? 'border-transparent pb-0' : 'border-sky-100 pb-6 md:pb-7'
              }`}
            >
              {/* 节点圆点 */}
              <span
                aria-hidden
                className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 ring-4 ring-white"
              />

              {/* 时间标记与小标题同行，窄屏自动换行 */}
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span className="font-data text-sm font-bold text-teal-700">{event.marker}</span>
                <h3 className="font-display text-base font-bold text-slate-900 md:text-lg">
                  {event.heading}
                </h3>
              </div>

              <div className="md:flex md:items-start md:gap-5">
                <div className="min-w-0 md:flex-1">
                  {event.paragraphs.map((paragraph, i) => (
                    <p key={i} className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">
                      {paragraph}
                    </p>
                  ))}

                  <EventList event={event} />
                </div>

                {images.length > 0 && (
                  <div className="mt-3 flex gap-2 md:mt-2.5 md:w-60 md:flex-shrink-0">
                    {images.map((img, i) => (
                      <TimelinePhoto
                        key={img.src}
                        img={img}
                        index={startIndex + i}
                        onClick={onImageClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
