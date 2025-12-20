'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { trackDonations, requestRefund } from '@/app/actions/track-donation'
import { Link } from '@/i18n/navigation'
import { Search, Mail, Hash, ArrowRight, ExternalLink, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import DonationResultViewer from '@/components/donation/DonationResultViewer'
import { getProjectName, type SupportedLocale } from '@/lib/i18n-utils'
import type { I18nText } from '@/types/database'

type Donation = {
  id: number
  donation_public_id: string
  donor_email: string
  amount: number
  currency: string
  donation_status: 'pending' | 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded' | 'failed'
  donated_at: string
  projects: {
    id: number
    project_name: string
    project_name_i18n: I18nText | null
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

  async function handleRequestRefund(donationPublicId: string) {
    setRefundingDonationId(donationPublicId)
    setError('')

    try {
      const result = await requestRefund({
        donationPublicId,
        email,
      })

      if (result.error) {
        setError(t(`errors.${result.error}`))
      } else if (result.success) {
        // Update the local donations state to reflect the status change
        setDonations(prev =>
          prev ? prev.map(d =>
            d.donation_public_id === donationPublicId
              ? { ...d, donation_status: 'refunding' as const }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-600 border-gray-300'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'delivering':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paid':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'refunding':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4" />
    }
    if (status === 'failed') {
      return <AlertTriangle className="w-4 h-4" />
    }
    return <Clock className="w-4 h-4" />
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
      {donations && donations.length > 0 && (
        <div className="space-y-6">
          {/* Results Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('results.title', { count: donations.length })}
            </h2>
          </div>

          {/* Donation Cards */}
          <div className="grid gap-4">
            {donations.map((donation) => {
              // Get translated project name
              const projectName = getProjectName(
                donation.projects.project_name_i18n,
                donation.projects.project_name,
                locale as SupportedLocale
              )

              return (
              <div
                key={donation.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/donate?project=${donation.projects.id}`}
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-2 group"
                      >
                        {projectName}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(donation.donation_status)}`}>
                      {getStatusIcon(donation.donation_status)}
                      {t(`status.${donation.donation_status}`)}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">{t('results.donationId')}</div>
                      <code className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg inline-block font-semibold text-gray-800">
                        {donation.donation_public_id}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">{t('results.amount')}</div>
                      <div className="text-lg font-bold text-gray-900">
                        {donation.currency} {donation.amount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">{t('results.date')}</div>
                      <div className="text-sm text-gray-700 font-medium">
                        {new Date(donation.donated_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                    {donation.donation_status === 'completed' ? (
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                        onClick={() => setViewResultDonationId(donation.donation_public_id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t('actions.viewResult')}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (donation.donation_status === 'paid' || donation.donation_status === 'confirmed' || donation.donation_status === 'delivering') ? (
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setConfirmRefundId(donation.donation_public_id)}
                        disabled={refundingDonationId === donation.donation_public_id}
                      >
                        {refundingDonationId === donation.donation_public_id ? (
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
                    ) : null}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

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
