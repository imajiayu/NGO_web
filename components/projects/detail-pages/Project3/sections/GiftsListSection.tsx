'use client'

import { useTranslations } from 'next-intl'
import { GiftIcon } from '@/components/icons'
import { GiftListAccordion } from '../components'
import type { SectionProps } from '../types'

interface GiftsListSectionProps extends Pick<SectionProps, 'content'> {
  expandedShelters: Set<number>
  onToggleShelter: (index: number) => void
}

export default function GiftsListSection({
  content,
  expandedShelters,
  onToggleShelter,
}: GiftsListSectionProps) {
  const t = useTranslations('projects')

  if (!content?.giftsList) {
    return null
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-christmas-gold to-amber-500 flex items-center justify-center shadow-md">
          <GiftIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-display text-base md:text-lg font-bold text-gray-900">
            {t('project3.childrenWishes')}
          </h2>
          <p className="text-[10px] md:text-xs text-gray-500">{t('project3.childrenWishesDesc')}</p>
        </div>
      </div>
      <div className="space-y-2">
        {content.giftsList.map((giftList, idx) => (
          <GiftListAccordion
            key={idx}
            giftList={giftList}
            isExpanded={expandedShelters.has(idx)}
            onToggle={() => onToggleShelter(idx)}
          />
        ))}
      </div>
    </section>
  )
}
