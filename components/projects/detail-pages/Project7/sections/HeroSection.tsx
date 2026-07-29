'use client'

import { useTranslations } from 'next-intl'

import { ActivityIcon, MapPinIcon } from '@/components/icons'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge'
import ProjectHeroBase from '@/components/projects/shared/ProjectHeroBase'

import type { SectionProps } from '../types'

export default function HeroSection({ content, project }: SectionProps) {
  const t = useTranslations('projects')

  return (
    <ProjectHeroBase
      imageSrc="/images/projects/project-7/hero/bg.webp"
      imageAlt={t('project7.heroImageAlt')}
      heightClass="h-[45vh] min-h-[320px] md:h-[50vh] md:min-h-[380px]"
      // 底图偏亮但不宜整体压暗：遮罩只在底部文字区兜底，向上快速收干净，
      // 文字对比度主要交给下面各行自身的 drop-shadow。
      gradientOverlays={[
        'bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent',
        'bg-gradient-to-r from-sky-950/12 via-transparent to-teal-900/10',
      ]}
      glowEffects={
        <>
          <div className="absolute right-1/4 top-1/4 h-48 w-48 rounded-full bg-sky-300/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-40 w-72 rounded-full bg-teal-200/10 blur-3xl" />
        </>
      }
    >
      {/* Badges */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full bg-teal-600/90 px-2 py-1 shadow-lg backdrop-blur-md">
          <ActivityIcon className="h-3 w-3 text-white" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white md:text-xs">
            {t('project7.badge')}
          </span>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      {/* title 内含 \n 分行；generateMetadata 会把换行还原成 " — " 再进 OG meta */}
      <h1 className="mb-1 whitespace-pre-line font-display text-2xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_10px_rgba(2,6,23,0.95)] md:text-4xl">
        {content.title}
      </h1>
      <p className="max-w-2xl text-sm font-medium text-white drop-shadow-[0_1px_6px_rgba(2,6,23,0.95)] md:text-base">
        {content.subtitle}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-white/90 drop-shadow-[0_1px_5px_rgba(2,6,23,0.9)]">
        <MapPinIcon className="h-3.5 w-3.5" />
        <span className="text-xs md:text-sm">{content.location}</span>
      </div>
    </ProjectHeroBase>
  )
}
