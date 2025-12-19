'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'

export default function ImpactSection() {
  const t = useTranslations('home.hero.impact')

  const stats = [
    {
      key: 'donations',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-green-400 to-emerald-600'
    },
    {
      key: 'people',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-blue-400 to-indigo-600'
    },
    {
      key: 'shelters',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: 'from-purple-400 to-pink-600'
    }
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/3.webp"
          alt="Impact"
          fill
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/85 to-pink-900/90" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full mb-6">
            {t('label')}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            {t('title')}
          </h2>
          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map(({ key, icon, color }) => (
            <div
              key={key}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full min-h-[280px] flex flex-col p-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl hover:bg-white/15 transition-all duration-500 transform hover:scale-105">
                {/* Icon */}
                <div className={`inline-flex p-4 bg-gradient-to-br ${color} rounded-2xl text-white mb-6 shadow-xl w-fit`}>
                  {icon}
                </div>

                {/* Value */}
                <div className="text-5xl sm:text-6xl font-bold text-white mb-3 tracking-tight">
                  {t(`${key}.value` as any)}
                </div>

                {/* Label */}
                <div className="text-lg sm:text-xl text-white/80 font-medium leading-snug">
                  {t(`${key}.label` as any)}
                </div>

                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
