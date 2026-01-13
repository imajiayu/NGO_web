'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  UsersIcon,
  DollarSignIcon,
  PackageIcon,
  ReceiptIcon,
  FileTextIcon,
} from '@/components/icons'
import Image from 'next/image'
import { clientLogger } from '@/lib/logger-client'
import { useTranslations } from 'next-intl'
import type { LightboxImage } from '@/components/ImageLightbox'
import ProjectProgressSection from '@/components/projects/shared/ProjectProgressSection'
import ProjectResultsMasonry from '@/components/projects/shared/ProjectResultsMasonry'
import type { ProjectStats, ProjectResult } from '@/types'

// P2 优化: 动态加载灯箱组件
const ImageLightbox = dynamic(() => import('@/components/ImageLightbox'), { ssr: false })

interface Project3DetailContentProps {
  project: ProjectStats
  locale: string
}

// ============================================================================
// Type Definitions
// ============================================================================

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
  results: ProjectResult[]
}

interface SupplyItem {
  item: string
  quantity: number
  unitPrice: {
    uah: number
    usd: number
  }
}

interface SuppliesData {
  supplies: SupplyItem[]
  total: {
    items: number
    totalCost: {
      uah: number
      usd: number
    }
  }
  exchangeRateNote: string
  receipts: {
    description: string
    images: string[]
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function Project3DetailContent({
  project,
  locale,
}: Project3DetailContentProps) {
  const t = useTranslations('projects')

  // State for content data
  const [content, setContent] = useState<ProjectContent | null>(null)
  const [suppliesData, setSuppliesData] = useState<SuppliesData | null>(null)
  const [loading, setLoading] = useState(true)

  // UI state
  const [expandedShelters, setExpandedShelters] = useState<Set<number>>(new Set())

  // Lightbox states
  const [detailLightboxOpen, setDetailLightboxOpen] = useState(false)
  const [detailLightboxIndex, setDetailLightboxIndex] = useState(0)
  const [receiptLightboxOpen, setReceiptLightboxOpen] = useState(false)
  const [receiptLightboxIndex, setReceiptLightboxIndex] = useState(0)

  // Load content from JSON files
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contentRes, suppliesRes] = await Promise.all([
          fetch(`/content/projects/project-3-${locale}.json`),
          fetch(`/content/projects/project-3-supplies-${locale}.json`),
        ])

        if (contentRes.ok) {
          const contentData = await contentRes.json()
          setContent(contentData)
        }

        if (suppliesRes.ok) {
          const suppliesDataJson = await suppliesRes.json()
          setSuppliesData(suppliesDataJson)
        }
      } catch (error) {
        clientLogger.error('UI', 'Error loading project content', { project: 3, error: error instanceof Error ? error.message : String(error) })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [locale])

  // Toggle shelter expansion
  const toggleShelter = (index: number) => {
    const newExpanded = new Set(expandedShelters)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedShelters(newExpanded)
  }

  // Prepare lightbox images for detail images
  const detailLightboxImages = useMemo<LightboxImage[]>(() => {
    if (!content?.images) return []
    return content.images.map((url, idx) => ({
      url,
      caption: `${content.title} - Image ${idx + 1}`,
      alt: `${content.title} - Image ${idx + 1}`,
    }))
  }, [content])

