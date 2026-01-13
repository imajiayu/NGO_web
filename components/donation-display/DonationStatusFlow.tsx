'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2Icon } from '@/components/icons'
import { MAIN_FLOW_STATUSES } from '@/lib/donation-status'

interface DonationStatusFlowProps {
  className?: string
}

// UI display stage keys (for i18n translation lookup, not business status values)
const MAIN_STAGE_KEYS = MAIN_FLOW_STATUSES
const REFUND_STAGE_KEYS = ['refund_pending', 'refund_done'] as const

export default function DonationStatusFlow({ className = '' }: DonationStatusFlowProps) {
  const t = useTranslations('donationStatusFlow')

  return (
    <div className={`w-full ${className}`}>
      {/* 两行布局 */}
      <div className="relative pb-1">
        {/* 第一行：主流程 */}
        <div className="relative flex items-start justify-between mb-28 sm:mb-32 md:mb-24">
          {MAIN_STAGE_KEYS.map((stageKey, index) => (
            <div key={stageKey} className="flex flex-col items-center flex-1 relative">
              {/* 连接线 */}
              {index < MAIN_STAGE_KEYS.length - 1 && (
                <div
                  className="absolute top-3 left-1/2 w-full h-0.5 bg-life-500"
                  style={{ zIndex: 0 }}
                />
              )}
              {/* 图标 */}
              <div className="relative z-10 bg-gradient-to-br from-life-50 to-white rounded-full p-2 border border-life-200 shadow-sm">
                <CheckCircle2Icon className="w-5 h-5 text-life-600" />
              </div>
              {/* 标题 */}
              <div className="mt-2 text-center px-1 text-gray-700">
                <div className="text-xs sm:text-sm font-medium break-words">
                  {t(`stages.${stageKey}.title`)}
                </div>
                <div className="text-xs text-gray-500 mt-1 break-words">
                  {t(`stages.${stageKey}.timeframe`)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 第二行：退款流程 */}
        <div className="absolute top-28 sm:top-32 md:top-24 left-0 right-0">
          <div className="relative flex items-start">
            {/* refund_pending */}
            <div className="flex flex-col items-center flex-1 relative">
              <div className="relative z-10 bg-gradient-to-br from-warm-50 to-white rounded-full p-2 border border-warm-200 shadow-sm">
                <CheckCircle2Icon className="w-5 h-5 text-warm-600" />
              </div>
              <div className="mt-2 text-center px-1 text-gray-700">
                <div className="text-xs sm:text-sm font-medium break-words">
                  {t('stages.refund_pending.title')}
                </div>
                <div className="text-xs text-gray-500 mt-1 break-words">
                  {t('stages.refund_pending.timeframe')}
                </div>
              </div>
            </div>

            <div className="flex-1" />

            {/* refund_done */}
            <div className="flex flex-col items-center flex-1 relative">
              <div
                className="absolute top-3 right-1/2 w-[200%] h-0.5 bg-warm-500"
                style={{ zIndex: 0 }}
              />
              <div className="relative z-10 bg-gradient-to-br from-warm-50 to-white rounded-full p-2 border border-warm-200 shadow-sm">
                <CheckCircle2Icon className="w-5 h-5 text-warm-600" />
              </div>
              <div className="mt-2 text-center px-1 text-gray-700">
                <div className="text-xs sm:text-sm font-medium break-words">
                  {t('stages.refund_done.title')}
                </div>
                <div className="text-xs text-gray-500 mt-1 break-words">
                  {t('stages.refund_done.timeframe')}
                </div>
              </div>
            </div>

            <div className="flex-1" />
          </div>
        </div>
      </div>

      {/* 描述卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 sm:mt-14 md:mt-12">
        {MAIN_STAGE_KEYS.map((stageKey) => (
          <div key={stageKey} className="p-4 rounded-lg border border-life-200 bg-life-50/30">
            <h4 className="font-semibold mb-2 text-life-800 font-display">
              {t(`stages.${stageKey}.title`)}
            </h4>
            <p className="text-sm text-gray-600">{t(`stages.${stageKey}.description`)}</p>
          </div>
        ))}

        {REFUND_STAGE_KEYS.map((stageKey) => (
          <div key={stageKey} className="p-4 rounded-lg border border-warm-200 bg-warm-50">
            <h4 className="font-semibold mb-2 text-warm-800 font-display">
              {t(`stages.${stageKey}.title`)}
            </h4>
            <p className="text-sm text-gray-600">{t(`stages.${stageKey}.description`)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
