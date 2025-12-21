import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import DonationDetails from './DonationDetails'
import Image from 'next/image'

type Props = {
  params: { locale: string }
  searchParams: { order?: string }
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }]
}

export default async function DonateSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string }
}) {
  const t = await getTranslations('donateSuccess')
  const locale = await getLocale()
  const orderReference = searchParams.order

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59, 130, 246) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pink-400/20 to-purple-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="relative container mx-auto max-w-4xl px-4 py-12 lg:py-20">
        {/* Success Header */}
        <div className="text-center mb-12">
          {/* Main Title */}
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto">
            {t('thankYou')}
          </p>

          {/* Decorative Line */}
          <div className="mt-8 flex items-center justify-center space-x-2">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"></div>
            <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Donation Details - Client Component with polling */}
        {orderReference && <DonationDetails orderReference={orderReference} locale={locale} />}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/track-donation"
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
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
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('actions.backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