  // Prepare lightbox images for receipts
  const receiptLightboxImages = useMemo<LightboxImage[]>(() => {
    if (!suppliesData?.receipts?.images) return []
    return suppliesData.receipts.images.map((url, idx) => ({
      url,
      caption: `Receipt ${idx + 1}`,
      alt: `Receipt ${idx + 1}`,
    }))
  }, [suppliesData])

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton for detail */}
        <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-ukraine-blue-500 p-8 text-white">
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
      </div>
    )
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="space-y-3 md:space-y-4">
      {/* ================================================================== */}
      {/* Section 1: Project Details */}
      {/* ================================================================== */}
      {content ? (
        <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-ukraine-blue-500 p-4 md:p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-1 font-display">{content.title}</h1>
            <p className="text-ukraine-blue-100 text-sm md:text-base">{content.subtitle}</p>
          </div>

          {/* Content Body */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Images */}
            {content.images && content.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {content.images.map((imageSrc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDetailLightboxIndex(idx)
                      setDetailLightboxOpen(true)
                    }}
                    className="relative aspect-video rounded-lg overflow-hidden shadow-sm group cursor-pointer"
                  >
                    <Image
                      src={imageSrc}
                      alt={`${content.title} - Image ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  </button>
                ))}
              </div>
            )}

            {/* Introduction */}
            <div className="prose max-w-none">
              {content.introduction.map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-sm md:text-base text-gray-700 leading-snug md:leading-relaxed mb-2 md:mb-3"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Shelters */}
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2 font-display">
                <MapPinIcon className="w-5 h-5 text-ukraine-blue-500" />
                {locale === 'en'
                  ? 'Visited Facilities'
                  : locale === 'zh'
                  ? '走访机构'
                  : 'Відвідані заклади'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                {content.shelters.map((shelter, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-ukraine-blue-50 to-ukraine-gold-50/30 rounded-lg p-3 md:p-4 border border-ukraine-blue-200"
                  >
                    <h3 className="font-bold text-sm md:text-base text-gray-900 mb-1 font-display">
                      {shelter.name}
                    </h3>
                    <p className="text-xs text-gray-600 italic mb-2">{shelter.nameOriginal}</p>
                    <div className="space-y-1.5 text-xs md:text-sm">
                      <div className="flex items-start gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-ukraine-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 leading-tight">{shelter.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UsersIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-ukraine-gold-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">
                          {shelter.childrenCount} {t('children')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-3 md:p-4 border border-green-200">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 font-display">
                <DollarSignIcon className="w-5 h-5 text-green-600" />
                {locale === 'en'
                  ? 'Program Statistics'
                  : locale === 'zh'
                  ? '项目统计'
                  : 'Статистика програми'}
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-white rounded-lg p-2 md:p-3 text-center shadow-sm">
                  <div className="text-xl md:text-2xl font-bold text-ukraine-blue-500 mb-0.5 font-data">
                    {content.statistics.totalChildren}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {t('totalChildren')}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 md:p-3 text-center shadow-sm">
                  <div className="text-xl md:text-2xl font-bold text-green-600 mb-0.5 font-data">
                    ${content.statistics.totalCost.usd}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {t('totalCost')}
                    <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                      ₴{content.statistics.totalCost.uah.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 md:p-3 text-center shadow-sm">
                  <div className="text-xl md:text-2xl font-bold text-ukraine-gold-600 mb-0.5 font-data">
                    ${content.statistics.averagePerChild}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">
                    {t('perChild')}
                  </div>
                </div>
              </div>
            </div>

            {/* Gifts List - Collapsible */}
            <div className="space-y-2 md:space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 font-display">
                {locale === 'en'
                  ? 'Children & Gifts List'
                  : locale === 'zh'
                  ? '儿童-礼物列表'
                  : 'Список дітей та подарунків'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600">
                {locale === 'en'
                  ? 'Click on each facility to view the complete list of children and their gift wishes.'
                  : locale === 'zh'
                  ? '点击每个机构以查看完整的儿童及其礼物愿望列表。'
                  : 'Натисніть на кожен заклад, щоб переглянути повний список дітей та їхніх побажань щодо подарунків.'}
              </p>

              <div className="space-y-2">
                {content.giftsList.map((giftList, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleShelter(idx)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <UsersIcon className="w-4 h-4 md:w-5 md:h-5 text-ukraine-blue-500 flex-shrink-0" />
                        <span className="font-semibold text-sm md:text-base text-gray-900">
                          {giftList.shelter}
                        </span>
                        <span className="text-xs md:text-sm text-gray-600">
                          ({giftList.children.length} {t('children')})
                        </span>
                      </div>
                      {expandedShelters.has(idx) ? (
                        <ChevronUpIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
                      )}
                    </button>

                    {expandedShelters.has(idx) && (
                      <div className="p-3 md:p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {giftList.children.map((child, childIdx) => (
                            <div
                              key={childIdx}
                              className="flex items-center gap-2 p-2 bg-gradient-to-r from-ukraine-blue-50 to-ukraine-gold-50/30 rounded-lg border border-ukraine-blue-200"
                            >
                              <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-ukraine-blue-500 to-ukraine-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {childIdx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs md:text-sm text-gray-900 truncate">
                                  {child.name}
                                </div>
                                <div className="text-[10px] md:text-xs text-gray-600 truncate">
                                  {child.gift}
                                </div>
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
      ) : (
        /* Placeholder if no content */
        <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-ukraine-blue-500 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2 font-display">Christmas Gift Program</h1>
            <p className="text-ukraine-blue-100">
              {t('projectDetails')}
            </p>
          </div>
          <div className="p-8">
            <div className="p-8 bg-ukraine-blue-50 border-2 border-ukraine-blue-200 rounded-lg text-center">
              <p className="text-gray-600">
                {locale === 'en'
                  ? 'Detailed information will be available soon.'
                  : locale === 'zh'
                  ? '详细信息即将发布。'
                  : 'Детальна інформація буде доступна найближчим часом.'}
              </p>
            </div>
          </div>
        </article>
      )}

      {/* ================================================================== */}
      {/* Section 2: Supplies & Expenses */}
      {/* ================================================================== */}
      {suppliesData ? (
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-3 md:p-4 text-white">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 font-display">
              <PackageIcon className="w-5 h-5" />
              {locale === 'en'
                ? 'Supplies & Expenses'
                : locale === 'zh'
                ? '物资清单与支出'
                : 'Матеріали та витрати'}
            </h2>
          </div>

          <div className="p-4 md:p-5 space-y-4 md:space-y-5">
            {/* Supplies List Section */}
            <section>
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 font-display">
                <FileTextIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                {locale === 'en'
                  ? 'Supply List & Unit Prices'
                  : locale === 'zh'
                  ? '物资清单与单价明细'
                  : 'Список матеріалів та ціни'}
              </h3>

              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-green-100 to-teal-100 px-2 md:px-3 py-2 grid grid-cols-12 gap-2 md:gap-3 font-semibold text-xs md:text-sm text-gray-900 border-b border-gray-300">
                  <div className="col-span-5 md:col-span-6">
                    {t('item')}
                  </div>
                  <div className="col-span-3 md:col-span-2 text-center">
                    {t('quantity')}
                  </div>
                  <div className="col-span-4 text-right">
                    {t('unitPrice')}
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {suppliesData.supplies.map((supply, idx) => (
                    <div
                      key={idx}
                      className="px-2 md:px-3 py-2 grid grid-cols-12 gap-2 md:gap-3 items-center hover:bg-white transition-colors"
                    >
                      <div className="col-span-5 md:col-span-6 font-medium text-xs md:text-sm text-gray-900">
                        {supply.item}
                      </div>
                      <div className="col-span-3 md:col-span-2 text-center">
                        <span className="inline-block px-2 py-0.5 bg-ukraine-blue-100 text-ukraine-blue-800 rounded-full font-semibold text-xs">
                          ×{supply.quantity}
                        </span>
                      </div>
                      <div className="col-span-4 text-right">
                        <div className="font-bold text-xs md:text-sm text-gray-900">
                          ₴{supply.unitPrice.uah.toLocaleString()}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-600">
                          (${supply.unitPrice.usd})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Footer - Total */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 px-2 md:px-3 py-2 md:py-3 border-t-2 border-green-300">
                  <div className="grid grid-cols-12 gap-2 md:gap-3 items-center">
                    <div className="col-span-5 md:col-span-6 font-bold text-gray-900 text-sm md:text-base">
                      {t('total')}
                    </div>
                    <div className="col-span-3 md:col-span-2 text-center">
                      <span className="inline-block px-2 py-0.5 bg-green-600 text-white rounded-full font-bold text-xs">
                        {suppliesData.total.items} {t('items')}
                      </span>
                    </div>
                    <div className="col-span-4 text-right">
                      <div className="font-bold text-green-600 text-base md:text-lg">
                        ₴{suppliesData.total.totalCost.uah.toLocaleString()}
                      </div>
                      <div className="text-xs md:text-sm text-gray-700 font-semibold">
                        (${suppliesData.total.totalCost.usd.toLocaleString()})
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Note */}
              <div className="mt-2 flex items-center gap-1.5 text-xs md:text-sm text-gray-600">
                <DollarSignIcon className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="italic">{suppliesData.exchangeRateNote}</span>
              </div>
            </section>

            {/* Expense Receipts Section */}
            <section className="border-t border-gray-200 pt-3 md:pt-4">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2 font-display">
                <ReceiptIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                {locale === 'en'
                  ? 'Expense Receipts'
                  : locale === 'zh'
                  ? '支出凭证'
                  : 'Квитанції про витрати'}
              </h3>

              {suppliesData.receipts.images && suppliesData.receipts.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                  {suppliesData.receipts.images.map((imageSrc, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setReceiptLightboxIndex(idx)
                        setReceiptLightboxOpen(true)
                      }}
                      className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-sm border border-gray-200 group cursor-pointer"
                    >
                      <Image
                        src={imageSrc}
                        alt={`Receipt ${idx + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-dashed border-gray-300 text-center">
                  <ReceiptIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                    {suppliesData.receipts.description}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {/* ================================================================== */}
      {/* Section 3: Project Progress */}
      {/* ================================================================== */}
      <ProjectProgressSection project={project} locale={locale} />

      {/* ================================================================== */}
      {/* Section 4: Project Results */}
      {/* ================================================================== */}
      {content?.results && content.results.length > 0 && (
        <article className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-ukraine-blue-500 p-4 md:p-6 text-white">
            <h2 className="text-2xl md:text-3xl font-bold font-display">
              {locale === 'en'
                ? 'Project Results'
                : locale === 'zh'
                ? '项目成果'
                : 'Результати проєкту'}
            </h2>
            <p className="text-ukraine-blue-100 text-sm md:text-base mt-2">
              {locale === 'en'
                ? 'View photos documenting our project activities and impact'
                : locale === 'zh'
                ? '查看记录我们项目活动和影响的照片'
                : 'Перегляньте фотографії, що документують нашу діяльність та вплив'}
            </p>
          </div>

          {/* Results Gallery */}
          <div className="p-4 md:p-6">
            <ProjectResultsMasonry results={content.results} />
          </div>
        </article>
      )}

      {/* ================================================================== */}
      {/* Lightboxes - 仅在打开时渲染，配合动态导入减少初始加载 */}
      {/* ================================================================== */}
      {detailLightboxOpen && (
        <ImageLightbox
          images={detailLightboxImages}
          initialIndex={detailLightboxIndex}
          isOpen={detailLightboxOpen}
          onClose={() => setDetailLightboxOpen(false)}
        />
      )}
      {receiptLightboxOpen && (
        <ImageLightbox
          images={receiptLightboxImages}
          initialIndex={receiptLightboxIndex}
          isOpen={receiptLightboxOpen}
          onClose={() => setReceiptLightboxOpen(false)}
        />
      )}
    </div>
  )
}
