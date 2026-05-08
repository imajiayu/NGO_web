'use client'

import Image from 'next/image'
import { Fragment } from 'react'

import { Building2Icon, HeartIcon, MapPinIcon, SparklesIcon } from '@/components/icons'

import type {
  BundleItem,
  BundleItemType,
  IntroductionContent,
  IntroImage,
  IntroStat,
  IntroStatType,
} from '../types'

interface IntroductionSectionProps {
  introduction: IntroductionContent
  onImageClick: (flatIndex: number) => void
}

interface ImageButtonProps {
  img: IntroImage
  className?: string
  imgSizes?: string
  index: number
  onClick: (i: number) => void
}

const STAT_ICON_MAP: Record<IntroStatType, React.ComponentType<{ className?: string }>> = {
  shelter: Building2Icon,
  location: MapPinIcon,
  mothers: HeartIcon,
  children: SparklesIcon,
}

const STAT_PALETTE = {
  rose: {
    card: 'border-rose-200/70 bg-gradient-to-br from-rose-100/95 via-rose-50 to-amber-50/40',
    iconBox: 'bg-gradient-to-br from-rose-500 to-rose-600',
    eyebrow: 'text-rose-700/75',
    primary: 'text-rose-900',
    secondary: 'text-rose-700/70',
    glow: 'bg-rose-200/50',
  },
  amber: {
    card: 'border-amber-300/60 bg-gradient-to-br from-amber-100/95 via-amber-50 to-rose-50/40',
    iconBox: 'bg-gradient-to-br from-amber-500 to-amber-600',
    eyebrow: 'text-amber-800/75',
    primary: 'text-amber-950',
    secondary: 'text-amber-800/70',
    glow: 'bg-amber-200/50',
  },
} as const

const STAT_COLOR_BY_INDEX = ['rose', 'amber', 'rose', 'amber'] as const

