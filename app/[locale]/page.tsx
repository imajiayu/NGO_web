import dynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import PageViewTracker from '@/components/analytics/PageViewTracker'
import ApproachSection from '@/components/home/ApproachSection'
import ComplianceSection from '@/components/home/ComplianceSection'
import HomeMarketGrid from '@/components/home/HomeMarketGrid'
import ImpactSection from '@/components/home/ImpactSection'
import MissionSection from '@/components/home/MissionSection'
import ProjectsGrid from '@/components/projects/ProjectsGrid'
import { locales } from '@/i18n/config'
import { BASE_URL, getAlternates } from '@/lib/constants'

// 首屏下方的 client component 延迟加载，减少 first load JS（PageSpeed: chunks/2450 浪费 58 KiB）
const ProjectResultsSection = dynamic(() => import('@/components/home/ProjectResultsSection'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
})
const DonationJourneySection = dynamic(() => import('@/components/home/DonationJourneySection'), {
  loading: () => <div className="h-96 animate-pulse bg-white" />,
})

export const revalidate = 60

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params

  const { locale } = params

  const tMeta = await getTranslations({ locale, namespace: 'metadata' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const title = tCommon('appName')
  const description = tMeta('homeDescription')

  return {
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
    },
    twitter: { title, description },
    alternates: getAlternates(`/${locale}`),
  }
}

export default async function Home(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  const t = await getTranslations('home.hero')

  return (
    <div className="w-full">
      <PageViewTracker pageType="home" locale={locale} />
      {/* Section 1: Mission */}
      <MissionSection />

      {/* Section 2: Approach */}
      <ApproachSection />

      {/* Section 3: Impact */}
      <ImpactSection />

      {/* Wrapper for Projects, Results, Journey, Compliance sections */}
      <div className="bg-gradient-to-b from-white from-80% to-ukraine-blue-50">
        {/* Section 4: Projects & Market */}
        <section
          id="projects-section"
          className="relative flex items-center justify-center pt-12 md:pt-16"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 text-center md:mb-10">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-block rounded-full bg-ukraine-gold-500 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ukraine-blue-900">
                  {t('projects.label')}
                </span>
                <span className="inline-block rounded-full bg-ukraine-blue-600 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
                  {t('market.label')}
                </span>
              </div>
              <h2 className="mb-4 font-display text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                {t('projects.title')}
              </h2>
            </div>

            {/* Projects Grid */}
            <Suspense
              fallback={
                <div className="w-full">
                  <div className="scrollbar-hide overflow-x-auto pb-4 pt-2">
                    <div className="flex min-w-min gap-6 px-6">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-[400px] w-[300px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-100 md:w-[350px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              }
            >
              <ProjectsGrid />
            </Suspense>

            {/* Market Items */}
            <Suspense
              fallback={
                <div className="mt-1 w-full md:mt-2">
                  <div className="scrollbar-hide overflow-x-auto pb-4 pt-2">
                    <div className="flex min-w-min gap-5 px-6">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-[360px] w-[260px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-100 sm:w-[280px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              }
            >
              <HomeMarketGrid />
            </Suspense>

            {/* Unified Scroll Hint */}
            <div className="mt-4 text-center">
              <p className="flex items-center justify-center text-sm text-gray-500">
                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
                {t('projects.scrollHint')}
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Project Results */}
        <ProjectResultsSection />

        {/* Section 6: Donation Journey */}
        <DonationJourneySection />

        {/* Section 7: Legal Compliance */}
        <ComplianceSection />
      </div>
    </div>
  )
}
