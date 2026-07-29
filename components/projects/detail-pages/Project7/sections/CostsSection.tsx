'use client'

import { FileTextIcon, ReceiptIcon } from '@/components/icons'

import type { RehabCosts, Therapy } from '../types'

interface CostsSectionProps {
  costs: RehabCosts
  /** 与康复方案区块共用同一份 therapies，明细与卡片不会各说各话 */
  therapies: Therapy[]
}

export default function CostsSection({ costs, therapies }: CostsSectionProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:rounded-3xl">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-700 to-sky-700 p-4">
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <ReceiptIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white md:text-xl">{costs.title}</h2>
            <p className="text-xs text-white/80">{costs.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <FileTextIcon className="h-4 w-4 text-teal-600" />
          <h3 className="font-display text-sm font-bold text-gray-900">{costs.itemHeader}</h3>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-sky-50 px-3 py-2 text-xs font-semibold text-gray-700">
            <div className="col-span-6 md:col-span-7">{costs.itemHeader}</div>
            <div className="col-span-3 text-center md:col-span-2">{costs.sessionsHeader}</div>
            <div className="col-span-3 text-right">{costs.costHeader}</div>
          </div>

          {/* Rows */}
          {therapies.map((therapy) => (
            <div
              key={therapy.name}
              className="grid grid-cols-12 items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-sm last:border-b-0 odd:bg-slate-50/40"
            >
              <div className="col-span-6 text-gray-800 md:col-span-7">{therapy.name}</div>
              <div className="col-span-3 text-center font-data text-gray-600 md:col-span-2">
                {therapy.sessions}
              </div>
              <div className="col-span-3 text-right font-data font-semibold text-gray-900">
                {costs.currency}
                {therapy.cost}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="grid grid-cols-12 items-center gap-2 bg-gradient-to-r from-teal-600 to-sky-700 px-3 py-3 text-white">
            <div className="col-span-6 font-display font-bold md:col-span-7">
              {costs.totalLabel}
            </div>
            <div className="col-span-3 text-center md:col-span-2">
              <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 font-data text-xs font-bold">
                {therapies.reduce((sum, t) => sum + t.sessions, 0)}
                {costs.sessionsUnit}
              </span>
            </div>
            <div className="col-span-3 text-right font-display text-lg font-bold">
              {costs.currency}
              {costs.total.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <p className="pt-1 text-xs italic leading-relaxed text-gray-500">{costs.note}</p>
      </div>
    </article>
  )
}