function StatCard({ stat, colorIndex }: { stat: IntroStat; colorIndex: number }) {
  const Icon = STAT_ICON_MAP[stat.type]
  const palette = STAT_PALETTE[STAT_COLOR_BY_INDEX[colorIndex % 4]]
  const isNumeric = stat.type === 'mothers' || stat.type === 'children'

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:shadow-md md:rounded-2xl md:p-4 ${palette.card}`}
    >
      <div
        aria-hidden
        className={`absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl ${palette.glow}`}
      />

      <div className="relative flex h-full flex-col">
        <div className="mb-2.5 flex items-center justify-between md:mb-3.5">
          <span
            className={`font-display text-[10px] uppercase tracking-[0.22em] md:text-[11px] ${palette.eyebrow}`}
          >
            {stat.label}
          </span>
          <div
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:scale-105 md:h-9 md:w-9 ${palette.iconBox}`}
          >
            <Icon className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
          </div>
        </div>

        <div className="flex-1">
          {isNumeric ? (
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-display text-4xl font-bold leading-[0.9] md:text-5xl ${palette.primary}`}
              >
                {stat.primary}
              </span>
              {stat.secondary && (
                <span
                  className={`text-[11px] font-medium tracking-wide md:text-xs ${palette.secondary}`}
                >
                  {stat.secondary}
                </span>
              )}
            </div>
          ) : (
            <>
              <div
                className={`font-display text-base font-semibold leading-tight md:text-lg ${palette.primary}`}
              >
                {stat.primary}
              </div>
              {stat.secondary && (
                <div className={`mt-1 text-[11px] leading-snug md:text-xs ${palette.secondary}`}>
                  {stat.secondary}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  )
}

function ImageButton({ img, className = '', imgSizes, index, onClick }: ImageButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className={`group relative overflow-hidden bg-stone-100 transition-shadow hover:shadow-md ${className}`}
    >
      <Image
        src={img.src}
        alt={img.alt}
        fill
        sizes={imgSizes ?? '(max-width: 768px) 50vw, 25vw'}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </button>
  )
}

// ───────────────────────────────────────────────
// Bundle item icons (inline, line-style, 1.5px)
// ───────────────────────────────────────────────

function BundleFoodIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 7c2-2 5-2 6 0 1 2 0 7-2 10-2 2-3 2-4 0-1 2-2 2-4 0-2-3-3-8-2-10 1-2 4-2 6 0z" />
      <path d="M12 7V4" />
      <path d="M14 5c0-1 1-2 2-2" />
    </svg>
  )
}

function BundleHygieneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 3c-3 4-6 8-6 12a6 6 0 0 0 12 0c0-4-3-8-6-12z" />
      <path d="M9.5 14a3 3 0 0 0 2 3" />
    </svg>
  )
}

function BundleClothingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M8 4l-4 3 1.5 3 2.5-1v11h12V9l2.5 1L22 7l-4-3" />
      <path d="M8 4c0 2 2 4 4 4s4-2 4-4" />
    </svg>
  )
}

function BundleDetergentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="9" cy="14" r="4.5" />
      <circle cx="16.5" cy="9" r="2.5" />
      <circle cx="17" cy="17.5" r="2" />
    </svg>
  )
}

const BUNDLE_ICON_MAP: Record<BundleItemType, React.ComponentType<{ className?: string }>> = {
  food: BundleFoodIcon,
  hygiene: BundleHygieneIcon,
  clothing: BundleClothingIcon,
  detergent: BundleDetergentIcon,
}

function BundleItemCard({ item, index }: { item: BundleItem; index: number }) {
  const Icon = BUNDLE_ICON_MAP[item.type]
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-rose-200/60 bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 p-3.5 transition-all duration-300 hover:border-rose-300/70 hover:shadow-md md:rounded-2xl md:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-rose-200/30 blur-2xl"
      />
      <div className="relative flex flex-col gap-3 md:gap-3.5">
        <div className="flex items-center justify-between">
          <span className="font-display text-[10px] uppercase tracking-[0.22em] text-rose-700/55 md:text-[11px]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 text-rose-600 transition-transform group-hover:scale-105 md:h-10 md:w-10">
            <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" />
          </div>
        </div>
        <p className="font-display text-sm font-semibold leading-snug text-stone-800 md:text-[15px]">
          {item.label}
        </p>
      </div>
    </article>
  )
}

// ───────────────────────────────────────────────
// Hardship paragraph: highlight monetary range
// matches "$100–200", "$100-200", "100–200 美元", "100-200 美元"
// ───────────────────────────────────────────────

const HARDSHIP_HIGHLIGHT = /(\$\d+[–-]\d+|\d+[–-]\d+\s*美元)/g

function renderHardshipParagraph(text: string) {
  const parts = text.split(HARDSHIP_HIGHLIGHT)
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span
          key={i}
          className="mx-0.5 inline-block whitespace-nowrap rounded bg-rose-100/80 px-1.5 py-px font-display font-semibold text-rose-800"
        >
          {part}
        </span>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

// ───────────────────────────────────────────────

export default function IntroductionSection({
  introduction,
  onImageClick,
}: IntroductionSectionProps) {
  const { stats, paragraphs, bundle, closingCaption, images } = introduction

  // Lightbox flat indices match the order in Project6/index.tsx:
  // opening, ...arrival, bedroomHero, ...bedroomDetails, ...daily, ...closing
  const idxOpening = 0
  const idxArrival = [1]
  const idxBedroomHero = 2
  const idxBedroomDetails = [3]
  const idxDaily = [4, 5, 6, 7, 8, 9, 10, 11]
  const idxClosing = [12, 13, 14]

  return (
    <section className="relative overflow-hidden rounded-xl border border-rose-100/70 bg-gradient-to-br from-rose-50/90 via-stone-50 to-amber-50/70 shadow-sm md:rounded-3xl">
      {/* Paper grain backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(120, 53, 90, 0.7) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
      />
      {/* Soft corner glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-rose-200/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-200/25 blur-3xl"
      />

      <div className="relative p-5 md:p-9">
        {/* STATS — 4-up dossier */}
        <div className="mb-6 grid grid-cols-2 gap-2 md:mb-9 md:grid-cols-4 md:gap-3">
          {stats.map((s, i) => (
            <StatCard key={s.type} stat={s} colorIndex={i} />
          ))}
        </div>

        {/* OPENING — full-bleed lead image */}
        <ImageButton
          img={images.opening}
          index={idxOpening}
          onClick={onImageClick}
          className="mb-6 block aspect-[3/2] w-full rounded-xl md:mb-7 md:aspect-[16/8] md:rounded-2xl"
          imgSizes="100vw"
        />

        {/* ─── BLOCK A: 背景叙事 (drop cap) + arrival 单图 ─── */}
        <div className="mb-6 grid gap-4 md:mb-9 md:grid-cols-12 md:gap-6">
          <p className="font-body text-[15px] leading-[1.7] text-stone-700 first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-display first-letter:text-[2.85em] first-letter:font-bold first-letter:leading-[0.92] first-letter:text-rose-700 md:col-span-7 md:text-base md:leading-[1.75] md:first-letter:mr-2.5 md:first-letter:text-[3.2em]">
            {paragraphs[0]}
          </p>
          <ImageButton
            img={images.arrival[0]}
            index={idxArrival[0]}
            onClick={onImageClick}
            className="aspect-[4/3] rounded-lg md:col-span-5 md:aspect-auto md:rounded-xl"
            imgSizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>

        {/* ─── BLOCK B: bedroomHero 全宽 ─── */}
        <ImageButton
          img={images.bedroomHero}
          index={idxBedroomHero}
          onClick={onImageClick}
          className="mb-6 block aspect-[16/9] w-full rounded-xl md:mb-4 md:rounded-2xl"
          imgSizes="100vw"
        />

        {/* ─── BLOCK C: 基础保障 card + bedroomDetails (mobile: card 先, desktop: image 左) ─── */}
        <div className="mb-6 grid gap-4 md:mb-9 md:grid-cols-12 md:gap-6">
          <div className="relative overflow-hidden rounded-xl border border-amber-200/60 bg-white/55 p-4 backdrop-blur-sm md:col-span-7 md:order-2 md:rounded-2xl md:p-5">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/35 blur-2xl"
            />
            <p className="relative font-body text-[15px] leading-[1.7] text-stone-700 md:text-base md:leading-[1.75]">
              {paragraphs[1]}
            </p>
          </div>
          <ImageButton
            img={images.bedroomDetails[0]}
            index={idxBedroomDetails[0]}
            onClick={onImageClick}
            className="aspect-[16/9] rounded-lg md:col-span-5 md:order-1 md:aspect-auto md:rounded-xl"
            imgSizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>

        {/* ─── BLOCK D: 公共空间 bento (8 张) ─── */}
        <div className="mb-6 grid grid-cols-2 gap-2 [grid-auto-rows:6.5rem] md:mb-10 md:grid-cols-4 md:gap-3 md:[grid-auto-rows:9.5rem]">
          {/* kitchen — 大主图 (2x2) */}
          <ImageButton
            img={images.daily[4]}
            index={idxDaily[4]}
            onClick={onImageClick}
            className="col-span-2 row-span-2 rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* kitchen-1 — 紧邻 kitchen */}
          <ImageButton
            img={images.daily[3]}
            index={idxDaily[3]}
            onClick={onImageClick}
            className="rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* shoe-rack */}
          <ImageButton
            img={images.daily[7]}
            index={idxDaily[7]}
            onClick={onImageClick}
            className="rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* living-room — 横幅 (2x1) */}
          <ImageButton
            img={images.daily[0]}
            index={idxDaily[0]}
            onClick={onImageClick}
            className="col-span-2 rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* yard */}
          <ImageButton
            img={images.daily[5]}
            index={idxDaily[5]}
            onClick={onImageClick}
            className="rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* yard-1 */}
          <ImageButton
            img={images.daily[6]}
            index={idxDaily[6]}
            onClick={onImageClick}
            className="rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* living-room-2 */}
          <ImageButton
            img={images.daily[1]}
            index={idxDaily[1]}
            onClick={onImageClick}
            className="rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* living-room-3 */}
          <ImageButton
            img={images.daily[2]}
            index={idxDaily[2]}
            onClick={onImageClick}
            className="rounded-lg md:rounded-xl"
            imgSizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>

        {/* ─── BLOCK E: 经济困境引述 (editorial quote, 数字高亮) ─── */}
        <figure className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-rose-50/85 via-white to-transparent py-4 pl-6 pr-4 md:mb-9 md:rounded-2xl md:py-6 md:pl-9 md:pr-6">
          <span
            aria-hidden
            className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-rose-300 via-rose-500 to-amber-400 md:top-5 md:bottom-5"
          />
          <span
            aria-hidden
            className="absolute left-3 top-2 font-display text-3xl leading-none text-rose-300/70 md:left-4 md:top-3 md:text-5xl"
          >
            “
          </span>
          <blockquote className="relative font-body text-[15px] leading-[1.75] text-stone-700 md:text-[17px] md:leading-[1.8]">
            {renderHardshipParagraph(paragraphs[2])}
          </blockquote>
        </figure>

        {/* ─── BLOCK F: 项目物资清单 (intro + 4 张 item 卡) ─── */}
        <div className="mb-6 md:mb-9">
          <div className="mb-4 flex items-start gap-3 md:mb-5 md:gap-4">
            <span
              aria-hidden
              className="mt-2 hidden h-px w-10 flex-shrink-0 bg-gradient-to-r from-rose-400 to-rose-300/0 md:mt-3 md:block md:w-16"
            />
            <p className="max-w-2xl font-body text-[15px] leading-[1.7] text-stone-700 md:text-base md:leading-[1.75]">
              {bundle.intro}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {bundle.items.map((item, i) => (
              <BundleItemCard key={item.type} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* ─── BLOCK G: closing 三联 + caption (mobile: horizontal snap scroll) ─── */}
        <figure>
          <figcaption className="mb-2.5 flex items-center gap-3 md:mb-3.5">
            <span
              aria-hidden
              className="h-px w-8 flex-shrink-0 bg-gradient-to-r from-rose-400 to-rose-300/0 md:w-12"
            />
            <span className="font-display text-[11px] font-medium text-rose-800/80 md:text-xs">
              {closingCaption}
            </span>
          </figcaption>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3">
            {images.closing.map((img, i) => (
              <ImageButton
                key={i}
                img={img}
                index={idxClosing[i]}
                onClick={onImageClick}
                className="aspect-[16/9] rounded-lg md:aspect-[4/3] md:rounded-xl"
                imgSizes="(max-width: 768px) 100vw, 25vw"
              />
            ))}
          </div>
        </figure>
      </div>
    </section>
  )
}
