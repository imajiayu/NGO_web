'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MapPin, Users, DollarSign } from 'lucide-react'
import Image from 'next/image'

interface ProjectDetailContentProps {
  projectId: number
  projectName: string
  locale: string
}

interface Shelter {
  name: string
  nameOriginal: string
  address: string
  childrenCount: number
}

interface Child {
  name: string
  gift: string
}

interface GiftList {
  shelter: string
  children: Child[]
}

interface ProjectContent {
  title: string
  subtitle: string
  images: string[]
  introduction: string[]
  shelters: Shelter[]
  statistics: {
    totalChildren: number
    totalCost: {
      uah: number
      usd: number
    }
    averagePerChild: number
    currency: string
  }
  giftsList: GiftList[]
}

export default function ProjectDetailContent({
  projectId,
  projectName,
  locale
}: ProjectDetailContentProps) {
  const [content, setContent] = useState<ProjectContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedShelters, setExpandedShelters] = useState<Set<number>>(new Set())

  // Load content from JSON file
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`/content/projects/project-${projectId}-${locale}.json`)
        if (response.ok) {
          const data = await response.json()
          setContent(data)
        } else {
          console.warn(`No content found for project ${projectId} in ${locale}`)
        }
      } catch (error) {
        console.error('Error loading project content:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [projectId, locale])

  const toggleShelter = (index: number) => {
    const newExpanded = new Set(expandedShelters)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedShelters(newExpanded)
  }

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

  // Show placeholder if no content found
  if (!content) {
    return (
      <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">{projectName}</h1>
          <p className="text-blue-100">
            {locale === 'en' ? 'Project Details' : locale === 'zh' ? '项目详情' : 'Деталі проекту'}
          </p>
        </div>

        <div className="p-8">
          <div className="p-8 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {locale === 'en' ? 'Project in Preparation' : locale === 'zh' ? '项目正在筹备中' : 'Проект готується'}
                </h4>
                <p className="text-gray-600">
                  {locale === 'en'
                    ? 'Detailed information for this project will be available soon.'
                    : locale === 'zh'
                    ? '该项目的详细信息即将发布。'
                    : 'Детальна інформація про цей проект буде доступна найближчим часом.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
        <p className="text-blue-100 text-lg">{content.subtitle}</p>
      </div>

      {/* Content Body */}
      <div className="p-8 space-y-8">
        {/* Images */}
        {content.images && content.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.images.map((imageSrc, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                <Image
                  src={imageSrc}
                  alt={`${content.title} - Image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        )}

        {/* Introduction */}
        <div className="prose max-w-none">
          {content.introduction.map((paragraph, idx) => (
            <p key={idx} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Shelters */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            {locale === 'en' ? 'Visited Facilities' : locale === 'zh' ? '走访机构' : 'Відвідані заклади'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {content.shelters.map((shelter, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-5 border-2 border-blue-200">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{shelter.name}</h3>
                <p className="text-sm text-gray-600 italic mb-3">{shelter.nameOriginal}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{shelter.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">
                      {shelter.childrenCount} {locale === 'en' ? 'children' : locale === 'zh' ? '名儿童' : 'дітей'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            {locale === 'en' ? 'Program Statistics' : locale === 'zh' ? '项目统计' : 'Статистика програми'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {content.statistics.totalChildren}
              </div>
              <div className="text-sm text-gray-600">
                {locale === 'en' ? 'Total Children' : locale === 'zh' ? '儿童总数' : 'Всього дітей'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">
                ${content.statistics.totalCost.usd}
              </div>
              <div className="text-sm text-gray-600">
                {locale === 'en' ? 'Total Cost' : locale === 'zh' ? '总花费' : 'Загальна вартість'}
                <br />
                <span className="text-xs text-gray-500">
                  (₴{content.statistics.totalCost.uah.toLocaleString()})
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                ${content.statistics.averagePerChild}
              </div>
              <div className="text-sm text-gray-600">
                {locale === 'en' ? 'Per Child' : locale === 'zh' ? '平均每位儿童' : 'На дитину'}
              </div>
            </div>
          </div>
        </div>

        {/* Gifts List - Collapsible */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {locale === 'en' ? 'Children & Gifts List' : locale === 'zh' ? '儿童-礼物列表' : 'Список дітей та подарунків'}
          </h2>
          <p className="text-sm text-gray-600">
            {locale === 'en'
              ? 'Click on each facility to view the complete list of children and their gift wishes.'
              : locale === 'zh'
              ? '点击每个机构以查看完整的儿童及其礼物愿望列表。'
              : 'Натисніть на кожен заклад, щоб переглянути повний список дітей та їхніх побажань щодо подарунків.'}
          </p>

          <div className="space-y-3">
            {content.giftsList.map((giftList, idx) => (
              <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleShelter(idx)}
                  className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{giftList.shelter}</span>
                    <span className="text-sm text-gray-600">
                      ({giftList.children.length} {locale === 'en' ? 'children' : locale === 'zh' ? '名儿童' : 'дітей'})
                    </span>
                  </div>
                  {expandedShelters.has(idx) ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {expandedShelters.has(idx) && (
                  <div className="p-5 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {giftList.children.map((child, childIdx) => (
                        <div
                          key={childIdx}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {childIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{child.name}</div>
                            <div className="text-sm text-gray-600 truncate">{child.gift}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
