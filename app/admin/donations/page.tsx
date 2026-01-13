import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/supabase/admin-auth'
import { getAdminDonations } from '@/app/actions/admin'
import DonationsTable from '@/components/admin/DonationsTable'

export default async function AdminDonationsPage() {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const { donations, history } = await getAdminDonations()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-body">Donations</h1>
      </div>
      <DonationsTable initialDonations={donations} statusHistory={history} />
    </div>
  )
}
