'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import CopyButton from '@/components/CopyButton'
import { getProjectName, getLocation, getUnitName, type SupportedLocale } from '@/lib/i18n-utils'
import type { I18nText } from '@/types/database'

type Donation = {
  id: number
  donation_public_id: string
  amount: number
  donor_email: string
  donation_status: 'pending' | 'paid' | 'confirmed' | 'delivering' | 'completed' | 'refunding' | 'refunded'
  projects: {
    id: number
    project_name: string
    project_name_i18n: I18nText | null
    location: string
    location_i18n: I18nText | null
    unit_name: string
    unit_name_i18n: I18nText | null
  }
}

type Props = {
  orderReference: string
  locale: string
}

export default function DonationDetails({ orderReference, locale }: Props) {
  const t = useTranslations('donateSuccess')
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const retryCountRef = useRef(0)
  const statusCheckCountRef = useRef(0)
  const maxRetries = 20  // 20 retries * 1.5s = 30 seconds total
  const maxStatusChecks = 12  // 12 checks * 5s = 60 seconds for status updates

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    let isMounted = true

    const fetchDonations = async () => {
      if (!isMounted) return false

      try {
        const response = await fetch(
          `/api/donations/order/${orderReference}`
        )

        if (response.ok) {
          const data = await response.json()
          // Got data - webhook has completed batch insert, stop polling immediately
          if (data.donations && data.donations.length > 0) {
            if (isMounted) {
              setDonations(data.donations)
              setLoading(false)
            }
            if (intervalId) clearInterval(intervalId)
            return true
          }
        }
        return false
      } catch (error) {
        console.error('Error fetching donations:', error)
        return false
      }
    }

    // Wait 3 seconds before first fetch to give webhook more time to process
    const initialDelay = setTimeout(() => {
      if (!isMounted) return

      fetchDonations().then((success) => {
        if (!success && isMounted) {
          // Start polling every 1.5 seconds (slower to give webhook time)
          intervalId = setInterval(async () => {
            retryCountRef.current += 1

            if (retryCountRef.current >= maxRetries) {
              if (intervalId) clearInterval(intervalId)
              if (isMounted) setLoading(false)
              return
            }

            const success = await fetchDonations()
            if (success && intervalId) {
              clearInterval(intervalId)
            }
          }, 1500)  // 1.5 seconds interval
        }
      })
    }, 3000)  // Wait 3 seconds before starting

    // Cleanup
    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
      clearTimeout(initialDelay)
    }
  }, [orderReference])

  // Auto-refresh for pending donations: Check status every 5 seconds
  useEffect(() => {
    let statusCheckInterval: NodeJS.Timeout | null = null
    let isMounted = true

    // Only start status checking if we have donations and at least one is pending
    const hasPendingDonations = donations.length > 0 && donations.some(d => d.donation_status === 'pending')

    if (hasPendingDonations) {
      console.log('Starting auto-refresh for pending donations...')
      setIsAutoRefreshing(true)

      statusCheckInterval = setInterval(async () => {
        statusCheckCountRef.current += 1

        // Stop after max checks
        if (statusCheckCountRef.current >= maxStatusChecks) {
          console.log('Max status checks reached, stopping auto-refresh')
          setIsAutoRefreshing(false)
          if (statusCheckInterval) clearInterval(statusCheckInterval)
          return
        }

        try {
          const response = await fetch(`/api/donations/order/${orderReference}`)

          if (response.ok && isMounted) {
            const data = await response.json()

            if (data.donations && data.donations.length > 0) {
              const updatedDonations = data.donations
              const stillPending = updatedDonations.some((d: Donation) => d.donation_status === 'pending')

              // Update state with new data
              setDonations(updatedDonations)

              // If no longer pending, stop polling
              if (!stillPending) {
                console.log('Payment status updated to paid! Stopping auto-refresh.')
                setIsAutoRefreshing(false)
                if (statusCheckInterval) clearInterval(statusCheckInterval)
              } else {
                console.log(`Status check ${statusCheckCountRef.current}/${maxStatusChecks}: Still pending...`)
              }
            }
          }
        } catch (error) {
          console.error('Error checking donation status:', error)
        }
      }, 5000) // Check every 5 seconds
    }

    // Cleanup
    return () => {
      isMounted = false
      if (statusCheckInterval) clearInterval(statusCheckInterval)
    }
  }, [donations, orderReference, maxStatusChecks])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>
        <p className="mt-6 text-lg text-gray-600 font-medium">{t('loading')}</p>
      </div>
    )
  }

  if (donations.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 shadow-lg border border-yellow-200/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">{t('processing')}</h3>
            <p className="text-yellow-800 leading-relaxed">
              {t('processingDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const project = donations[0].projects
  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0)
  const allDonationIds = donations.map((d) => d.donation_public_id).join('\n')
  const donorEmail = donations[0].donor_email
  const isPending = donations.some((d) => d.donation_status === 'pending')

  // Get translated project data
  const projectName = getProjectName(project.project_name_i18n, project.project_name, locale as SupportedLocale)
  const location = getLocation(project.location_i18n, project.location, locale as SupportedLocale)
  const unitName = getUnitName(project.unit_name_i18n, project.unit_name, locale as SupportedLocale)

  return (
    <div className="space-y-6">
      {/* Payment Pending Warning (if applicable) */}
      {isPending && (
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 shadow-lg border border-yellow-200/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                {locale === 'en' ? '⏳ Payment Processing' : locale === 'zh' ? '⏳ 支付处理中' : '⏳ Обробка платежу'}
              </h3>
              <p className="text-yellow-800 leading-relaxed mb-2">
                {locale === 'en'
                  ? 'Your payment has been received and is currently being processed by WayForPay. This usually takes a few minutes.'
                  : locale === 'zh'
                  ? '您的支付已收到，正在由 WayForPay 处理中。这通常需要几分钟时间。'
                  : 'Ваш платіж отримано і зараз обробляється WayForPay. Зазвичай це займає кілька хвилин.'}
              </p>
              <p className="text-yellow-700 text-sm mb-3 whitespace-pre-line">
                {locale === 'en'
                  ? '✓ Your donation IDs have been generated and saved.\n✓ You will receive a confirmation email once the payment is completed.\n✓ You can track your donation status using the IDs below.'
                  : locale === 'zh'
                  ? '✓ 您的捐赠 ID 已生成并保存。\n✓ 支付完成后您将收到确认邮件。\n✓ 您可以使用下面的 ID 追踪捐赠状态。'
                  : '✓ Ваші ID пожертв згенеровані та збережені.\n✓ Ви отримаєте підтвердження електронною поштою після завершення платежу.\n✓ Ви можете відстежувати статус пожертви, використовуючи ID нижче.'}
              </p>
              {isAutoRefreshing && (
                <div className="flex items-center space-x-2 text-yellow-700 text-sm">
                  <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {locale === 'en'
                      ? 'Auto-checking status every 5 seconds...'
                      : locale === 'zh'
                      ? '每 5 秒自动检查状态...'
                      : 'Автоматична перевірка статусу кожні 5 секунд...'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Donation IDs Card - Prominent */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl shadow-xl border border-blue-200/50">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative p-8 lg:p-10">
          {/* Header */}
          <div className="flex items-start space-x-4 mb-8">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold tracking-wider uppercase rounded-full mb-3 shadow-md">
                {t('important')}
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {t('saveIdsTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('saveIdsDescription')}
              </p>
            </div>
          </div>

          {/* Donation IDs */}
          <div className="space-y-3">
            {donations.map((donation, index) => (
              <div
                key={donation.id}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                      #{index + 1}
                    </div>
                    <code className="text-xl font-mono font-bold text-gray-900 tracking-wide">
                      {donation.donation_public_id}
                    </code>
                  </div>
                  <CopyButton
                    text={donation.donation_public_id}
                    label={t('copy.copyId')}
                    copiedLabel={t('copy.copied')}
                    variant="secondary"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Copy All Button */}
          {donations.length > 1 && (
            <div className="mt-6">
              <CopyButton
                text={allDonationIds}
                label={t('copy.copyAll')}
                copiedLabel={t('copy.copied')}
                variant="primary"
                className="w-full py-4 text-base font-semibold shadow-lg hover:shadow-xl"
              />
            </div>
          )}
        </div>
      </div>

      {/* Email Reminder Card */}
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('emailReminderTitle')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('emailReminderDescription', { email: donorEmail })}
              </p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {donorEmail}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Summary Card */}
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg border border-gray-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{t('details.title')}</h3>
          </div>

          <div className="space-y-4">
            {/* Project */}
            <div className="flex items-start justify-between py-4 border-b border-gray-100">
              <span className="text-gray-500 font-medium">{t('details.project')}</span>
              <div className="text-right">
                <p className="font-bold text-gray-900">{projectName}</p>
                <p className="text-sm text-gray-500">{location}</p>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <span className="text-gray-500 font-medium">{t('details.quantity')}</span>
              <span className="font-bold text-gray-900">
                {t('details.units', { count: donations.length, unitName })}
              </span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-4">
              <span className="text-gray-500 font-medium">{t('details.total')}</span>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ${totalAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-1">USD</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
