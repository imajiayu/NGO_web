'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { SectionProps } from '../types'

interface SuccessStoriesSectionProps extends Pick<SectionProps, 'content'> {
  onImageClick: (index: number) => void
}

export default function SuccessStoriesSection({ content, onImageClick }: SuccessStoriesSectionProps) {
  const t = useTranslations('projects')

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-6 bg-gradient-to-b from-ukraine-gold-500 to-amber-400 rounded-full" />
        <h2 className="font-display text-lg md:text-xl font-bold text-gray-900">
          {t('project0.storiesOfHope')}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {content.successStories.map((story, idx) => (
          <div
            key={idx}
            className="group relative rounded-xl md:rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => onImageClick(idx)}
          >
            <div className="relative">
              <Image
                src={story.image}
                alt={story.title}
                width={800}
                height={600}
                className="w-full h-auto transition-all duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                <h3 className="font-display font-bold text-white text-xs md:text-sm leading-tight">
                  {story.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
