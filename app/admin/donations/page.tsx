import { redirect } from 'next/navigation'

import { getAdminDonations } from '@/app/actions/admin'
import DonationsTable from '@/components/admin/DonationsTable'
import { getAdminUser } from '@/lib/supabase/admin-auth'
import { getAllProjectsWithStats } from '@/lib/supabase/queries'

export default async function AdminDonationsPage() {
  const user = await getAdminUser()
  if (!user) {
    redirect('/admin/login')
  }

  // Projects feed the offline-donation form: it switches between quantity and
  // amount input on aggregate_donations, and shows the remaining target.
  // The cached variant is fine here — createOfflineDonation busts
  // PROJECTS_CACHE_TAG on write, and the authoritative target check runs
  // server-side against a fresh read anyway.
  const [{ donations, history }, projects] = await Promise.all([
    getAdminDonations(),
    getAllProjectsWithStats(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-body text-2xl font-bold text-gray-900">Donations</h1>
      </div>
      <DonationsTable initialDonations={donations} statusHistory={history} projects={projects} />
    </div>
  )
}
