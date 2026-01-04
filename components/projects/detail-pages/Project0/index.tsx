'use client'

import { useState, useEffect, useMemo } from 'react'
import { MapPin, Users, Activity } from 'lucide-react'
import EmployeeCarousel from './EmployeeCarousel'
import CollapsibleGallery from './CollapsibleGallery'
import ImageLightbox, { type LightboxImage } from '@/components/ImageLightbox'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import type { ProjectStats, ProjectResult } from '@/types'

interface Project0DetailContentProps {
  project: ProjectStats  // Included for interface consistency, may not be used
  locale: string
}

interface Statistic {
  value: number
  label: string
  description: string
  isAmount?: boolean
}

interface Value {
  name: string
  description: string
}

interface Mission {
  title: string
  content: string
  values: Value[]
}

interface TreatmentProgram {
  name: string
  description: string
}

interface SuccessStory {
  title: string
  description: string
  image: string
}

interface Challenges {
  title: string
  content: string[]
}

interface YearlyFinancialData {
  year: string
  period: string
  staffCount: number
  expenses: number
  donations: number
  governmentCompensation: number
  deficit: number
  reportImage?: string
}

interface ExpenseCategory {
  name: string
  percentage: number
  description: string
}

interface FinancialStatus {
  title: string
  description: string
  yearlyData: YearlyFinancialData[]
  breakdown: {
    title: string
    categories: ExpenseCategory[]
  }
}

interface ProgressImage {
  url: string
  caption: string
  priority: number
}

interface ProgressGallery {
  title: string
  description: string
  images: ProgressImage[]
}

interface CallToActionPurpose {
  title: string
  description: string
}

interface CallToAction {
  title: string
  content: string
  purposes: CallToActionPurpose[]
  closing: string
}

interface Project0Content {
  title: string
  subtitle: string
  location: string
  locationDetail: string
  foundationDate: string
  images: string[]
  introduction: string[]
  statistics: {
    patientsRehabililated: Statistic
    prosthesesProvided: Statistic
    staffMembers: Statistic
    totalNeed: Statistic
  }
  mission: Mission
  team: {
    title: string
    description: string
    members: string[]
  }
  treatmentPrograms: {
    title: string
    description: string
    programs: TreatmentProgram[]
  }
  successStories: SuccessStory[]
  challenges: Challenges
  financialStatus: FinancialStatus
  callToAction?: CallToAction
  progressGallery: ProgressGallery
  results: ProjectResult[]
}

