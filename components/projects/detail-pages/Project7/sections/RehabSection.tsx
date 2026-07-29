'use client'

import Image from 'next/image'

import { CalendarIcon } from '@/components/icons'

import type { RehabContent } from '../types'

interface RehabSectionProps {
  rehab: RehabContent
  onImageClick: (index: number) => void
}

export default function RehabSection({ rehab, onImageClick }: RehabSectionProps) {
  // gallery 本身就是该区块灯箱的图片数组，位置下标即灯箱下标
  const { costs, gallery } = rehab

  return (
    <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-teal-400 to-sky-500" />
        <h2 className="font-display text-lg font-bold text-gray-900 md:text-xl">{rehab.title}</h2>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
        {rehab.description}
      </p>

      {/* 康复周期 */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-teal-100 bg-teal-50/50 px-3.5 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          <CalendarIcon className="h-3.5 w-3.5" />
          {rehab.period.label}
        </span>
        <span className="font-data text-sm font-bold text-slate-900">{rehab.period.value}</span>
        <span className="rounded-full bg-teal-600/10 px-2 py-0.5 font-data text-xs font-semibold text-teal-800">
          {rehab.period.duration}
        </span>
      </div>

      {/* 康复目标 */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: rehab.goals.shortTermLabel, text: rehab.goals.shortTerm },
          { label: rehab.goals.longTermLabel, text: rehab.goals.longTerm },
        ].map((goal) => (
          <div
            key={goal.label}
            className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5"
          >
            <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {goal.label}
            </p>
            <p className="text-sm leading-relaxed text-slate-700">{goal.text}</p>
          </div>
        ))}
      </div>

      {/* 康复现场照片：整组展示，不与下方疗法一一对应。
          四张照片比例不一（三张 0.53 竖幅 + 一张 0.75），等宽网格会高低参差，
          因此改成统一高度、宽度随比例伸缩的横向条带——仍是原始比例，不裁剪。 */}
      {gallery.length > 0 && (
        <div className="-mx-1 mb-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 sm:gap-3 sm:overflow-visible">
          {gallery.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => onImageClick(i)}
              className="group relative block flex-shrink-0 snap-start overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70 transition-shadow hover:shadow-md"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="200px"
                className="h-40 w-auto transition-transform duration-500 group-hover:scale-105 sm:h-56 lg:h-64"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* 疗法卡片：只剩名称与次数，桌面端一行铺开 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {rehab.therapies.map((therapy) => (
          <article
            key={therapy.name}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/60 px-2.5 py-3 text-center shadow-sm"
          >
            <h3 className="font-display text-sm font-bold leading-snug text-slate-900">
              {therapy.name}
            </h3>
            <span className="rounded-full bg-teal-600/10 px-2 py-0.5 font-data text-xs font-semibold text-teal-800">
              {therapy.sessions}
              {costs.sessionsUnit}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
