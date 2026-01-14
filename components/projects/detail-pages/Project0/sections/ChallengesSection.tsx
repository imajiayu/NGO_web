'use client'

import { useTranslations } from 'next-intl'
import type { SectionProps } from '../types'

export default function ChallengesSection({ content }: Pick<SectionProps, 'content'>) {
  const t = useTranslations('projects')

  const challengeStats = [
    { value: '30', label: t('project0.challenges.centers') },
    { value: '27K', label: t('project0.challenges.patientsPerYear') },
    { value: '360K', label: t('project0.challenges.injured') },
    { value: '13.5', label: t('project0.challenges.yearsWait') },
  ]

  return (
    <section className="py-4 md:py-5 px-4 md:px-5 -mx-4 md:-mx-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl md:rounded-2xl overflow-hidden relative">
      <div className="relative z-10">
        <h2 className="font-display text-base md:text-lg font-bold text-white mb-2">
          {content.challenges.title}
        </h2>
        <p className="text-xs md:text-sm text-gray-300 leading-relaxed mb-4">
          {content.challenges.content[0]}
        </p>

        {/* Challenge Stats Grid */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4">
          {challengeStats.map((item, idx) => (
            <div
              key={idx}
              className="text-center p-2 md:p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="font-data text-lg md:text-2xl font-bold text-red-400">
                {item.value}
              </div>
              <div className="text-[10px] md:text-xs text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>

        <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
          {content.challenges.content[2]}
        </p>
      </div>
    </section>
  )
}
