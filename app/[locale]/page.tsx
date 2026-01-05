import { getTranslations } from 'next-intl/server'
import ProjectsGrid from '@/components/projects/ProjectsGrid'
import MissionSection from '@/components/home/MissionSection'
import ApproachSection from '@/components/home/ApproachSection'
import ImpactSection from '@/components/home/ImpactSection'
import DonationJourneySection from '@/components/home/DonationJourneySection'
import ComplianceSection from '@/components/home/ComplianceSection'
import ProjectResultsSection from '@/components/home/ProjectResultsSection'
import type { ProjectResult } from '@/types'

type Props = {
  params: { locale: string }
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }]
}

export async function generateMetadata() {
  const t = await getTranslations('common')
  const tMeta = await getTranslations('metadata')

  return {
    title: t('appName'),
    description: tMeta('homeDescription'),
  }
}

export default async function Home({ params }: Props) {
  const t = await getTranslations('home.hero.projects')
  const { locale } = params

  // Load home marquee results from dedicated JSON file
  const projectResults: ProjectResult[] = []
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/content/home/marquee-${locale}.json`)
    if (response.ok) {
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        projectResults.push(...data.results)
      }
    }
  } catch (error) {
    console.error('Error loading home marquee:', error)
  }

  return (
    <main className="w-full">
      {/* Section 1: Mission */}
      <MissionSection />

      {/* Section 2: Approach */}
      <ApproachSection />

      {/* Section 3: Impact */}
      <ImpactSection />

      {/* Wrapper for Projects, Results, Journey, Compliance sections */}
      <div className="bg-gradient-to-b from-white from-80% to-blue-50">
        {/* Section 4: Projects */}
        <section id="projects-section" className="relative flex items-center justify-center pt-12 md:pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Header */}
            <div className="text-center mb-8 md:mb-10">
              <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full mb-3">
                {t('label')}
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                {t('title')}
              </h2>
            </div>

            {/* Projects Grid */}
            <ProjectsGrid />
          </div>
        </section>

        {/* Section 5: Project Results */}
        <ProjectResultsSection results={projectResults} locale={locale} />

        {/* Section 6: Donation Journey */}
        <DonationJourneySection />

        {/* Section 7: Legal Compliance */}
        <ComplianceSection />
      </div>
    </main>
  )
}
