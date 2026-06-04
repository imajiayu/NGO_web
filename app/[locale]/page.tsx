import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import PageViewTracker from '@/components/analytics/PageViewTracker'
import ComplianceSection from '@/components/home/ComplianceSection'
import HomeHero from '@/components/home/HomeHero'
// TODO: 义卖市场暂时隐藏，恢复时取消注释
// import HomeMarketGrid from '@/components/home/HomeMarketGrid'
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

export const revalidate = 120

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
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

      {/* 融合首屏（使命 + 影响 + 方式，移动端与桌面端统一） */}
      <HomeHero />

      {/* Wrapper for Projects, Results, Journey, Compliance sections */}
      <div className="bg-gradient-to-b from-white from-80% to-ukraine-blue-50">
        {/* Section 4: Projects & Market */}
        <section
          id="projects-section"
          className="relative flex items-center justify-center pt-12 md:pt-16"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header：标题 + 右侧上下两行 tag */}
            <div className="mb-3 flex items-center justify-center gap-3 sm:gap-4 md:mb-10">
              <h2 className="font-display text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                {t('projects.title')}
              </h2>
              <div className="flex flex-col items-start gap-1.5">
                <span className="inline-block rounded-full bg-ukraine-gold-500 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ukraine-blue-900">
                  {t('projects.label')}
                </span>
                {/* TODO: 义卖市场暂时隐藏，恢复时取消注释
                <span className="inline-block rounded-full bg-ukraine-blue-600 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
                  {t('market.label')}
                </span>
                */}
              </div>
            </div>

            {/* Scroll Hint（仅移动端，置于标题下方） */}
            <div className="mb-3 text-center md:hidden">
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

            {/* TODO: 义卖市场暂时隐藏，恢复时取消注释
            <Suspense
              fallback={
                <div className="mt-1 w-full md:mt-2">
                  <div className="scrollbar-hide overflow-x-auto pb-4 pt-2">
                    <div className="flex min-w-min gap-5 px-6">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-[320px] w-[200px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-100 sm:w-[220px] lg:w-[244px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              }
            >
              <HomeMarketGrid />
            </Suspense>
            */}
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
