'use client'

import { useTranslations } from 'next-intl'
import { SparklesIcon } from '@/components/icons'
import { Snowfall } from '../components'
import ProjectResultsMasonry from '@/components/projects/shared/ProjectResultsMasonry'
import type { ProjectResult } from '@/types'

interface ResultsSectionProps {
  results: ProjectResult[]
}

export default function ResultsSection({ results }: ResultsSectionProps) {
  const t = useTranslations('projects')

  if (!results || results.length === 0) {
    return null
  }

  return (
    <article className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative bg-gradient-to-r from-christmas-berry via-rose-600 to-christmas-gold p-4 overflow-hidden">
        <Snowfall />
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg md:text-xl font-bold text-white">
              {t('project3.momentsOfJoy')}
            </h2>
            <p className="text-xs text-white/80">{t('project3.momentsOfJoyDesc')}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <ProjectResultsMasonry results={results} />
      </div>
    </article>
  )
}
