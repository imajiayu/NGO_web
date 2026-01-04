'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { trackDonations, requestRefund } from '@/app/actions/track-donation'
import { Link } from '@/i18n/navigation'
import { Search, Mail, Hash, ArrowRight, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react'
import DonationResultViewer from '@/components/donation/DonationResultViewer'
import DonationStatusBadge from '@/components/donation/DonationStatusBadge'
import { getProjectName, getUnitName, formatDate, type SupportedLocale } from '@/lib/i18n-utils'
import type { I18nText, DonationStatus } from '@/types'

type Donation = {
  id: number
  donation_public_id: string
  order_reference: string
  donor_email: string
  amount: number
  currency: string
  donation_status: DonationStatus
  donated_at: string
  updated_at: string
  projects: {
    id: number
    project_name: string
    project_name_i18n: I18nText | null
    unit_name: string
    unit_name_i18n: I18nText | null
    aggregate_donations: boolean | null
  }
}

type Props = {
  locale: string
}

export default function TrackDonationForm({ locale }: Props) {
  const t = useTranslations('trackDonation')
  const [email, setEmail] = useState('')
  const [donationId, setDonationId] = useState('')
  const [donations, setDonations] = useState<Donation[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refundingDonationId, setRefundingDonationId] = useState<string | null>(null)
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null)
  const [viewResultDonationId, setViewResultDonationId] = useState<string | null>(null)

  // Lock body scroll when confirmation dialog is open
  useEffect(() => {
    if (!confirmRefundId) return

    // Save current scroll position
    const scrollY = window.scrollY

    // Prevent scrolling
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      // Restore scrolling
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''

      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [confirmRefundId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setDonations(null)
    setLoading(true)

    try {
      const result = await trackDonations({ email, donationId })
      if (result.error) {
        setError(t(`errors.${result.error}`))
      } else if (result.donations) {
        setDonations(result.donations as Donation[])
      }
    } catch (err) {
      setError(t('errors.serverError'))
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestRefund(orderReference: string) {
    setRefundingDonationId(orderReference)
    setError('')

    try {
      // Get any donation ID from this order for verification
      const donation = donations?.find(d => d.order_reference === orderReference)
      if (!donation) {
        setError(t('errors.donationNotFound'))
        return
      }

      const result = await requestRefund({
        donationPublicId: donation.donation_public_id,
        email,
      })

      if (result.error) {
        setError(t(`errors.${result.error}`))
      } else if (result.success) {
        // Update all donations in this order to the new status
        const newStatus = (result as any).status || 'refund_processing'
        setDonations(prev =>
          prev ? prev.map(d =>
            d.order_reference === orderReference
              ? { ...d, donation_status: newStatus as DonationStatus }
              : d
          ) : null
        )
        setConfirmRefundId(null)
      }
    } catch (err) {
      setError(t('errors.serverError'))
    } finally {
      setRefundingDonationId(null)
    }
  }


  return (
    <div className="pb-20">
      {/* Search Form Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  {t('form.email')}
                </div>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:border-gray-400 text-gray-900 placeholder:text-gray-400"
                placeholder={t('form.emailPlaceholder')}
              />
            </div>

            {/* Donation ID Input */}
            <div>
              <label htmlFor="donationId" className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  {t('form.donationId')}
                </div>
              </label>
              <input
                id="donationId"
                type="text"
                value={donationId}
                onChange={(e) => setDonationId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:border-gray-400 text-gray-900 placeholder:text-gray-400"
                placeholder={t('form.donationIdPlaceholder')}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('form.searching')}
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                {t('form.submit')}
              </>
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-3 text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {donations && donations.length > 0 && (() => {
        // Group donations by order_reference
        const orderGroups = donations.reduce((acc, donation) => {
          const orderRef = donation.order_reference
          if (!acc[orderRef]) {
            acc[orderRef] = []
          }
          acc[orderRef].push(donation)
          return acc
        }, {} as Record<string, typeof donations>)

        const orders = Object.entries(orderGroups)

        return (
          <div className="space-y-6">
            {/* Results Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('results.title', { count: orders.length })}
              </h2>
            </div>

            {/* Order Cards */}
            <div className="grid gap-4">
              {orders.map(([orderReference, orderDonations]) => {
                const firstDonation = orderDonations[0]

                // Sum all donations in this order regardless of status
                const displayAmount = orderDonations.reduce((sum, d) => sum + Number(d.amount), 0)

                // Only count paid/confirmed/delivering for refundable amount (exclude completed)
                const refundableAmount = orderDonations
                  .filter(d => ['paid', 'confirmed', 'delivering'].includes(d.donation_status))
                  .reduce((sum, d) => sum + Number(d.amount), 0)

                // Get unique projects in this order
                const projectCount = new Set(orderDonations.map(d => d.projects.id)).size

                // Get unit name for display (from first donation's project)
                const unitName = getUnitName(
                  firstDonation.projects.unit_name_i18n,
                  firstDonation.projects.unit_name,
                  locale as SupportedLocale
                )

                // Check if any donation in this order belongs to an aggregate project
                const hasAggregateProject = orderDonations.some(d => d.projects.aggregate_donations === true)

                return (
                  <div
                    key={orderReference}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {t('results.orderTitle')} #{orderReference.slice(-8)}
                          </h3>
                          {projectCount > 1 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {t('results.multipleProjects', { count: projectCount })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order Details Grid */}
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasAggregateProject ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 mb-4`}>
                        {/* Order Reference */}
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">{t('results.orderReference')}</div>
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block text-gray-800">
                            {orderReference}
                          </code>
                        </div>

                        {/* Quantity - hide for aggregate projects */}
                        {!hasAggregateProject && (
                          <div>
                            <div className="text-xs text-gray-500 font-medium mb-1">{t('results.quantity')}</div>
                            <div className="text-lg font-bold text-gray-900">
                              {orderDonations.length} {unitName}
                            </div>
                          </div>
                        )}

                        {/* Total Amount */}
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">{t('results.totalAmount')}</div>
                          <div className="text-lg font-bold text-gray-900">
                            {firstDonation.currency} {displayAmount.toFixed(2)}
                          </div>
                        </div>

                        {/* Date */}
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">{t('results.date')}</div>
                          <div className="text-sm text-gray-700 font-medium">
                            {formatDate(firstDonation.donated_at, locale as SupportedLocale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Individual Donations List */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 font-medium mb-3">{t('results.donations')}</div>
                        <div className="space-y-2">
                          {orderDonations.map((donation) => {
                            // Get translated project name for this donation
                            const donationProjectName = getProjectName(
                              donation.projects.project_name_i18n,
                              donation.projects.project_name,
                              locale as SupportedLocale
                            )

                            return (
                              <div
                                key={donation.id}
                                className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                {/* Top Row: Donation ID + Status */}
                                <div className="flex items-center justify-between gap-2">
                                  <code className="text-xs font-mono bg-blue-50 text-blue-900 px-2 py-1 rounded border border-blue-200">
                                    {donation.donation_public_id}
                                  </code>
                                  <DonationStatusBadge status={donation.donation_status} />
                                </div>

                                {/* Middle Row: Project Name (clickable) */}
                                <div>
                                  <Link
                                    href={`/donate?project=${donation.projects.id}`}
                                    className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1 group"
                                  >
                                    {donationProjectName}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </Link>
                                </div>

                                {/* Bottom Row: Amount + Dates */}
                                <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                                  <span className="font-semibold text-gray-900">
                                    {donation.currency} {Number(donation.amount).toFixed(2)}
                                  </span>
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span>
                                      {formatDate(donation.donated_at, locale as SupportedLocale, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                    {donation.updated_at && donation.updated_at !== donation.donated_at && (
                                      <span className="text-gray-500">
                                        {t('results.updatedAt')}: {formatDate(donation.updated_at, locale as SupportedLocale, {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* View Result Button - shown only if this donation is completed */}
                                {donation.donation_status === 'completed' && (
                                  <button
                                    className="flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs"
                                    onClick={() => setViewResultDonationId(donation.donation_public_id)}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {t('actions.viewResult')}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Action Buttons - Order Level */}
                      {refundableAmount > 0 && (
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                          {/* Refund button - show only if there are refundable donations (paid/confirmed/delivering) */}
                          <button
                            className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setConfirmRefundId(orderReference)}
                            disabled={refundingDonationId === orderReference}
                          >
                            {refundingDonationId === orderReference ? (
                              <>
                                <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin"></div>
                                {t('form.processing')}
                              </>
                            ) : (
                              <>
                                {t('actions.requestRefund')}
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* No Results */}
      {donations && donations.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Donations Found</h3>
          <p className="text-gray-600">{t('errors.donationNotFound')}</p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmRefundId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t('refundDialog.title')}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {t('refundDialog.description')}
                </p>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block mt-2 text-gray-800">
                  {confirmRefundId}
                </code>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmRefundId(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                {t('refundDialog.cancel')}
              </button>
              <button
                onClick={() => handleRequestRefund(confirmRefundId)}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
              >
                {t('refundDialog.confirm')}
              </button>
            </div>
          </div>
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
