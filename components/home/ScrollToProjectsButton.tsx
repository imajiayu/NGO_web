'use client'

import { scrollToElementById } from '@/lib/scroll-to-section'

interface Props {
  label: string
}

export default function ScrollToProjectsButton({ label }: Props) {
  const handleClick = () => scrollToElementById('projects-section')

  return (
    <button
      onClick={handleClick}
      className="group relative inline-flex flex-shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-ukraine-gold-500 px-6 py-3 font-semibold tracking-wide text-ukraine-blue-900 shadow-md transition-all duration-200 hover:bg-ukraine-gold-600 hover:shadow-lg"
    >
      {/* 与导航栏捐赠按钮一致的微光扫过效果 */}
      <div className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      <span className="relative z-10 whitespace-nowrap">{label}</span>
      <svg
        className="relative z-10 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </button>
  )
}
