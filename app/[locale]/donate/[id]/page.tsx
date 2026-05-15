import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { locales } from '@/i18n/config'
import { BASE_URL, getAlternates } from '@/lib/constants'
import { getTranslatedText } from '@/lib/i18n-utils'
import { loadProjectContentMeta } from '@/lib/projects/project-content'
import { SUPPORTED_PROJECT_IDS } from '@/lib/projects/supported'
import { getAllProjectsWithStats, getProjectStats } from '@/lib/supabase/queries'
import type { AppLocale, ProjectStats } from '@/types'

import DonatePageClient from '../DonatePageClient'

export const revalidate = 60

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    SUPPORTED_PROJECT_IDS.map((id) => ({ locale, id: String(id) }))
  )
}

export async function generateMetadata({ params }: Props) {
  const { locale, id } = await params
  const projectId = Number(id)
  if (!Number.isInteger(projectId)) return {}

  const [project, contentMeta, tCommon, tMeta] = await Promise.all([
    getProjectStats(projectId).catch(() => null) as Promise<ProjectStats | null>,
    loadProjectContentMeta(projectId, locale),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'metadata' }),
  ])

  if (!project) return {}

  const appName = tCommon('appName')
  // DB 项目名优先（与卡片显示一致），JSON title 作 fallback（去换行符避免进 OG meta）。
  const projectName =
    getTranslatedText(project.project_name_i18n, locale as AppLocale) ||
    contentMeta?.title?.replace(/\s*\n\s*/g, ' — ') ||
    appName
  const description = contentMeta?.subtitle || tMeta('donateDescription')

  const cardImage = `/images/projects/project-${projectId}/card/bg.webp`
  const url = `${BASE_URL}/${locale}/donate/${projectId}`

  return {
    title: `${projectName} — ${appName}`,
    description,
    openGraph: {
      title: projectName,
      description,
      url,
      images: [{ url: cardImage, width: 1200, height: 800, alt: projectName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: projectName,
      description,
      images: [cardImage],
    },
    alternates: getAlternates(`/${locale}/donate/${projectId}`),
  }
}

export default async function DonatePageWithProject({ params }: Props) {
  const { locale, id } = await params
  const projectId = Number(id)

  if (!Number.isInteger(projectId) || !SUPPORTED_PROJECT_IDS.includes(projectId)) {
    notFound()
  }

  const projects = await getAllProjectsWithStats()
  if (!projects.some((p) => p.id === projectId)) notFound()

  return <DonatePageClient projects={projects} locale={locale} initialProjectId={projectId} />
}
