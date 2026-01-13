'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner'

export default function SuccessActionButtons() {
  const t = useTranslations('donateSuccess')
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleTrackDonation = () => {
    setIsNavigating(true)
    router.push('/track-donation')
  }

  const handleBackHome = () => {
    setIsNavigating(true)
    router.push('/')
  }

  return (
    <>
      <GlobalLoadingSpinner isLoading={isNavigating} />

      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleTrackDonation}
          className="group relative inline-flex items-center justify-center px-8 py-4 bg-ukraine-gold-500 text-ukraine-blue-900 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:bg-ukraine-gold-600 transition-all duration-300 hover:scale-105 overflow-hidden"
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          <svg
            className="w-5 h-5 mr-2 relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="relative z-10">{t('actions.trackDonation')}</span>
        </button>

        <button
          onClick={handleBackHome}
          className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('actions.backHome')}
        </button>
      </div>
    </>
  )
}
