'use client'

import { ArrowRightIcon, Building2Icon } from '@/components/icons'
import { Link } from '@/i18n/navigation'

import type { AttributionContent } from '../types'

export default function AttributionSection({ attribution }: { attribution: AttributionContent }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-4 shadow-sm md:p-6">
      <figure>
        <blockquote className="font-display text-base leading-relaxed text-slate-800 md:text-lg">
          {attribution.quote}
        </blockquote>

        <figcaption className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 shadow-sm">
            <Building2Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-slate-900">{attribution.name}</p>
            <p className="text-xs text-slate-500">
              {attribution.role} · {attribution.organization}
            </p>
          </div>
        </figcaption>
      </figure>

      <Link
        href={`/donate/${attribution.projectId}`}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-teal-700 shadow-sm ring-1 ring-teal-200/70 transition-colors hover:bg-teal-50"
      >
        {attribution.linkLabel}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </section>
  )
}
