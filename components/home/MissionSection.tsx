'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'

export default function MissionSection() {
  const t = useTranslations('home.hero.mission')

  return (
    <section className="relative min-h-screen md:flex md:items-center md:justify-center overflow-hidden py-4 md:py-0">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/1.webp"
          alt="Mission"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center text-white pt-4 md:pt-0 pb-4 md:pb-0">
        {/* Label */}
        <div className="mb-4 md:mb-6">
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
            {t('label')}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
          {t('title')}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 max-w-4xl mx-auto mb-6 md:mb-12 leading-relaxed">
          {t('subtitle')}
        </p>

        {/* Who We Help */}
        <div className="mt-8 md:mt-16">
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 md:mb-8 text-white/90">
            {t('who')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              { key: 'displaced', image: '/images/mission/displaced.webp' },
              { key: 'women', image: '/images/mission/women.webp' },
              { key: 'civilians', image: '/images/mission/civilians.webp' }
            ].map(({ key, image }) => (
              <div
                key={key}
                className="group relative overflow-hidden rounded-2xl border-2 border-white/30 hover:border-white/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl h-64"
              >
                {/* Background Image */}
                <Image
                  src={image}
                  alt={t(key as 'displaced' | 'women' | 'civilians')}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40 group-hover:from-black/70 group-hover:via-black/50 group-hover:to-black/30 transition-all duration-500" />

                {/* Content */}
                <div className="absolute inset-0 flex items-end justify-center p-6">
                  <p className="text-lg sm:text-xl font-bold text-white leading-tight text-center">
                    {t(key as 'displaced' | 'women' | 'civilians')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <svg
          className="w-6 h-6 text-white/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  )
}
