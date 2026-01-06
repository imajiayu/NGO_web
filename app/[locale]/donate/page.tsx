import { getTranslations, getLocale } from 'next-intl/server'
import { getAllProjectsWithStats } from '@/lib/supabase/queries'
import DonatePageClient from './DonatePageClient'

// P0 优化: 添加页面缓存，与 ProjectsGrid 保持一致
export const revalidate = 60

type Props = {
  params: { locale: string }
  searchParams: { project?: string }
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }]
}

export async function generateMetadata() {
  const t = await getTranslations('donate')

  return {
    title: t('title'),
    description: t('selectProjectDescription'),
  }
}

export default async function DonatePage({ searchParams }: Props) {
  const locale = await getLocale()
  const projects = await getAllProjectsWithStats()

  // Get initial project ID from URL parameter (e.g., from home page "Donate Now" button)
  const initialProjectId = searchParams.project
    ? parseInt(searchParams.project)
    : null

  return (
    <DonatePageClient
      projects={projects}
      locale={locale}
      initialProjectId={initialProjectId}
    />
  )
}
