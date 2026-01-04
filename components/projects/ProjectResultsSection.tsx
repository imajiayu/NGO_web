'use client'

import { useState, useEffect } from 'react'
import ProjectResultsMasonry from './ProjectResultsMasonry'
import type { ProjectContent, ProjectResult } from '@/types'

interface ProjectResultsSectionProps {
  projectId: number
  locale: string
}

export default function ProjectResultsSection({
  projectId,
  locale
}: ProjectResultsSectionProps) {
  const [results, setResults] = useState<ProjectResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await fetch(`/content/projects/project-${projectId}-${locale}.json`)
        if (response.ok) {
          const content: ProjectContent = await response.json()
          if (content.results && content.results.length > 0) {
            setResults(content.results)
          }
        }
      } catch (error) {
        console.error('Error loading project results:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [projectId, locale])

  // Don't render if no results
  if (!loading && (!results || results.length === 0)) {
    return null
  }

  if (loading) {
    return (
      <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="h-7 bg-white/20 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 md:p-6 text-white">
        <h2 className="text-2xl md:text-3xl font-bold">
          {locale === 'en' ? 'Project Results' : locale === 'zh' ? '项目成果' : 'Результати проєкту'}
        </h2>
        <p className="text-blue-100 text-sm md:text-base mt-2">
          {locale === 'en'
            ? 'View photos documenting our project activities and impact'
            : locale === 'zh'
            ? '查看记录我们项目活动和影响的照片'
            : 'Перегляньте фотографії, що документують нашу діяльність та вплив'}
        </p>
      </div>

      {/* Results Gallery */}
      <div className="p-4 md:p-6">
        <ProjectResultsMasonry results={results} />
      </div>
    </article>
  )
}
