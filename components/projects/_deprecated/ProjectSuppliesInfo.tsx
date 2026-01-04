'use client'

import { useState, useEffect, useMemo } from 'react'
import { Package, DollarSign, Receipt, FileText } from 'lucide-react'
import Image from 'next/image'
import ImageLightbox, { type LightboxImage } from '@/components/ImageLightbox'

interface ProjectSuppliesInfoProps {
  projectId: number
  locale: string
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

export default function ProjectSuppliesInfo({
  projectId,
  locale
}: ProjectSuppliesInfoProps) {
  const [suppliesData, setSuppliesData] = useState<SuppliesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Load supplies data from JSON file
  useEffect(() => {
    const loadSupplies = async () => {
      try {
        const response = await fetch(`/content/projects/project-${projectId}-supplies-${locale}.json`)
        if (response.ok) {
          const data = await response.json()
          setSuppliesData(data)
        } else {
          console.warn(`No supplies data found for project ${projectId} in ${locale}`)
        }
      } catch (error) {
        console.error('Error loading supplies data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSupplies()
  }, [projectId, locale])

  // Prepare images for lightbox
  const lightboxImages = useMemo<LightboxImage[]>(() => {
    if (!suppliesData?.receipts?.images) return []
    return suppliesData.receipts.images.map((url, idx) => ({
      url,
      caption: `Receipt ${idx + 1}`,
      alt: `Receipt ${idx + 1}`,
    }))
  }, [suppliesData])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
          <div className="h-8 bg-white/20 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show placeholder if no supplies data found
  if (!suppliesData) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
          <h2 className="text-2xl font-bold">
            {locale === 'en' ? 'Supplies & Expenses' : locale === 'zh' ? '物资清单与支出' : 'Матеріали та витрати'}
          </h2>
        </div>

        <div className="p-6">
          <div className="p-8 bg-green-50 border-2 border-green-200 rounded-lg text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {locale === 'en' ? 'Project in Preparation' : locale === 'zh' ? '项目正在筹备中' : 'Проект готується'}
                </h4>
                <p className="text-gray-600">
                  {locale === 'en'
                    ? 'Supplies information will be available once the project is completed.'
                    : locale === 'zh'
                    ? '项目完成后将公布物资信息。'
                    : 'Інформація про матеріали буде доступна після завершення проекту.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate subtotal
  const subtotal = suppliesData.supplies.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice.uah)
  }, 0)

  return (
    <>
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-3 md:p-4 text-white">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5" />
          {locale === 'en' ? 'Supplies & Expenses' : locale === 'zh' ? '物资清单与支出' : 'Матеріали та витрати'}
        </h2>
      </div>

      <div className="p-4 md:p-5 space-y-4 md:space-y-5">
        {/* Supplies List Section */}
        <section>
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            {locale === 'en' ? 'Supply List & Unit Prices' : locale === 'zh' ? '物资清单与单价明细' : 'Список матеріалів та ціни'}
          </h3>

          <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-green-100 to-teal-100 px-2 md:px-3 py-2 grid grid-cols-12 gap-2 md:gap-3 font-semibold text-xs md:text-sm text-gray-900 border-b border-gray-300">
              <div className="col-span-5 md:col-span-6">
                {locale === 'en' ? 'Item' : locale === 'zh' ? '物品名称' : 'Назва'}
              </div>
              <div className="col-span-3 md:col-span-2 text-center">
                {locale === 'en' ? 'Qty' : locale === 'zh' ? '数量' : 'К-сть'}
              </div>
              <div className="col-span-4 text-right">
                {locale === 'en' ? 'Unit Price' : locale === 'zh' ? '单价' : 'Ціна'}
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
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold text-xs">
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
                  {locale === 'en' ? 'Total' : locale === 'zh' ? '总计' : 'Всього'}
                </div>
                <div className="col-span-3 md:col-span-2 text-center">
                  <span className="inline-block px-2 py-0.5 bg-green-600 text-white rounded-full font-bold text-xs">
                    {suppliesData.total.items} {locale === 'en' ? 'items' : locale === 'zh' ? '件' : 'шт'}
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
            <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <span className="italic">{suppliesData.exchangeRateNote}</span>
          </div>
        </section>

        {/* Expense Receipts Section */}
        <section className="border-t border-gray-200 pt-3 md:pt-4">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            {locale === 'en' ? 'Expense Receipts' : locale === 'zh' ? '支出凭证' : 'Квитанції про витрати'}
          </h3>

          {suppliesData.receipts.images && suppliesData.receipts.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {suppliesData.receipts.images.map((imageSrc, idx) => (
                <button
                  key={idx}
                  onClick={() => openLightbox(idx)}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-sm border border-gray-200 group cursor-pointer"
                >
                  <Image
                    src={imageSrc}
                    alt={`Receipt ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-dashed border-gray-300 text-center">
              <Receipt className="w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">
                {suppliesData.receipts.description}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">
                {locale === 'en'
                  ? 'Receipt images will be displayed here once uploaded'
                  : locale === 'zh'
                  ? '凭证图片上传后将在此处显示'
                  : 'Зображення квитанцій будуть відображені тут після завантаження'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>

    {/* Lightbox */}
    <ImageLightbox
      images={lightboxImages}
      initialIndex={lightboxIndex}
      isOpen={lightboxOpen}
      onClose={() => setLightboxOpen(false)}
    />
  </>
  )
}
