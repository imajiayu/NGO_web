'use client'

import { useState } from 'react'
import type { Database } from '@/types/database'
import DonationEditModal from './DonationEditModal'

type Donation = Database['public']['Tables']['donations']['Row'] & {
  projects: { project_name: string; project_name_i18n: any }
}

interface Props {
  initialDonations: Donation[]
}

export default function DonationsTable({ initialDonations }: Props) {
  const [donations, setDonations] = useState(initialDonations)
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const handleEdit = (donation: Donation) => {
    setEditingDonation(donation)
  }

  const handleSaved = (updated: Database['public']['Tables']['donations']['Row']) => {
    setDonations(donations.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)))
    setEditingDonation(null)
  }

  // Get unique projects for filter
  const uniqueProjects = Array.from(
    new Map(donations.map((d) => [d.project_id, d.projects])).entries()
  ).map(([id, project]) => ({ id, name: project.project_name }))

  const filteredDonations = donations.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.donation_status === statusFilter
    const matchesProject = projectFilter === 'all' || d.project_id === Number(projectFilter)
    return matchesStatus && matchesProject
  })

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivering">Delivering</option>
              <option value="completed">Completed</option>
              <option value="refunding">Refunding</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">
              Project:
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-sm text-gray-500">
            Total: {filteredDonations.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Donor / Email
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.map((donation) => (
                <tr
                  key={donation.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(donation)}
                >
                  <td className="px-3 py-3 text-sm text-gray-900">
                    <div className="font-medium">#{donation.id}</div>
                    <div className="text-xs text-gray-500">{donation.donation_public_id}</div>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <div className="font-medium text-gray-900">{donation.donor_name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                      {donation.donor_email}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 max-w-[150px]">
                    <div className="truncate">{donation.projects.project_name}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    {donation.amount} {donation.currency || 'UAH'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        donation.donation_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : donation.donation_status === 'delivering'
                            ? 'bg-blue-100 text-blue-800'
                            : donation.donation_status === 'confirmed'
                              ? 'bg-purple-100 text-purple-800'
                              : donation.donation_status === 'paid'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {donation.donation_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500">
                    <div>{new Date(donation.donated_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(donation.donated_at).toLocaleTimeString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingDonation && (
        <DonationEditModal
          donation={editingDonation}
          onClose={() => setEditingDonation(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
