import { useTranslations } from 'next-intl'
import ProjectResultsMarquee from '@/components/projects/ProjectResultsMarquee'
import type { ProjectResult } from '@/types'

type Props = {
  results: ProjectResult[]
  locale: string
}

export default function ProjectResultsSection({ results, locale }: Props) {
  const t = useTranslations('home.hero')

  if (results.length === 0) return null

  return (
    <section className="relative pt-12 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 md:mb-10">
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full mb-3">
            {t('results.label')}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 md:mb-4">
            {t('results.title')}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            {t('results.description')}
          </p>
        </div>
      </div>
      <ProjectResultsMarquee results={results} rowCount={3} speed={35} />
    </section>
  )
}
