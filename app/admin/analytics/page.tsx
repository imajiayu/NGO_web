import { redirect } from 'next/navigation'

import { getAnalyticsSummary } from '@/app/actions/admin'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import { getAdminUser } from '@/lib/supabase/admin-auth'

export default async function AdminAnalyticsPage() {
  const user = await getAdminUser()
  if (!user) {
    redirect('/admin/login')
  }

  const initialData = await getAnalyticsSummary('30d')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-body text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Page-level exposure, CTA click and conversion funnel for projects and market items.
        </p>
      </div>
      <AnalyticsDashboard initial={initialData} />
    </div>
  )
}
