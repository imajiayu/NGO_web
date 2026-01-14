'use client'

import { useTranslations } from 'next-intl'
import { ChevronDownIcon, GiftIcon } from '@/components/icons'
import type { GiftList } from '../types'

interface GiftListAccordionProps {
  giftList: GiftList
  isExpanded: boolean
  onToggle: () => void
}

export default function GiftListAccordion({
  giftList,
  isExpanded,
  onToggle,
}: GiftListAccordionProps) {
  const t = useTranslations('projects')

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-gradient-to-br from-christmas-cream to-amber-50/50 shadow-md border border-christmas-gold/30' : 'bg-white shadow-sm border border-gray-100 hover:border-christmas-gold/20'}`}
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-gradient-to-br from-christmas-gold to-amber-500 shadow-md' : 'bg-gradient-to-br from-christmas-berry/80 to-rose-500 shadow-sm group-hover:scale-105'}`}
          >
            <GiftIcon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-bold text-sm text-gray-900">{giftList.shelter}</h3>
            <p className="text-[10px] text-gray-500">
              {giftList.children.length} {t('children')}
            </p>
          </div>
        </div>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-christmas-gold/20 rotate-180' : 'bg-gray-100'}`}
        >
          <ChevronDownIcon
            className={`w-4 h-4 ${isExpanded ? 'text-christmas-gold-dark' : 'text-gray-400'}`}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {giftList.children.map((child, childIdx) => (
              <div
                key={childIdx}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/80 border border-christmas-gold/10 hover:border-christmas-gold/30 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-christmas-berry to-rose-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold text-white">{childIdx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-gray-900 truncate">{child.name}</div>
                  <div className="flex items-center gap-0.5 text-[10px] text-gray-500 truncate">
                    <GiftIcon className="w-2.5 h-2.5 text-christmas-gold flex-shrink-0" />
                    <span className="truncate">{child.gift}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
