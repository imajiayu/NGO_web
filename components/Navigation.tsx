'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { locales, localeNames } from '@/i18n/config'
import { useState, useTransition } from 'react'

export default function Navigation() {
  const t = useTranslations('navigation')
  const tMeta = useTranslations('metadata')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
    setIsDropdownOpen(false)
  }

  const handleDonateClick = () => {
    router.push('/donate')
  }

  const handleTrackDonation = () => {
    router.push('/track-donation')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <a
              href={`/${locale}`}
              className="flex items-center transition-opacity duration-200 hover:opacity-75 cursor-pointer"
            >
              <Image
                src="/images/logo.svg"
                alt={tMeta('logoAlt')}
                width={200}
                height={100}
                className="h-12 w-auto"
                priority
              />
            </a>
          </div>

          {/* Right: Action Buttons + Language Switcher */}
          <div className="flex items-center space-x-3">
            {/* Action Buttons (Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={handleTrackDonation}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                {t('trackDonation')}
              </button>
              <button
                onClick={handleDonateClick}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {t('donate')}
              </button>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isPending}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('language.label')}
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
                <span>{localeNames[locale as keyof typeof localeNames]}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    {locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          locale === loc
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{localeNames[loc]}</span>
                          {locale === loc && (
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Action Buttons Row */}
        <div className="md:hidden pb-3 pt-1 flex items-center justify-center space-x-3 px-4">
          <button
            onClick={handleTrackDonation}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg active:border-gray-400 active:bg-gray-50 transition-all duration-200"
          >
            {t('trackDonation')}
          </button>
          <button
            onClick={handleDonateClick}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 active:from-blue-700 active:to-purple-700 rounded-lg transition-all duration-200 shadow-md"
          >
            {t('donate')}
          </button>
        </div>
      </div>
    </nav>
  )
}
