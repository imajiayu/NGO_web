'use client'

import { useTranslations } from 'next-intl'

import { HeartIcon, MapPinIcon } from '@/components/icons'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge'
import ProjectHeroBase from '@/components/projects/shared/ProjectHeroBase'

import type { SectionProps } from '../types'

export default function HeroSection({ content, project }: SectionProps) {
  const t = useTranslations('projects')

  return (
    <ProjectHeroBase
      imageSrc="/images/projects/project-6/card/bg.webp"
      imageAlt={t('project6.heroImageAlt')}
      heightClass="h-[45vh] min-h-[320px] md:h-[50vh] md:min-h-[380px]"
      gradientOverlays={[
        'bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent',
        'bg-gradient-to-r from-rose-900/15 via-transparent to-slate-900/15',
      ]}
      glowEffects={
        <>
          <div className="absolute right-1/4 top-1/4 h-48 w-48 rounded-full bg-rose-300/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-40 w-72 rounded-full bg-amber-200/10 blur-3xl" />
        </>
      }
    >
      {/* Badges */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full bg-rose-500/90 px-2 py-1 shadow-lg backdrop-blur-md">
          <HeartIcon className="h-3 w-3 text-white" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white md:text-xs">
            {t('project6.badge')}
          </span>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <h1 className="mb-1 font-display text-2xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-lg md:text-4xl">
        {content.title}
      </h1>
      <p className="max-w-2xl text-sm font-light text-white/95 drop-shadow-md md:text-base">
        {content.subtitle}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-white/85 drop-shadow-md">
        <MapPinIcon className="h-3.5 w-3.5" />
        <span className="text-xs md:text-sm">{content.location}</span>
      </div>
    </ProjectHeroBase>
  )
}
