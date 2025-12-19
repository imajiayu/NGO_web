import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ requestLocale }) => {
  // This function runs for all requests to the app, and will be given the locale that was set by
  // the middleware (i.e. the first pathname segment like "en" or "zh")
  let locale = await requestLocale

  // Validate the locale
  const locales = ['en', 'zh', 'ua']
  if (!locale || !locales.includes(locale)) {
    locale = 'en'
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
