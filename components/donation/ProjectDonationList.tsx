'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import DonationResultViewer from './DonationResultViewer'
import DonationStatusBadge from './DonationStatusBadge'
import { formatDate, type SupportedLocale } from '@/lib/i18n-utils'
import { canViewResult, type DonationStatus } from '@/lib/donation-status'

type Donation = {
  id: number
  donation_public_id: string
  donor_email_obfuscated: string | null
  order_id: string // MD5 hash for grouping donations from same payment
  amount: number
  currency: string
  donation_status: DonationStatus
  donated_at: string
  updated_at: string
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

  // Helper function to group donations by order_id
  const groupDonationsByOrder = (donations: Donation[]): Donation[][] => {
    const groups: { [key: string]: Donation[] } = {}

    donations.forEach(donation => {
      const orderId = donation.order_id
      if (!groups[orderId]) {
        groups[orderId] = []
      }
      groups[orderId].push(donation)
    })

    return Object.values(groups)
  }

  // Get grouped donations
  const donationGroups = groupDonationsByOrder(donations)

  // Fetch donations when projectId changes
  useEffect(() => {
    if (projectId === null) {
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

  // No project selected
  if (projectId === null) {
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
        <h2 className="text-2xl font-bold mb-6 font-display">{t('title')}</h2>
        <p className="text-gray-500 text-center py-8">{t('noDonations')}</p>
      </div>
    )
  }

  // Donations table
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 font-display">{t('title')}</h2>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.email')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.donationId')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.amount')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.time')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.updatedAt')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.status')}</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('columns.action')}</th>
            </tr>
          </thead>
          <tbody>
            {donationGroups.map((group, groupIndex) => (
              <React.Fragment key={`group-${groupIndex}`}>
                {/* Group wrapper - only show border if group has multiple donations */}
                {group.map((donation, donationIndex) => (
                  <tr
                    key={donation.id}
                    className={`
                      border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${group.length > 1 ? 'border-l-4 border-l-blue-500' : ''}
                      ${group.length > 1 && donationIndex === 0 ? 'border-t-2 border-t-blue-500' : ''}
                      ${group.length > 1 && donationIndex === group.length - 1 ? 'border-b-2 border-b-blue-500' : ''}
                    `}
                  >
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {donation.donor_email_obfuscated || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <code className="text-sm font-data bg-ukraine-blue-50 text-ukraine-blue-900 px-2 py-1 rounded border border-ukraine-blue-200">
                        {donation.donation_public_id}
                      </code>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                      {donation.currency} {donation.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(donation.donated_at, locale as SupportedLocale)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(donation.updated_at, locale as SupportedLocale)}
                    </td>
                    <td className="py-4 px-4">
                      <DonationStatusBadge status={donation.donation_status} namespace="projectDonationList" />
                    </td>
                    <td className="py-4 px-4">
                      {canViewResult(donation.donation_status) && (
                        <button
                          className="text-sm text-ukraine-blue-500 hover:text-ukraine-blue-600 font-medium hover:underline"
                          onClick={() => setViewResultDonationId(donation.donation_public_id)}
                        >
                          {t('actions.viewResult')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on Mobile */}
      <div className="md:hidden space-y-2">
        {donationGroups.map((group, groupIndex) => (
          <div
            key={`mobile-group-${groupIndex}`}
            className={`
              ${group.length > 1 ? 'border-l-4 border-ukraine-blue-500 bg-ukraine-blue-50/20 rounded-r-lg' : ''}
            `}
          >
            {/* Compact group indicator */}
            {group.length > 1 && (
              <div className="px-2 pt-1.5 pb-1">
                <div className="text-[10px] font-bold text-ukraine-blue-500 uppercase tracking-wider flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                  </svg>
                  <span>{t('groupIndicator', { count: group.length })}</span>
                </div>
              </div>
            )}

            <div className={`${group.length > 1 ? 'space-y-1.5' : 'space-y-2'}`}>
              {group.map((donation) => (
                <div
                  key={donation.id}
                  className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm"
                >
                  {/* Row 1: Donation ID (full width) */}
                  <div className="mb-2">
                    <code className="text-xs font-data bg-ukraine-blue-500 text-white px-2 py-1 rounded font-semibold">
                      {donation.donation_public_id}
                    </code>
                  </div>

                  {/* Row 2: Amount + Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-base font-bold text-gray-900">
                      {donation.currency} {donation.amount.toFixed(2)}
                    </div>
                    <div className="scale-90 origin-right">
                      <DonationStatusBadge status={donation.donation_status} namespace="projectDonationList" />
                    </div>
                  </div>

                  {/* Row 3: Email (compact) */}
                  <div className="mb-1.5 flex items-baseline gap-1.5">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide shrink-0">{t('emailLabel')}</span>
                    <span className="text-xs text-gray-900 font-medium break-all leading-tight">
                      {donation.donor_email_obfuscated || 'N/A'}
                    </span>
                  </div>

                  {/* Row 4: Time + Updated At (two columns) */}
                  <div className="grid grid-cols-2 gap-2 mb-1.5">
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        {t('columns.time')}
                      </div>
                      <div className="text-xs text-gray-900 leading-tight">
                        {formatDate(donation.donated_at, locale as SupportedLocale)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                        {t('columns.updatedAt')}
                      </div>
                      <div className="text-xs text-gray-900 leading-tight">
                        {formatDate(donation.updated_at, locale as SupportedLocale)}
                      </div>
                    </div>
                  </div>

                  {/* Action Button (compact) */}
                  {canViewResult(donation.donation_status) && (
                    <button
                      className="w-full mt-1.5 bg-ukraine-blue-500 hover:bg-ukraine-blue-600 text-white font-medium py-1.5 px-3 rounded text-xs transition-colors"
                      onClick={() => setViewResultDonationId(donation.donation_public_id)}
                    >
                      {t('actions.viewResult')}
                    </button>
                  )}
                </div>
              ))}
            </div>
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
