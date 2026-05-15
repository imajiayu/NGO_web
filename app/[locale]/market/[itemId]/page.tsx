import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getMarketItemById } from '@/app/actions/market-items'
import PageViewTracker from '@/components/analytics/PageViewTracker'
import MarketItemDetail from '@/components/market/MarketItemDetail'
import { BASE_URL, getAlternates } from '@/lib/constants'
import { getTranslatedText } from '@/lib/i18n-utils'
import type { AppLocale } from '@/types'

type Props = {
  params: Promise<{ locale: string; itemId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale, itemId } = await params
  const { item } = await getMarketItemById(Number(itemId))
  if (!item) return {}

  const title = getTranslatedText(item.title_i18n, locale as AppLocale) || 'Item'
  const [tCommon, tMarket] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'market' }),
  ])
  const description = tMarket('itemMetaDescription', { title })
  const ogImage = `/images/market/item-${itemId}/og.jpg`

  return {
    title: `${title} — ${tCommon('appName')}`,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/market/${itemId}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: getAlternates(`/${locale}/market/${itemId}`),
  }
}

export default async function MarketItemPage({ params }: Props) {
  const { locale, itemId } = await params
  const id = Number(itemId)

  if (isNaN(id)) notFound()

  const { item, error } = await getMarketItemById(id)

  if (!item || error === 'not_found') notFound()

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageViewTracker pageType="market_item" entityId={id} locale={locale} />
      <MarketItemDetail item={item} locale={locale} />
    </main>
  )
}
