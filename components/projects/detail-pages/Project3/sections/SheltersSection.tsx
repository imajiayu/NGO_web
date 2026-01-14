'use client'

import { useTranslations } from 'next-intl'
import { MapPinIcon } from '@/components/icons'
import { ShelterCard } from '../components'
import type { SectionProps } from '../types'

export default function SheltersSection({ content, locale }: SectionProps) {
  const t = useTranslations('projects')

  if (!content?.shelters) {
    return null
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-christmas-berry to-rose-600 flex items-center justify-center shadow-md">
          <MapPinIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-display text-base md:text-lg font-bold text-gray-900">
            {t('project3.visitedFacilities')}
          </h2>
          <p className="text-[10px] md:text-xs text-gray-500">
            {t('project3.visitedFacilitiesDesc')}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {content.shelters.map((shelter, idx) => (
          <ShelterCard key={idx} shelter={shelter} index={idx} />
        ))}
      </div>
    </section>
  )
}
