'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import DonationResultViewer from './DonationResultViewer'
import { formatDate, type SupportedLocale } from '@/lib/i18n-utils'

type Donation = {
  id: number
  donation_public_id: string
  donor_email_obfuscated: string | null
  amount: number
  currency: string
  donation_status: 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded'
  donated_at: string
}

interface ProjectDonationListProps {
  projectId: number | null
  projectName: string
  locale?: string
}

export default function ProjectDonationList({
  projectId,
  projectName,
  locale = 'en'
}: ProjectDonationListProps) {
  const t = useTranslations('projectDonationList')
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(false)
  const [viewResultDonationId, setViewResultDonationId] = useState<string | null>(null)

  // Fetch donations when projectId changes
  useEffect(() => {
    if (!projectId) {
      setDonations([])
      return
    }

    const fetchDonations = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/donations/project-public/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setDonations(data)
        }
      } catch (error) {
        console.error('Error fetching donations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDonations()
  }, [projectId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'delivering':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-purple-100 text-purple-800'
      case 'refunding':
        return 'bg-orange-100 text-orange-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // No project selected
  if (!projectId) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!donations || donations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">{t('title')}</h2>
        <p className="text-gray-500 text-center py-8">{t('noDonations')}</p>
      </div>
    )
  }

  // Donations table
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900">{t('title')}</h2>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.email')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.donationId')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.amount')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.time')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.status')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.action')}</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 text-sm text-gray-600">
                  {donation.donor_email_obfuscated || 'N/A'}
                </td>
                <td className="py-4 px-4">
                  <code className="text-sm font-mono bg-blue-50 text-blue-900 px-2 py-1 rounded border border-blue-200">
                    {donation.donation_public_id}
                  </code>
                </td>
                <td className="py-4 px-4 text-sm font-medium text-gray-900">
                  {donation.currency} {donation.amount.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {formatDate(donation.donated_at, locale as SupportedLocale)}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.donation_status)}`}>
                    {t(`status.${donation.donation_status}`)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {donation.donation_status === 'completed' && (
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      onClick={() => setViewResultDonationId(donation.donation_public_id)}
                    >
                      {t('actions.viewResult')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on Mobile */}
      <div className="md:hidden space-y-4">
        {donations.map((donation) => (
          <div
            key={donation.id}
            className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Donation ID - Most Prominent */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">{t('columns.donationId')}</div>
              <code className="text-base font-mono bg-blue-600 text-white px-3 py-2 rounded-md inline-block font-semibold shadow-sm">
                {donation.donation_public_id}
              </code>
            </div>

            {/* Amount and Status Row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1">{t('columns.amount')}</div>
                <div className="text-lg font-bold text-gray-900">
                  {donation.currency} {donation.amount.toFixed(2)}
                </div>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.donation_status)}`}>
                  {t(`status.${donation.donation_status}`)}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-700 mb-1">{t('columns.email')}</div>
              <div className="text-sm text-gray-900 font-medium break-all">
                {donation.donor_email_obfuscated || 'N/A'}
              </div>
            </div>

            {/* Time */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700 mb-1">{t('columns.time')}</div>
              <div className="text-sm text-gray-900">
                {formatDate(donation.donated_at, locale as SupportedLocale)}
              </div>
            </div>

            {/* Action Button */}
            {donation.donation_status === 'completed' && (
              <button
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                onClick={() => setViewResultDonationId(donation.donation_public_id)}
              >
                {t('actions.viewResult')}
              </button>
            )}
          </div>
        ))}
      </div>

      {donations.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center font-medium">
          {t('totalDonations', { count: donations.length })}
        </div>
      )}

      {/* Result Viewer Modal */}
      {viewResultDonationId && (
        <DonationResultViewer
          donationPublicId={viewResultDonationId}
          onClose={() => setViewResultDonationId(null)}
        />
      )}
    </div>
  )
}
