import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming `locale` parameter is valid
  let locale = (await requestLocale) || 'en'
  const isValidLocale = locales.some((l) => l === locale)

  if (!isValidLocale) {
    locale = 'en' // Default to 'en' if invalid
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  }
})
