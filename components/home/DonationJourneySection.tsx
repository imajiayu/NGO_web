'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import DonationStatusFlow from '@/components/donation/DonationStatusFlow'

export default function DonationJourneySection() {
  const t = useTranslations('home.hero.donationJourney')

  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full mb-6">
            {t('label')}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          {/* Track Your Donation Button */}
          <div className="flex justify-center">
            <Link
              href="/track-donation"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {useTranslations('donationStatusFlow')('trackButton')}
            </Link>
          </div>
        </div>

        {/* Donation Flow Component */}
        <DonationStatusFlow />
      </div>
    </section>
  )
}
