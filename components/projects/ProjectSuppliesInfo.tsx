'use client'

import { useState, useEffect } from 'react'
import { Package, DollarSign, Receipt, FileText } from 'lucide-react'
import Image from 'next/image'

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
          <div className="p-6 bg-yellow-50 border-2 border-yellow-200 border-dashed rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold text-yellow-900 mb-1">
                  {locale === 'en' ? 'Data Not Available' : locale === 'zh' ? '数据暂未提供' : 'Дані недоступні'}
                </h4>
                <p className="text-sm text-yellow-800">
                  {locale === 'en'
                    ? 'Supplies data has not been added yet. Create: '
                    : locale === 'zh'
                    ? '物资数据尚未添加。请创建：'
                    : 'Дані про матеріали ще не додано. Створіть: '}
                  <code className="bg-yellow-100 px-2 py-0.5 rounded text-xs ml-1">
                    content/projects/project-{projectId}-supplies-{locale}.json
                  </code>
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
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          {locale === 'en' ? 'Supplies & Expenses' : locale === 'zh' ? '物资清单与支出' : 'Матеріали та витрати'}
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Supplies List Section */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            {locale === 'en' ? 'Supply List & Unit Prices' : locale === 'zh' ? '物资清单与单价明细' : 'Список матеріалів та ціни'}
          </h3>

          <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-green-100 to-teal-100 px-4 py-3 grid grid-cols-12 gap-4 font-semibold text-sm text-gray-900 border-b border-gray-300">
              <div className="col-span-6">
                {locale === 'en' ? 'Item' : locale === 'zh' ? '物品名称' : 'Назва'}
              </div>
              <div className="col-span-2 text-center">
                {locale === 'en' ? 'Quantity' : locale === 'zh' ? '数量' : 'Кількість'}
              </div>
              <div className="col-span-4 text-right">
                {locale === 'en' ? 'Unit Price' : locale === 'zh' ? '单价' : 'Ціна за одиницю'}
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {suppliesData.supplies.map((supply, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-white transition-colors"
                >
                  <div className="col-span-6 font-medium text-gray-900">
                    {supply.item}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                      ×{supply.quantity}
                    </span>
                  </div>
                  <div className="col-span-4 text-right">
                    <div className="font-bold text-gray-900">
                      ₴{supply.unitPrice.uah.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      (${supply.unitPrice.usd})
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer - Total */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 px-4 py-4 border-t-2 border-green-300">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6 font-bold text-gray-900 text-lg">
                  {locale === 'en' ? 'Total' : locale === 'zh' ? '总计' : 'Всього'}
                </div>
                <div className="col-span-2 text-center">
                  <span className="inline-block px-3 py-1 bg-green-600 text-white rounded-full font-bold text-sm">
                    {suppliesData.total.items} {locale === 'en' ? 'items' : locale === 'zh' ? '件' : 'шт'}
                  </span>
                </div>
                <div className="col-span-4 text-right">
                  <div className="font-bold text-green-600 text-xl">
                    ₴{suppliesData.total.totalCost.uah.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-700 font-semibold">
                    (${suppliesData.total.totalCost.usd.toLocaleString()} USD)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate Note */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="italic">{suppliesData.exchangeRateNote}</span>
          </div>
        </section>

        {/* Expense Receipts Section */}
        <section className="border-t-2 border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-600" />
            {locale === 'en' ? 'Expense Receipts' : locale === 'zh' ? '支出凭证' : 'Квитанції про витрати'}
          </h3>

          {suppliesData.receipts.images && suppliesData.receipts.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliesData.receipts.images.map((imageSrc, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md border-2 border-gray-200">
                  <Image
                    src={imageSrc}
                    alt={`Receipt ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-2">
                {suppliesData.receipts.description}
              </p>
              <p className="text-sm text-gray-500">
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
  )
}
