import type { Metadata } from 'next'
import { Fraunces, Source_Sans_3, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Analytics } from '@vercel/analytics/react'
import { locales } from '@/i18n/config'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import '../globals.css'

// 标题字体 - Fraunces 可变字体 (温暖有机的衬线字体)
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700', '800', '900'],
})

// 正文字体 - Source Sans 3 (温暖友好的无衬线)
const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  variable: '--font-source-sans',
  weight: ['300', '400', '500', '600', '700'],
})

// 数据字体 - JetBrains Mono (清晰醒目的等宽字体)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'WAY - Making a Difference',
  description: 'Support meaningful projects and make a real impact',
  icons: {
    icon: [
      { url: '/favicon-128.webp', sizes: '128x128', type: 'image/webp' },
      { url: '/favicon-512.webp', sizes: '512x512', type: 'image/webp' },
    ],
    apple: [
      { url: '/favicon-512.webp', sizes: '512x512', type: 'image/webp' },
    ],
  },
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Get messages for the locale
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${fraunces.variable} ${sourceSans.variable} ${jetbrainsMono.variable} font-body antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
