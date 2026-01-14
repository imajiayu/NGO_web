'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { PackageIcon, FileTextIcon, DollarSignIcon, ReceiptIcon } from '@/components/icons'
import { TwinklingStars } from '../components'
import type { SuppliesSectionProps } from '../types'

export default function SuppliesSection({
  suppliesData,
  locale,
  onReceiptClick,
}: SuppliesSectionProps) {
  const t = useTranslations('projects')

  return (
    <article className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative bg-gradient-to-r from-christmas-pine via-emerald-700 to-teal-700 p-4 overflow-hidden">
        <TwinklingStars count={4} />
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <PackageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg md:text-xl font-bold text-white">
              {t('project3.suppliesExpenses')}
            </h2>
            <p className="text-xs text-white/80">{t('project3.suppliesExpensesDesc')}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Table */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <FileTextIcon className="w-4 h-4 text-christmas-pine" />
            <h3 className="font-display text-sm font-bold text-gray-900">
              {t('project3.supplyList')}
            </h3>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-christmas-pine/10 to-emerald-50 px-3 py-2 grid grid-cols-12 gap-2 font-semibold text-xs text-gray-700 border-b border-gray-200">
              <div className="col-span-5 md:col-span-6">{t('item')}</div>
              <div className="col-span-3 md:col-span-2 text-center">{t('quantity')}</div>
              <div className="col-span-4 text-right">{t('unitPrice')}</div>
            </div>
            <div className="divide-y divide-gray-100">
              {suppliesData.supplies.map((supply, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 grid grid-cols-12 gap-2 items-center hover:bg-christmas-cream/30 transition-colors"
                >
                  <div className="col-span-5 md:col-span-6 font-medium text-xs text-gray-800">
                    {supply.item}
                  </div>
                  <div className="col-span-3 md:col-span-2 text-center">
                    <span className="inline-block px-2 py-0.5 bg-christmas-pine/10 text-christmas-pine rounded-full font-bold text-[10px]">
                      ×{supply.quantity}
                    </span>
                  </div>
                  <div className="col-span-4 text-right">
                    <div className="font-bold text-xs text-gray-900 font-data">
                      ₴{supply.unitPrice.uah.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-500">(${supply.unitPrice.usd})</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-christmas-pine to-emerald-600 px-3 py-3 grid grid-cols-12 gap-2 items-center text-white">
              <div className="col-span-5 md:col-span-6 font-display font-bold">{t('total')}</div>
              <div className="col-span-3 md:col-span-2 text-center">
                <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full font-bold text-xs">
                  {suppliesData.total.items} {t('items')}
                </span>
              </div>
              <div className="col-span-4 text-right">
                <div className="font-display font-bold text-lg">
                  ₴{suppliesData.total.totalCost.uah.toLocaleString()}
                </div>
                <div className="text-xs text-white/80">(${suppliesData.total.totalCost.usd})</div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500">
            <DollarSignIcon className="w-3 h-3" />
            <span className="italic">{suppliesData.exchangeRateNote}</span>
          </div>
        </section>

        {/* Receipts */}
        {suppliesData.receipts.images?.length > 0 && (
          <section className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <ReceiptIcon className="w-4 h-4 text-christmas-pine" />
              <h3 className="font-display text-sm font-bold text-gray-900">
                {t('project3.expenseReceipts')}
              </h3>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5">
              {suppliesData.receipts.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onReceiptClick(idx)}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:border-christmas-gold/50 transition-all"
                >
                  <Image
                    src={img}
                    alt={t('project3.receiptImageAlt', { number: idx + 1 })}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 25vw, 14vw"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] text-white font-medium">
                    #{idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
