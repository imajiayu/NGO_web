'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge'
import { HomeIcon } from '@/components/icons'
import type { Project4Content } from '../types'
import type { ProjectStats } from '@/types'

interface HeroSectionProps {
  content: Project4Content | null
  project: ProjectStats
  locale: string
}

export default function HeroSection({ content, project, locale }: HeroSectionProps) {
  const t = useTranslations('projects')

  return (
    <section className="relative h-[45vh] min-h-[320px] md:h-[50vh] md:min-h-[380px] rounded-xl md:rounded-2xl overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/projects/project-4/card/bg.webp"
          alt={content?.title || 'Family Support Project'}
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
        {/* Warm gradient overlay - earth tones for family warmth */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/90 via-amber-800/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 via-transparent to-amber-700/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        {/* Warm glow accent */}
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-300/40 rounded-full animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-600/90 backdrop-blur-md rounded-full shadow-lg">
            <HomeIcon className="w-3 h-3 text-white" />
            <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">
              {t('project4.familySupport')}
            </span>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl md:text-4xl font-bold text-white mb-1 leading-[1.1] tracking-tight drop-shadow-lg">
          {content?.title || t('project4.defaultTitle')}
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-white/90 max-w-2xl font-light">
          {content?.subtitle || ''}
        </p>

        {/* Location */}
        {content?.location && (
          <div className="flex items-center gap-1.5 mt-2 text-white/70">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs md:text-sm">{content.location}</span>
          </div>
        )}
      </div>
    </section>
  )
}
