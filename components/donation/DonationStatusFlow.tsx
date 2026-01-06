'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2Icon, CircleIcon, ClockIcon } from '@/components/icons'

type DonationStatus = 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded'

interface DonationStatusFlowProps {
  currentStatus?: DonationStatus
  className?: string
}

const mainFlow: DonationStatus[] = ['paid', 'confirmed', 'delivering', 'completed']
const refundFlow: DonationStatus[] = ['refunding', 'refunded']

export default function DonationStatusFlow({
  currentStatus,
  className = '',
}: DonationStatusFlowProps) {
  const t = useTranslations('donationStatusFlow')

  const isRefundStatus = currentStatus === 'refunding' || currentStatus === 'refunded'
  const getMainFlowIndex = (status: DonationStatus) => mainFlow.indexOf(status)
  const currentMainIndex = currentStatus && !isRefundStatus ? getMainFlowIndex(currentStatus) : -1

  const getStatusIcon = (status: DonationStatus, flowType: 'main' | 'refund') => {
    // If no current status, show process flow with colored checkmarks
    if (!currentStatus) {
      if (flowType === 'main') {
        return <CheckCircle2Icon className="w-6 h-6 text-green-600" />
      } else {
        return <CheckCircle2Icon className="w-6 h-6 text-red-500" />
      }
    }

    // With current status, show actual progress
    if (currentStatus === status) {
      return <ClockIcon className="w-6 h-6 text-blue-600 animate-pulse" />
    }

    // For main flow
    if (mainFlow.includes(status)) {
      const statusIndex = getMainFlowIndex(status)
      if (currentMainIndex >= 0 && statusIndex < currentMainIndex) {
        return <CheckCircle2Icon className="w-6 h-6 text-green-600" />
      }
    }

    // For refund flow
    if (refundFlow.includes(status) && isRefundStatus) {
      const refundIndex = refundFlow.indexOf(status)
      const currentRefundIndex = refundFlow.indexOf(currentStatus)
      if (refundIndex < currentRefundIndex) {
        return <CheckCircle2Icon className="w-6 h-6 text-green-600" />
      }
    }

    return <CircleIcon className="w-6 h-6 text-gray-300" />
  }

  const getStatusColor = (status: DonationStatus) => {
    if (!currentStatus) return 'text-gray-700'
    if (currentStatus === status) return 'text-blue-700 font-semibold'

    // Check if completed in main flow
    if (mainFlow.includes(status) && currentMainIndex >= 0) {
      const statusIndex = getMainFlowIndex(status)
      if (statusIndex < currentMainIndex) return 'text-green-700'
    }

    // Check if completed in refund flow
    if (refundFlow.includes(status) && isRefundStatus) {
      const refundIndex = refundFlow.indexOf(status)
      const currentRefundIndex = refundFlow.indexOf(currentStatus)
      if (refundIndex < currentRefundIndex) return 'text-green-700'
    }

    return 'text-gray-400'
  }

  const getLineColor = (fromIndex: number, toIndex: number, flow: 'main' | 'refund' = 'main') => {
    // If no current status, show process flow with colored lines
    if (!currentStatus) {
      return flow === 'main' ? 'bg-green-500' : 'bg-red-500'
    }

    if (flow === 'main' && currentMainIndex >= 0) {
      if (toIndex <= currentMainIndex) return 'bg-green-500'
    }

    if (flow === 'refund' && isRefundStatus) {
      const currentRefundIndex = refundFlow.indexOf(currentStatus)
      if (toIndex <= currentRefundIndex) return 'bg-green-500'
    }

    return 'bg-gray-300'
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Two-row layout */}
      <div className="relative pb-1">
        {/* Row 1: Main Flow */}
        <div className="relative flex items-start justify-between mb-28 sm:mb-32 md:mb-24">
          {mainFlow.map((status, index) => (
            <div key={status} className="flex flex-col items-center flex-1 relative">
              {/* Connection Line to next status */}
              {index < mainFlow.length - 1 && (
                <div
                  className={`absolute top-3 left-1/2 w-full h-0.5 ${getLineColor(index, index + 1, 'main')} transition-colors duration-500`}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Status Icon */}
              <div className="relative z-10 bg-white rounded-full p-1">
                {getStatusIcon(status, 'main')}
              </div>

              {/* Status Title */}
              <div className={`mt-2 text-center px-1 ${getStatusColor(status)}`}>
                <div className="text-xs sm:text-sm font-medium break-words">{t(`stages.${status}.title`)}</div>
                <div className="text-xs text-gray-500 mt-1 break-words">{t(`stages.${status}.timeframe`)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Refund Flow (aligned with paid and delivering) */}
        <div className="absolute top-28 sm:top-32 md:top-24 left-0 right-0">
          <div className="relative flex items-start">
            {/* Position refunding under paid (index 0) */}
            <div className="flex flex-col items-center flex-1 relative">
              <div className="relative z-10 bg-white rounded-full p-1">
                {getStatusIcon('refunding', 'refund')}
              </div>
              <div className={`mt-2 text-center px-1 ${getStatusColor('refunding')}`}>
                <div className="text-xs sm:text-sm font-medium break-words">{t('stages.refunding.title')}</div>
                <div className="text-xs text-gray-500 mt-1 break-words">{t('stages.refunding.timeframe')}</div>
              </div>
            </div>

            {/* Spacer for confirmed position */}
            <div className="flex-1"></div>

            {/* Position refunded under delivering (index 2) */}
            <div className="flex flex-col items-center flex-1 relative">
              {/* Connection line from refunding to refunded */}
              <div
                className={`absolute top-3 right-1/2 w-[200%] h-0.5 ${getLineColor(0, 1, 'refund')} transition-colors duration-500`}
                style={{ zIndex: 0 }}
              />

              <div className="relative z-10 bg-white rounded-full p-1">
                {getStatusIcon('refunded', 'refund')}
              </div>
              <div className={`mt-2 text-center px-1 ${getStatusColor('refunded')}`}>
                <div className="text-xs sm:text-sm font-medium break-words">{t('stages.refunded.title')}</div>
                <div className="text-xs text-gray-500 mt-1 break-words">{t('stages.refunded.timeframe')}</div>
              </div>
            </div>

            {/* Spacer for completed position */}
            <div className="flex-1"></div>
          </div>
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 sm:mt-14 md:mt-12">
        {/* Main flow descriptions */}
        {mainFlow.map((status) => (
          <div
            key={status}
            className={`p-4 rounded-lg border ${
              currentStatus === status
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <h4 className={`font-semibold mb-2 ${getStatusColor(status)}`}>
              {t(`stages.${status}.title`)}
            </h4>
            <p className="text-sm text-gray-600">{t(`stages.${status}.description`)}</p>
          </div>
        ))}

        {/* Refund flow descriptions */}
        {refundFlow.map((status) => (
          <div
            key={status}
            className={`p-4 rounded-lg border ${
              currentStatus === status
                ? 'border-blue-500 bg-blue-50'
                : 'border-orange-100 bg-orange-50'
            }`}
          >
            <h4 className={`font-semibold mb-2 ${getStatusColor(status)}`}>
              {t(`stages.${status}.title`)}
            </h4>
            <p className="text-sm text-gray-600">{t(`stages.${status}.description`)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