export default function Project0DetailContent({ project, locale }: Project0DetailContentProps) {
  const [content, setContent] = useState<Project0Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [employerImages, setEmployerImages] = useState<string[]>([])

  // Lightbox states for different image groups
  const [eventLightboxOpen, setEventLightboxOpen] = useState(false)
  const [eventLightboxIndex, setEventLightboxIndex] = useState(0)
  const [successLightboxOpen, setSuccessLightboxOpen] = useState(false)
  const [successLightboxIndex, setSuccessLightboxIndex] = useState(0)
  const [reportLightboxOpen, setReportLightboxOpen] = useState(false)
  const [reportLightboxIndex, setReportLightboxIndex] = useState(0)

  // Load content from JSON file
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`/content/projects/project-0-${locale}.json`)
        if (response.ok) {
          const data = await response.json()
          setContent(data)
        } else {
          console.warn(`No content found for project-0 in ${locale}`)
        }
      } catch (error) {
        console.error('Error loading project content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [locale])

  // Load employer images
  useEffect(() => {
    const images = Array.from({ length: 13 }, (_, i) =>
      `/images/projects/project-0/employer/employer${i}.webp`
    )
    setEmployerImages(images)
  }, [])

  // Prepare lightbox images for event images
  const eventLightboxImages = useMemo<LightboxImage[]>(
    () => (content?.images || []).map((url) => ({ url })),
    [content?.images]
  )

  // Prepare lightbox images for success stories
  const successLightboxImages = useMemo<LightboxImage[]>(
    () => (content?.successStories || []).map((story) => ({ url: story.image })),
    [content?.successStories]
  )

  // Prepare lightbox images for financial reports
  const reportLightboxImages = useMemo<LightboxImage[]>(
    () =>
      (content?.financialStatus?.yearlyData || [])
        .filter((year) => year.reportImage)
        .map((year) => ({ url: year.reportImage! })),
    [content?.financialStatus?.yearlyData]
  )

  if (loading) {
    return (
      <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="h-8 bg-white/20 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </article>
    )
  }

  if (!content) {
    return (
      <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Way to Health</h1>
          <p className="text-blue-100">
            {locale === 'en' ? 'Rehabilitation Center' : locale === 'zh' ? '康复中心' : 'Реабілітаційний центр'}
          </p>
        </div>
        <div className="p-8">
          <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
            <p className="text-gray-600">
              {locale === 'en'
                ? 'Content loading...'
                : locale === 'zh'
                ? '内容加载中...'
                : 'Завантаження...'}
            </p>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
    <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 md:p-8 text-white">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 whitespace-pre-line">{content.title}</h1>
        <p className="text-blue-100 text-sm md:text-lg mb-3">{content.subtitle}</p>
        <div className="flex items-center gap-2 text-white/90 text-sm md:text-base">
          <MapPin className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span>
            {locale === 'en'
              ? 'Dnipro, Naberezhna Peremohy 44/4'
              : locale === 'zh'
              ? '第聂伯，胜利滨河大道 44/4'
              : 'Дніпро, Набережна Перемоги 44/4'}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 md:p-8 space-y-8 md:space-y-12">
        {/* Introduction & Event Images */}
        <section className="space-y-4">
          {/* Introduction */}
          <div className="prose max-w-none">
            {content.introduction.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-sm md:text-base text-gray-700 leading-relaxed mb-4"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Funding Sources - 3 Cards */}
          <div className="flex gap-2 md:gap-3">
            {[
              { en: 'Charitable Organizations', zh: '慈善机构', ua: 'Благодійні організації' },
              { en: 'Corporations', zh: '企业', ua: 'Корпорації' },
              { en: 'Churches', zh: '教会', ua: 'Церкви' },
            ].map((source, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg px-3 py-2 md:px-4 md:py-3 text-center border border-amber-200/50"
              >
                <span className="text-xs md:text-sm text-gray-700 font-medium">
                  {locale === 'en' ? source.en : locale === 'zh' ? source.zh : source.ua}
                </span>
              </div>
            ))}
          </div>

          {/* Event Images Grid - No Title */}
          {content.images && content.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {content.images.map((imageSrc, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video rounded-lg overflow-hidden shadow-md cursor-pointer"
                  onClick={() => {
                    setEventLightboxIndex(idx)
                    setEventLightboxOpen(true)
                  }}
                >
                  <img
                    src={imageSrc}
                    alt={`Event ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-2 gap-3 md:gap-6">
          {Object.values(content.statistics).map((stat: any, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 md:p-8 text-center"
            >
              <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-3">
                {stat.isAmount
                  ? `$${stat.value.toLocaleString()}`
                  : stat.value >= 1000
                    ? `${(stat.value / 1000).toFixed(1)}K+`
                    : `${stat.value}+`
                }
              </div>
              <div className="text-xs md:text-base font-semibold text-gray-800 mb-1 md:mb-2">
                {stat.label}
              </div>
              <div className="text-[10px] md:text-sm text-gray-600 leading-tight">
                {stat.description}
              </div>
            </div>
          ))}
        </section>

        {/* Combined Gallery - Progress & Results */}
        {content.progressGallery && content.results && (
          <section>
            <CollapsibleGallery
              results={[
                ...content.progressGallery.images.map((img) => ({
                  imageUrl: img.url,
                  caption: img.caption,
                  priority: img.priority,
                })),
                ...content.results,
              ].filter((img) => {
                // Exclude success story images
                const excludedImages = [
                  '/images/projects/project-0/result/result1.webp',
                  '/images/projects/project-0/progress/progress14.webp',
                  '/images/projects/project-0/result/result13 2.webp',
                  '/images/projects/project-0/progress/progress13.webp',
                ]
                return !excludedImages.includes(img.imageUrl)
              })}
              locale={locale}
            />
          </section>
        )}

        {/* Team Section - Combined */}
        {content.team && (
          <section>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                {content.team.title}
              </h2>
              <span className="text-sm text-gray-600">
                {content.team.description}
              </span>
            </div>

            {/* Team Members Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto scroll-smooth pb-2 scrollbar-hide mb-4">
              {content.team.members.map((member, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-xs md:text-sm text-gray-700 font-medium whitespace-nowrap">{member}</p>
                </div>
              ))}
            </div>

            {/* Employee Photos Carousel */}
            {employerImages.length > 0 && (
              <EmployeeCarousel
                images={employerImages}
                locale={locale}
              />
            )}
          </section>
        )}

        {/* Treatment Programs */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-600" />
            {content.treatmentPrograms.title}
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-4">
            {content.treatmentPrograms.description}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            {content.treatmentPrograms.programs.map((program, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-3 md:p-4 border border-green-200"
              >
                <h3 className="font-bold text-gray-900 mb-1 md:mb-2 text-xs md:text-base">
                  {program.name}
                </h3>
                <p className="text-[10px] md:text-sm text-gray-600 leading-tight">
                  {program.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Success Stories */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {content.successStories.map((story, idx) => (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer"
                onClick={() => {
                  setSuccessLightboxIndex(idx)
                  setSuccessLightboxOpen(true)
                }}
              >
                <div className="relative">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                  {/* Title with Frosted Glass */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4">
                    <div className="inline-block backdrop-blur-md bg-white/10 rounded-lg px-2 py-1 md:px-3 md:py-2 border border-white/30 max-w-[90%]">
                      <h3 className="font-bold text-white text-[10px] md:text-sm leading-tight">
                        {story.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Challenges - Resource Shortage */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            {content.challenges.title}
          </h2>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-6">
            {content.challenges.content[0]}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
                {locale === 'en' ? '30' : '30'}
              </div>
              <div className="text-xs md:text-sm text-gray-700 leading-tight">
                {locale === 'en'
                  ? 'Rehabilitation Centers'
                  : locale === 'zh'
                  ? '康复中心'
                  : 'Реабілітаційні центри'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
                {locale === 'zh' ? '2.7万' : '27K'}
              </div>
              <div className="text-xs md:text-sm text-gray-700 leading-tight">
                {locale === 'en'
                  ? 'Patients/Year'
                  : locale === 'zh'
                  ? '患者/年'
                  : 'Пацієнтів/рік'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
                {locale === 'zh' ? '36万' : '360K'}
              </div>
              <div className="text-xs md:text-sm text-gray-700 leading-tight">
                {locale === 'en'
                  ? 'War-Injured'
                  : locale === 'zh'
                  ? '战争受伤者'
                  : 'Постраждалі'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">
                {locale === 'en' ? '13.5' : '13.5'}
              </div>
              <div className="text-xs md:text-sm text-gray-700 leading-tight">
                {locale === 'en'
                  ? 'Years Wait Time'
                  : locale === 'zh'
                  ? '年等待时间'
                  : 'Років очікування'}
              </div>
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            {content.challenges.content[2]}
          </p>
        </section>

        {/* Financial Status - Operating Scale */}
        {content.financialStatus && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {content.financialStatus.title}
            </h2>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
              {content.financialStatus.description}
            </p>

            {/* Compact Financial Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200">
                    <th className="text-left p-2 md:p-3 font-bold text-gray-700">
                      {locale === 'en' ? 'Year' : locale === 'zh' ? '年份' : 'Рік'}
                    </th>
                    <th className="text-center p-2 md:p-3 font-bold text-gray-700">
                      <Users className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                      {locale === 'en' ? 'Staff' : locale === 'zh' ? '员工' : 'Персонал'}
                    </th>
                    <th className="text-right p-2 md:p-3 font-bold text-red-600">
                      {locale === 'en' ? 'Expenses' : locale === 'zh' ? '支出' : 'Витрати'}
                    </th>
                    <th className="text-right p-2 md:p-3 font-bold text-green-600">
                      {locale === 'en' ? 'Donations' : locale === 'zh' ? '捐赠' : 'Донати'}
                    </th>
                    <th className="text-right p-2 md:p-3 font-bold text-blue-600">
                      {locale === 'en' ? 'Gov. Comp.' : locale === 'zh' ? '政府补偿' : 'Держ. комп.'}
                    </th>
                    <th className="text-right p-2 md:p-3 font-bold text-orange-600">
                      {locale === 'en' ? 'Deficit' : locale === 'zh' ? '赤字' : 'Дефіцит'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {content.financialStatus.yearlyData.map((year, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2 md:p-3">
                        <div className="font-bold text-gray-900">{year.year}</div>
                        <div className="text-[10px] md:text-xs text-gray-500">{year.period}</div>
                      </td>
                      <td className="text-center p-2 md:p-3">
                        <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                          {year.staffCount}
                        </span>
                      </td>
                      <td className="text-right p-2 md:p-3 font-bold text-red-600">
                        ₴{(year.expenses / 1000000).toFixed(2)}M
                      </td>
                      <td className="text-right p-2 md:p-3 font-bold text-green-600">
                        ₴{(year.donations / 1000000).toFixed(2)}M
                      </td>
                      <td className="text-right p-2 md:p-3 font-bold text-blue-600">
                        {year.governmentCompensation > 0 ? `₴${(year.governmentCompensation / 1000000).toFixed(2)}M` : '-'}
                      </td>
                      <td className="text-right p-2 md:p-3">
                        <span className="inline-block bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-2 py-1 rounded font-bold">
                          ₴{(Math.abs(year.deficit) / 1000000).toFixed(2)}M
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Financial Reports */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">
                {locale === 'en' ? 'Official Financial Reports' : locale === 'zh' ? '官方财务报告' : 'Офіційні фінансові звіти'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {content.financialStatus.yearlyData
                  .filter((year) => year.reportImage)
                  .map((year, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border-2 border-gray-200 hover:border-blue-400 group cursor-pointer"
                      onClick={() => {
                        setReportLightboxIndex(idx)
                        setReportLightboxOpen(true)
                      }}
                    >
                      <div className="relative aspect-[3/4]">
                        <img
                          src={year.reportImage}
                          alt={`${year.year} ${locale === 'en' ? 'Financial Report' : locale === 'zh' ? '财务报告' : 'Фінансовий звіт'}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="text-white font-bold text-sm text-center">{year.year}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Expense Breakdown - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {content.financialStatus.breakdown.categories.map((category, idx) => (
                <div key={idx} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-bold text-gray-800">{category.name}</span>
                    <span className="text-lg md:text-xl font-bold text-blue-600">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-600 mt-1">{category.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action - Support Appeal */}
        {content.callToAction && (
          <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-6 md:p-8 border-2 border-amber-200">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 text-center">
              {content.callToAction.title}
            </h2>
            <p className="text-sm md:text-base text-gray-700 text-center mb-6">
              {content.callToAction.content}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {content.callToAction.purposes.map((purpose, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-amber-200/50 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1">
                        {purpose.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                        {purpose.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm md:text-base text-gray-800 leading-relaxed font-medium">
                {content.callToAction.closing}
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Lightbox for Event Images */}
      <ImageLightbox
        images={eventLightboxImages}
        initialIndex={eventLightboxIndex}
        isOpen={eventLightboxOpen}
        onClose={() => setEventLightboxOpen(false)}
      />

      {/* Lightbox for Success Stories */}
      <ImageLightbox
        images={successLightboxImages}
        initialIndex={successLightboxIndex}
        isOpen={successLightboxOpen}
        onClose={() => setSuccessLightboxOpen(false)}
      />

      {/* Lightbox for Financial Reports */}
      <ImageLightbox
        images={reportLightboxImages}
        initialIndex={reportLightboxIndex}
        isOpen={reportLightboxOpen}
        onClose={() => setReportLightboxOpen(false)}
      />
    </article>

    {/* Project Progress Section */}
    <ProjectProgressSection project={project} locale={locale} />
    </div>
  )
}
