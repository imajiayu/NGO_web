'use client'

import { useTranslations } from 'next-intl'

import ExpenseTableSection from '@/components/projects/shared/ExpenseTableSection'

import type { BundleContent, BundleItem, BundleItemType } from '../types'

interface SuppliesSectionProps {
  bundle: BundleContent
}

const iconBase: React.SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as React.SVGProps<SVGSVGElement>

const FOOD_ICON = (
  <svg {...iconBase} className="h-3.5 w-3.5">
    <path d="M12 7c2-2 5-2 6 0 1 2 0 7-2 10-2 2-3 2-4 0-1 2-2 2-4 0-2-3-3-8-2-10 1-2 4-2 6 0z" />
    <path d="M12 7V4" />
    <path d="M14 5c0-1 1-2 2-2" />
  </svg>
)

const HYGIENE_ICON = (
  <svg {...iconBase} className="h-3.5 w-3.5">
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7" />
    <path d="M9 18h6" />
  </svg>
)

const CLOTHING_ICON = (
  <svg {...iconBase} className="h-3.5 w-3.5">
    <path d="M8 4l-4 3 1.5 3 2.5-1v11h12V9l2.5 1L22 7l-4-3" />
    <path d="M8 4c0 2 2 4 4 4s4-2 4-4" />
  </svg>
)

const DETERGENT_ICON = (
  <svg {...iconBase} className="h-3.5 w-3.5">
    <circle cx="9" cy="14" r="4.5" />
    <circle cx="16.5" cy="9" r="2.5" />
    <circle cx="17" cy="17.5" r="2" />
  </svg>
)

const CATEGORY_ICONS: Record<BundleItemType, React.ReactElement> = {
  food: FOOD_ICON,
  hygiene: HYGIENE_ICON,
  clothing: CLOTHING_ICON,
  detergent: DETERGENT_ICON,
}

function CategoryRows({ item, isFirst }: { item: BundleItem; isFirst: boolean }) {
  const Icon = CATEGORY_ICONS[item.type]
  return (
    <div>
      {/* Category header row — icon + label + subtotal */}
      <div
        className={`flex items-center gap-2 bg-christmas-pine/5 px-3 py-1.5 ${isFirst ? '' : 'border-t border-gray-100'}`}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-christmas-pine/15 text-christmas-pine">
          {Icon}
        </div>
        <span className="text-xs font-semibold text-christmas-pine">{item.label}</span>
        <div className="flex-1" />
        <span className="font-data text-[11px] font-bold text-christmas-pine">
          ₴{item.subtotal.uah.toLocaleString('en-US')}
        </span>
        <span className="font-data text-[10px] text-gray-400">(${item.subtotal.usd})</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
        {item.items.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 items-center gap-2 px-3 py-2 transition-colors hover:bg-christmas-cream/30"
          >
            <div className="col-span-5 text-xs font-medium text-gray-800 md:col-span-6">
              {row.name}
            </div>
            <div className="col-span-3 text-center md:col-span-2">
              <span className="inline-block rounded-full bg-christmas-pine/10 px-2 py-0.5 text-[10px] font-bold text-christmas-pine">
                ×{row.qty}
                {row.qtyUnit && (
                  <span className="ml-0.5 font-normal text-christmas-pine/65">{row.qtyUnit}</span>
                )}
              </span>
            </div>
            <div className="col-span-4 text-right">
              <div className="font-data text-xs font-bold text-gray-900">
                ₴{row.unitPrice.uah.toLocaleString('en-US')}
              </div>
              <div className="text-[10px] text-gray-500">(${row.unitPrice.usd})</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjectGoalCallout({
  totals,
  labels,
}: {
  totals: BundleContent['totals']
  labels: BundleContent['labels']
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50">
      <div className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-3.5">
        <div className="flex items-baseline gap-2">
          <span className="font-data text-sm font-semibold text-stone-800">
            ₴{totals.perPackage.uah.toLocaleString('en-US')}
          </span>
          <span className="text-[11px] text-stone-500">
            {labels.perPackage} × {totals.packageCount}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[10px] uppercase tracking-[0.18em] text-rose-700/75 md:text-[11px]">
            {labels.grandTotal}
          </span>
          <span className="font-data text-lg font-bold text-rose-800 md:text-xl">
            ₴{totals.grandTotal.uah.toLocaleString('en-US')}
          </span>
          <span className="font-data text-xs text-stone-500">(${totals.grandTotal.usd})</span>
        </div>
      </div>
    </div>
  )
}

export default function SuppliesSection({ bundle }: SuppliesSectionProps) {
  const t = useTranslations('projects')

  const totalItemCount = bundle.items.reduce(
    (sum, cat) => sum + cat.items.reduce((s, row) => s + row.qty, 0),
    0
  )

  return (
    <ExpenseTableSection
      title={bundle.labels.sectionTitle}
      description={bundle.labels.sectionSubtitle}
      tableTitle={t('project6.perPackageTableTitle')}
      total={{ items: totalItemCount, totalCost: bundle.totals.perPackage }}
      exchangeRateNote={bundle.labels.exchangeRateNote}
      receiptsTitle={bundle.labels.receiptsTitle}
      receipts={{ description: bundle.labels.receiptsPlaceholder }}
      afterContent={<ProjectGoalCallout totals={bundle.totals} labels={bundle.labels} />}
    >
      {bundle.items.map((cat, idx) => (
        <CategoryRows key={cat.type} item={cat} isFirst={idx === 0} />
      ))}
    </ExpenseTableSection>
  )
}
