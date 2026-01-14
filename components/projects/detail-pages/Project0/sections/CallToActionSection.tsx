'use client'

import { useTranslations } from 'next-intl'
import { HeartIcon } from '@/components/icons'
import type { SectionProps } from '../types'

export default function CallToActionSection({ content }: Pick<SectionProps, 'content'>) {
  const t = useTranslations('projects')

  if (!content.callToAction) {
    return null
  }

  return (
    <section className="pt-4 border-t border-gray-100">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-ukraine-gold-500 to-orange-500 rounded-full mb-3 shadow-md">
          <HeartIcon className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            {t('project0.supportUs')}
          </span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {content.callToAction.title}
        </h2>
        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
          {content.callToAction.content}
        </p>
      </div>

      {/* Purpose Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {content.callToAction.purposes.map((purpose, idx) => (
          <div
            key={idx}
            className="p-4 bg-gradient-to-br from-ukraine-gold-50/80 to-amber-50/50 rounded-xl"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-ukraine-gold-400 to-orange-500 flex items-center justify-center shadow-md">
                <span className="font-display font-bold text-white text-lg">{idx + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-gray-900 text-sm md:text-base mb-1">
                  {purpose.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {purpose.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Closing Statement */}
      <div className="text-center">
        <p className="text-sm md:text-base text-gray-700 leading-relaxed italic max-w-2xl mx-auto">
          "{content.callToAction.closing}"
        </p>
      </div>
    </section>
  )
}
