'use client'

import { useState, useMemo } from 'react'
import type { Database } from '@/types/database'
import type { DonationStatus } from '@/types'
import DonationEditModal from './DonationEditModal'
import BatchDonationEditModal from './BatchDonationEditModal'
import DonationStatusBadge from '@/components/donation/DonationStatusBadge'

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

  // 批量编辑状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showBatchEdit, setShowBatchEdit] = useState(false)

  const handleEdit = (donation: Donation) => {
    setEditingDonation(donation)
  }

  const handleSaved = (updated: Database['public']['Tables']['donations']['Row']) => {
    setDonations(donations.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)))
    setEditingDonation(null)
  }

  const handleBatchSaved = (updatedDonations: Database['public']['Tables']['donations']['Row'][]) => {
    setDonations(donations.map((d) => {
      const updated = updatedDonations.find((u) => u.id === d.id)
      return updated ? { ...d, ...updated } : d
    }))
    setSelectedIds(new Set())
    setShowBatchEdit(false)
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(filteredDonations.map(d => d.id))
      setSelectedIds(newSelected)
    } else {
      setSelectedIds(new Set())
    }
  }

  // 单选
  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
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

  // 判断全选状态
  const isAllSelected = filteredDonations.length > 0 &&
    filteredDonations.every(d => selectedIds.has(d.id))
  const isSomeSelected = filteredDonations.some(d => selectedIds.has(d.id)) && !isAllSelected

  // 获取选中的捐赠
  const selectedDonations = useMemo(() => {
    return donations.filter(d => selectedIds.has(d.id))
  }, [donations, selectedIds])

  // 判断是否可以批量操作
  const canBatchEdit = useMemo(() => {
    if (selectedDonations.length === 0) return false

    // 检查所有选中的捐赠状态是否相同
    const statuses = new Set(selectedDonations.map(d => d.donation_status))
    if (statuses.size !== 1) return false

    const commonStatus = selectedDonations[0].donation_status

    // delivering 状态不支持批量修改（需要上传文件）
    if (commonStatus === 'delivering') return false

    return true
  }, [selectedDonations])

  // 获取选中捐赠的共同状态
  const selectedCommonStatus = selectedDonations.length > 0
    ? selectedDonations[0].donation_status
    : null

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
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

            {selectedIds.size > 0 && (
              <span className="text-sm font-medium text-blue-600">
                Selected: {selectedIds.size}
              </span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex gap-2 items-center">
              {!canBatchEdit && (
                <span className="text-sm text-amber-600">
                  {selectedDonations.length > 0 && new Set(selectedDonations.map(d => d.donation_status)).size > 1
                    ? 'Selected donations have different statuses'
                    : selectedCommonStatus === 'delivering'
                      ? 'Delivering status cannot be batch edited'
                      : 'Cannot batch edit'}
                </span>
              )}
              <button
                onClick={() => setShowBatchEdit(true)}
                disabled={!canBatchEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Batch Edit ({selectedIds.size})
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
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
                  className={`hover:bg-gray-50 ${selectedIds.has(donation.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(donation.id)}
                      onChange={(e) => handleSelectOne(donation.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td
                    className="px-3 py-3 text-sm text-gray-900 cursor-pointer"
                    onClick={() => handleEdit(donation)}
                  >
                    <div className="font-medium">#{donation.id}</div>
                    <div className="text-xs text-gray-500">{donation.donation_public_id}</div>
                  </td>
                  <td
                    className="px-3 py-3 text-sm cursor-pointer"
                    onClick={() => handleEdit(donation)}
                  >
                    <div className="font-medium text-gray-900">{donation.donor_name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                      {donation.donor_email}
                    </div>
                  </td>
                  <td
                    className="px-3 py-3 text-sm text-gray-500 max-w-[150px] cursor-pointer"
                    onClick={() => handleEdit(donation)}
                  >
                    <div className="truncate">{donation.projects.project_name}</div>
                  </td>
                  <td
                    className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                    onClick={() => handleEdit(donation)}
                  >
                    {donation.amount} {donation.currency || 'UAH'}
                  </td>
                  <td
                    className="px-3 py-3 whitespace-nowrap cursor-pointer"
                    onClick={() => handleEdit(donation)}
                  >
                    <DonationStatusBadge status={donation.donation_status as DonationStatus} />
                  </td>
                  <td
                    className="px-3 py-3 text-sm text-gray-500 cursor-pointer"
                    onClick={() => handleEdit(donation)}
                  >
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

      {showBatchEdit && (
        <BatchDonationEditModal
          donations={selectedDonations}
          onClose={() => setShowBatchEdit(false)}
          onSaved={handleBatchSaved}
        />
      )}
    </div>
  )
}
