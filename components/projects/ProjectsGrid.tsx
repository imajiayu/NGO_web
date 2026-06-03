import { getLocale, getTranslations } from 'next-intl/server'

import ScrollableRow from '@/components/common/ScrollableRow'
import ProjectCard from '@/components/projects/ProjectCard'
import { logger } from '@/lib/logger'
import { getAllProjectsWithStats } from '@/lib/supabase/queries'
import type { ProjectStats } from '@/types'

export default async function ProjectsGrid() {
  const t = await getTranslations('home')
  const tc = await getTranslations('common')
  const locale = await getLocale()

  // Add error handling for Supabase requests
  let projects: ProjectStats[] = []
  try {
    projects = await getAllProjectsWithStats()
  } catch (error) {
    logger.errorWithStack('DB', 'Failed to fetch projects', error)
    projects = []
  }

  return (
    <div className="w-full">
      {projects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">{t('noProjects')}</p>
        </div>
      ) : (
        <ScrollableRow
          className="relative"
          scrollClassName="pb-4 pt-2"
          scrollbarPosition="top"
          hint={tc('carousel.dragHint')}
          scrollLeftLabel={tc('carousel.scrollLeft')}
          scrollRightLabel={tc('carousel.scrollRight')}
        >
          <div className="flex min-w-min gap-6 px-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} locale={locale} showProgress={true} />
            ))}
          </div>
        </ScrollableRow>
      )}
    </div>
  )
}
