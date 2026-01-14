'use client'

import type { SectionProps } from '../types'

export default function IntroductionSection({ content }: Pick<SectionProps, 'content'>) {
  return (
    <section className="max-w-3xl">
      {/* Decorative Quote Mark */}
      <div className="text-ukraine-blue-200 text-5xl md:text-6xl font-serif leading-none mb-1 select-none">
        "
      </div>
      {content.introduction.map((paragraph, idx) => (
        <p key={idx} className="text-sm md:text-base text-gray-700 leading-relaxed">
          {paragraph}
        </p>
      ))}
    </section>
  )
}
