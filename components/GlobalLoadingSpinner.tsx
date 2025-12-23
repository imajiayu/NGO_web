'use client'

import { useTranslations } from 'next-intl'

interface GlobalLoadingSpinnerProps {
  isLoading: boolean
  loadingText?: string // Optional custom loading text
}

export default function GlobalLoadingSpinner({ isLoading, loadingText }: GlobalLoadingSpinnerProps) {
  // Try to use translations if available, otherwise use custom text or default fallback
  let displayText = loadingText || 'Loading...'

  try {
    const t = useTranslations('common')
    displayText = loadingText || t('loading')
  } catch {
    // If translations are not available (e.g., in admin pages), use the fallback
  }

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Spinning loader */}
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-white/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
      </div>

      {/* Loading text */}
      <p className="text-lg font-medium text-white">
        {displayText}
      </p>
    </div>
  )
}
