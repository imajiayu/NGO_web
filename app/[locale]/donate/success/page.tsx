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

export async function generateMetadata() {
  const t = await getTranslations('donateSuccess')

  return {
    title: t('title'),
  }
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-12 lg:py-20">
        {/* Donation Details - Client Component with dynamic header */}
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
