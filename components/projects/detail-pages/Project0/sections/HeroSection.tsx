'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { MapPinIcon, HeartIcon, Building2Icon, ChurchIcon } from '@/components/icons'
import type { SectionProps } from '../types'

export default function HeroSection({ content, locale }: SectionProps) {
  const t = useTranslations('projects')

  const fundingSources = [
    {
      icon: HeartIcon,
      label: t('project0.fundingSources.charities'),
      color: 'from-rose-500/80 to-pink-500/80',
    },
    {
      icon: Building2Icon,
      label: t('project0.fundingSources.corporations'),
      color: 'from-ukraine-blue-500/80 to-ukraine-blue-400/80',
    },
    {
      icon: ChurchIcon,
      label: t('project0.fundingSources.churches'),
      color: 'from-amber-500/80 to-orange-500/80',
    },
  ]

  return (
    <section className="relative h-[40vh] min-h-[280px] md:h-[45vh] md:min-h-[320px] rounded-xl md:rounded-2xl overflow-hidden group">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        <Image
          src="/images/projects/project-0/card/bg.webp"
          alt={t('project0.heroImageAlt')}
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ukraine-blue-900/50 via-transparent to-transparent" />
        {/* Grain Texture */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
        {/* Location & Date Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <MapPinIcon className="w-3 h-3 text-ukraine-gold-400" />
            <span className="text-[10px] md:text-xs text-white/90 font-medium">
              {content.locationDetail || t('project0.location')}
            </span>
          </div>
          <div className="flex items-center px-2 py-1 bg-ukraine-gold-500/20 backdrop-blur-md rounded-full border border-ukraine-gold-400/30">
            <span className="text-[10px] md:text-xs text-ukraine-gold-300 font-medium">
              {t('project0.established')}
            </span>
          </div>
        </div>

        {/* Title with Full Information */}
        <h1 className="font-display text-2xl md:text-4xl font-bold text-white mb-1 leading-[1.1] tracking-tight">
          <span className="block">Way to Health</span>
          <span className="block text-sm md:text-lg font-medium text-ukraine-gold-300 mt-0.5">
            {t('project0.subtitle')}
          </span>
        </h1>
        <p className="text-xs md:text-sm text-white/80 max-w-xl">{content.subtitle}</p>

        {/* Funding Sources - Elegant Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] md:text-xs text-white/60 font-medium">
            {t('project0.fundingSources.title')}:
          </span>
          {fundingSources.map((source, idx) => {
            const Icon = source.icon
            return (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r ${source.color} backdrop-blur-sm rounded-full border border-white/20`}
              >
                <Icon className="w-3 h-3 text-white" />
                <span className="text-[10px] md:text-xs text-white font-medium">
                  {source.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
