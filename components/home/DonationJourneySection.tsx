'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useState, useEffect } from 'react'
import DonationStatusFlow from '@/components/donation/DonationStatusFlow'
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner'

export default function DonationJourneySection() {
  const t = useTranslations('home.hero.donationJourney')
  const router = useRouter()
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  // Reset loading state when pathname changes
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const handleTrackClick = () => {
    setIsNavigating(true)
    router.push('/track-donation')
  }

  return (
    <>
      <GlobalLoadingSpinner isLoading={isNavigating} />
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full mb-3">
              {t('label')}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 md:mb-4">
              {t('title')}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              {t('subtitle')}
            </p>

            {/* Track Your Donation Button */}
            <div className="flex justify-center">
              <button
                onClick={handleTrackClick}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                {useTranslations('donationStatusFlow')('trackButton')}
              </button>
            </div>
          </div>

        {/* Donation Flow Component */}
        <DonationStatusFlow />
      </div>
    </section>
    </>
  )
}
