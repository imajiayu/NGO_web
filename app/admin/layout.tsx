import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getAdminSession } from '@/lib/supabase/admin-auth'
import AdminNav from '@/components/admin/AdminNav'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Admin panel for managing projects and donations',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  // Get English messages for admin panel
  const messages = await getMessages({ locale: 'en' })

  // 如果未登录且不是登录页面，返回登录页面布局
  if (!session) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <NextIntlClientProvider messages={messages} locale="en">
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale="en">
          <div className="min-h-screen bg-gray-50">
            <AdminNav />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
