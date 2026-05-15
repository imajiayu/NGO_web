import { getTranslations } from 'next-intl/server'

import { locales } from '@/i18n/config'
import { BASE_URL, getAlternates } from '@/lib/constants'
import { getAllProjectsWithStats } from '@/lib/supabase/queries'

import DonatePageClient from './DonatePageClient'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: Props) {
  const { locale } = await props.params

  const t = await getTranslations({ locale, namespace: 'donate' })
  const tMeta = await getTranslations({ locale, namespace: 'metadata' })

  const title = t('title')
  const description = tMeta('donateDescription')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/donate`,
    },
    twitter: { title, description },
    alternates: getAlternates(`/${locale}/donate`),
  }
}

export default async function DonatePage(props: Props) {
  const { locale } = await props.params
  const projects = await getAllProjectsWithStats()
  return <DonatePageClient projects={projects} locale={locale} initialProjectId={null} />
}
