import { getLocale, getTranslations } from 'next-intl/server'
import { getAllProjectsWithStats } from '@/lib/supabase/queries'
import ProjectCard from '@/components/projects/ProjectCard'
import type { ProjectStats } from '@/types'

export const revalidate = 60 // Cache for 60 seconds

export default async function ProjectsGrid() {
  const t = await getTranslations('home')
  const locale = await getLocale()

  // Add error handling for Supabase requests
  let projects: ProjectStats[] = []
  try {
    projects = await getAllProjectsWithStats()
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    projects = []
  }

  return (
    <div className="w-full">
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('noProjects')}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Horizontal Scrolling Container */}
          <div className="overflow-x-auto pb-4 pt-2 scrollbar-hide">
            <div className="flex gap-6 min-w-min px-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  locale={locale}
                  showProgress={true}
                />
              ))}
            </div>
          </div>

          {/* Scroll Hint (Mobile) */}
          <div className="md:hidden text-center mt-4">
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              {t('hero.projects.scrollHint')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
