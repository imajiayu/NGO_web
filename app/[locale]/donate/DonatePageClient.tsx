'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ProjectStats } from '@/types'
import ProjectsGallery from '@/components/projects/ProjectsGallery'
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'
import ProjectSuppliesInfo from '@/components/projects/ProjectSuppliesInfo'
import ProjectProgressCard from '@/components/projects/ProjectProgressCard'
import ProjectResultsSection from '@/components/projects/ProjectResultsSection'
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
  projects: initialProjects,
  locale,
  initialProjectId
}: DonatePageClientProps) {
  const t = useTranslations('donate')
  const [projects, setProjects] = useState<ProjectStats[]>(initialProjects)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialProjectId
  )
  const [isFlowExpanded, setIsFlowExpanded] = useState(false)

  // Shared form fields state (preserved across project switches)
  // Only preserve donor personal information, NOT project-specific fields
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorMessage, setDonorMessage] = useState('')
  const [contactTelegram, setContactTelegram] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null

  // Callback to update all projects stats
  const handleProjectsUpdate = (updatedProjects: ProjectStats[]) => {
    setProjects(updatedProjects)
  }

  // Handle project selection
  const handleProjectSelect = (id: number) => {
    setSelectedProjectId(id)
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
      <div id="donation-content" className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {selectedProject && selectedProjectId !== null ? (
          <>
            {/* Mobile Only: Scroll to Donation Form Button - At the top */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => {
                  const formElement = document.getElementById('donation-form')
                  if (formElement) {
                    formElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    })
                  }
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <span>{t('donateNowButton')}</span>
                <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Left Side: Three sections stacked vertically (60%) */}
            <div className="lg:col-span-3 space-y-3 md:space-y-4">
              {/* Section 1: Project Details */}
              <ProjectDetailContent
                key={`detail-${selectedProjectId}`}
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
                key={`supplies-${selectedProjectId}`}
                projectId={selectedProjectId}
                locale={locale}
              />

              {/* Section 3: Project Progress */}
              <ProjectProgressCard
                key={`progress-${selectedProjectId}`}
                project={selectedProject}
                locale={locale}
              />

              {/* Section 4: Project Results Gallery */}
              <ProjectResultsSection
                key={`results-${selectedProjectId}`}
                projectId={selectedProjectId}
                locale={locale}
              />
            </div>

            {/* Right Side: Donation Form (40%) */}
            <div className="lg:col-span-2" id="donation-form">
              <DonationFormCard
                project={selectedProject}
                locale={locale}
                onProjectsUpdate={handleProjectsUpdate}
                donorName={donorName}
                setDonorName={setDonorName}
                donorEmail={donorEmail}
                setDonorEmail={setDonorEmail}
                donorMessage={donorMessage}
                setDonorMessage={setDonorMessage}
                contactTelegram={contactTelegram}
                setContactTelegram={setContactTelegram}
                contactWhatsapp={contactWhatsapp}
                setContactWhatsapp={setContactWhatsapp}
              />
            </div>
          </div>
          </>
        ) : (
          <EmptyState locale={locale} />
        )}

        {/* Full Width: Donation Process Flow */}
        <div className="mt-16 pt-16 border-t-2 border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('trackDonationTitle')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              {t('trackDonationDescription')}
            </p>

            {/* Toggle Button */}
            <button
              onClick={() => setIsFlowExpanded(!isFlowExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              {isFlowExpanded ? (
                <>
                  {t('hideDetails')}
                  <ChevronUp className="w-5 h-5" />
                </>
              ) : (
                <>
                  {t('showDetails')}
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
        {selectedProjectId !== null && selectedProject && (
          <div className="mt-16">
            <ProjectDonationList
              key={`donations-${selectedProjectId}`}
              projectId={selectedProjectId}
              projectName={getProjectName(
                selectedProject.project_name_i18n,
                selectedProject.project_name,
                locale as SupportedLocale
              )}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Empty state when no project is selected
function EmptyState({ locale }: { locale: string }) {
  const t = useTranslations('donate.emptyState')

  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {t('title')}
      </h3>
      <p className="text-gray-600 max-w-md">
        {t('description')}
      </p>
      <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span>
          {t('scrollHint')}
        </span>
      </div>
    </div>
  )
}
