/**
 * Unsubscribed Client Component
 * Client-side component for unsubscribed page with navigation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner'

interface UnsubscribedClientProps {
  locale: string
  hasError: boolean
}

export default function UnsubscribedClient({ locale, hasError }: UnsubscribedClientProps) {
  const t = useTranslations('unsubscribed')
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleBackToHome = () => {
    setIsNavigating(true)
    router.push(`/${locale}`)
  }

  return (
    <>
      <GlobalLoadingSpinner isLoading={isNavigating} loadingText="Loading..." />

      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="mb-6">
            {hasError ? (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          {hasError ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('error.title')}</h1>
              <p className="text-gray-600 mb-6">{t('error.message')}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
              <p className="text-gray-600 mb-2">{t('message')}</p>
              <p className="text-sm text-gray-500 mb-6">{t('description')}</p>

              {/* Resubscribe Information */}
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  {t('resubscribe.title')}
                </p>
                <p className="text-sm text-blue-700">{t('resubscribe.description')}</p>
              </div>
            </>
          )}

          {/* Back to Home Button */}
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {t('backHome')}
          </button>
        </div>
      </div>
    </>
  )
}
