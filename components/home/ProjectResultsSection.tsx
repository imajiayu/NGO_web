import ProjectResultsMarquee from '@/components/projects/ProjectResultsMarquee'
import type { ProjectResult } from '@/types'

type Props = {
  results: ProjectResult[]
  locale: string
}

export default function ProjectResultsSection({ results, locale }: Props) {
  if (results.length === 0) return null

  return (
    <section className="relative bg-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 md:mb-10">
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full mb-3">
            {locale === 'en' ? 'PROJECT RESULTS' : locale === 'zh' ? '项目成果' : 'РЕЗУЛЬТАТИ ПРОЕКТІВ'}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 md:mb-4">
            {locale === 'en' ? 'Our Impact in Action' : locale === 'zh' ? '我们的行动成果' : 'Наші результати в дії'}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            {locale === 'en'
              ? 'See how we transform lives across all our projects and initiatives'
              : locale === 'zh'
              ? '看看我们如何通过所有项目和行动改变生活'
              : 'Подивіться, як ми змінюємо життя через всі наші проекти та ініціативи'}
          </p>
        </div>
      </div>
      <ProjectResultsMarquee results={results} rowCount={3} speed={35} />
    </section>
  )
}
