'use client'

import { ActivityIcon } from '@/components/icons'
import type { SectionProps } from '../types'

export default function TreatmentSection({ content }: Pick<SectionProps, 'content'>) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
          <ActivityIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display text-lg md:text-xl font-bold text-gray-900">
            {content.treatmentPrograms.title}
          </h2>
          <p className="text-xs text-gray-500">{content.treatmentPrograms.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {content.treatmentPrograms.programs.map((program, idx) => (
          <div
            key={idx}
            className="group relative p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-100 hover:border-emerald-300 transition-all duration-300"
          >
            <h3 className="font-display font-bold text-gray-900 mb-1 text-xs md:text-sm">
              {program.name}
            </h3>
            <p className="text-[10px] md:text-xs text-gray-600 leading-relaxed">
              {program.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
