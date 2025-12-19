'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Project } from '@/types'
import { getProjectName, getLocation, getUnitName, type SupportedLocale } from '@/lib/i18n-utils'

interface ProjectSelectorProps {
  projects: Project[]
  currentProjectId: number
  locale: string
}

export default function ProjectSelector({
  projects,
  currentProjectId,
  locale,
}: ProjectSelectorProps) {
  const router = useRouter()
  const t = useTranslations('donate')

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = Number(e.target.value)
    if (newProjectId && newProjectId !== currentProjectId) {
      router.push(`/${locale}/donate?project=${newProjectId}`)
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        {t('project.switchLabel')}
      </label>
      <select
        value={currentProjectId}
        onChange={handleProjectChange}
        className="w-full p-2 border rounded-lg bg-white"
      >
        {projects.map((project) => {
          const projectName = getProjectName(project.project_name_i18n, project.project_name, locale as SupportedLocale)
          const location = getLocation(project.location_i18n, project.location, locale as SupportedLocale)
          const unitName = getUnitName(project.unit_name_i18n, project.unit_name, locale as SupportedLocale)

          return (
            <option key={project.id} value={project.id}>
              {projectName} - {location} ($
              {project.unit_price.toFixed(2)} {t('quantity.perUnit', { unitName })})
            </option>
          )
        })}
      </select>
    </div>
  )
}
