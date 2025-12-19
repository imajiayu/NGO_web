'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ProjectStats } from '@/types'
import ProjectsGallery from '@/components/projects/ProjectsGallery'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectSuppliesInfo from '@/components/projects/ProjectSuppliesInfo'
import ProjectProgressCard from '@/components/projects/ProjectProgressCard'
import DonationFormCard from '@/components/donate/DonationFormCard'
import DonationStatusFlow from '@/components/donation/DonationStatusFlow'
import ProjectDonationList from '@/components/donation/ProjectDonationList'
import { getProjectName, type SupportedLocale } from '@/lib/i18n-utils'

interface DonatePageClientProps {
  projects: ProjectStats[]
  locale: string
  initialProjectId: number | null
}

export default function DonatePageClient({
  projects,
  locale,
  initialProjectId
}: DonatePageClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialProjectId
  )
  const [isFlowExpanded, setIsFlowExpanded] = useState(false)

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null

  // Smooth scroll to content section when project is selected
  const handleProjectSelect = (id: number) => {
    setSelectedProjectId(id)

    // Scroll to content area after a small delay to allow state update
    setTimeout(() => {
      const contentSection = document.getElementById('donation-content')
      if (contentSection) {
        contentSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Project Selection Gallery */}
      <ProjectsGallery
        projects={projects}
        locale={locale}
        mode="compact"
        selectedProjectId={selectedProjectId}
        onProjectSelect={handleProjectSelect}
      />

      {/* Main Content Area */}
      <div id="donation-content" className="max-w-7xl mx-auto px-6 py-12">
        {selectedProject && selectedProjectId ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Side: Three sections stacked vertically (60%) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Section 1: Project Details */}
              <ProjectDetailContent
                projectId={selectedProjectId}
                projectName={getProjectName(
                  selectedProject.project_name_i18n,
                  selectedProject.project_name,
                  locale as SupportedLocale
                )}
                locale={locale}
              />

              {/* Section 2: Supplies & Expenses */}
              <ProjectSuppliesInfo
                projectId={selectedProjectId}
                locale={locale}
              />

              {/* Section 3: Project Progress */}
              <ProjectProgressCard
                project={selectedProject}
                locale={locale}
              />
            </div>

            {/* Right Side: Donation Form (40%) */}
            <div className="lg:col-span-2">
              <DonationFormCard
                project={selectedProject}
                locale={locale}
              />
            </div>
          </div>
        ) : (
          <EmptyState locale={locale} />
        )}

        {/* Full Width: Donation Process Flow */}
        <div className="mt-16 pt-16 border-t-2 border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {locale === 'en' ? 'Track Your Donation' : locale === 'zh' ? '追踪您的捐款' : 'Відстежити ваш внесок'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              {locale === 'en'
                ? 'Follow your contribution from payment to completion with full transparency and real-time updates'
                : locale === 'zh'
                ? '以完全透明和实时更新的方式跟踪您的捐款从支付到完成的整个过程'
                : 'Відстежуйте свій внесок від оплати до завершення з повною прозорістю та оновленнями в реальному часі'}
            </p>

            {/* Toggle Button */}
            <button
              onClick={() => setIsFlowExpanded(!isFlowExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              {isFlowExpanded ? (
                <>
                  {locale === 'en' ? 'Hide Details' : locale === 'zh' ? '隐藏详情' : 'Сховати деталі'}
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  {locale === 'en' ? 'Show Details' : locale === 'zh' ? '显示详情' : 'Показати деталі'}
                  <ChevronDown className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Collapsible Content */}
          {isFlowExpanded && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <DonationStatusFlow />
            </div>
          )}
        </div>

        {/* Project Donations List */}
        {selectedProjectId && selectedProject && (
          <div className="mt-16">
            <ProjectDonationList
              projectId={selectedProjectId}
              projectName={getProjectName(
                selectedProject.project_name_i18n,
                selectedProject.project_name,
                locale as SupportedLocale
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Empty state when no project is selected
function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {locale === 'en' ? 'Select a Project' : '选择一个项目'}
      </h3>
      <p className="text-gray-600 max-w-md">
        {locale === 'en'
          ? 'Choose a project from the gallery above to view details and make a donation'
          : '从上方画廊中选择一个项目以查看详情并进行捐赠'}
      </p>
      <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span>
          {locale === 'en'
            ? 'Scroll up to see all available projects'
            : '向上滚动查看所有可用项目'}
        </span>
      </div>
    </div>
  )
}
