export const locales = ['en', 'zh', 'ua'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ua: 'Українська',
}

export const localeLabels: Record<Locale, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  zh: { native: '中文', english: 'Chinese' },
  ua: { native: 'Українська', english: 'Ukrainian' },
}
