import { getTranslations } from 'next-intl/server'
import ProjectsGrid from '@/components/projects/ProjectsGrid'
import MissionSection from '@/components/home/MissionSection'
import ApproachSection from '@/components/home/ApproachSection'
import ImpactSection from '@/components/home/ImpactSection'
import DonationJourneySection from '@/components/home/DonationJourneySection'
import ComplianceSection from '@/components/home/ComplianceSection'

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

export default async function Home() {
  const t = await getTranslations('home.hero.projects')

  return (
    <main className="w-full">
      {/* Section 1: Mission */}
      <MissionSection />

      {/* Section 2: Approach */}
      <ApproachSection />

      {/* Section 3: Impact */}
      <ImpactSection />

      {/* Section 4: Projects */}
      <section id="projects-section" className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full mb-6">
              {t('label')}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('title')}
            </h2>
          </div>

          {/* Projects Grid */}
          <ProjectsGrid />
        </div>
      </section>

      {/* Section 5: Donation Journey */}
      <DonationJourneySection />

      {/* Section 6: Legal Compliance */}
      <ComplianceSection />
    </main>
  )
}
