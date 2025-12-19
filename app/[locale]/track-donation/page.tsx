import { getTranslations, getLocale } from 'next-intl/server'
import TrackDonationForm from './track-donation-form'

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: 'trackDonation' })

  return {
    title: t('pageTitle'),
  }
}

export default async function TrackDonationPage() {
  const t = await getTranslations('trackDonation')
  const locale = await getLocale()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 py-20 pb-32">
        <div className="absolute inset-0 bg-black/10 -z-10"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-6 text-white">
            {t('pageTitle')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            {t('title')}
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 -mt-20">
        <TrackDonationForm locale={locale} />
      </div>
    </div>
  )
}
