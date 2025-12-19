'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ProjectStats } from '@/types'
import { createWayForPayDonation } from '@/app/actions/donation'
import WayForPayWidget from '@/app/[locale]/donate/wayforpay-widget'
import { getProjectName, getLocation, getUnitName, type SupportedLocale } from '@/lib/i18n-utils'

interface DonationFormCardProps {
  project: ProjectStats | null
  locale: string
}

export default function DonationFormCard({
  project,
  locale
}: DonationFormCardProps) {
  const t = useTranslations('donate')

  // Get translated project data
  const projectName = project ? getProjectName(project.project_name_i18n, project.project_name, locale as SupportedLocale) : ''
  const location = project ? getLocation(project.location_i18n, project.location, locale as SupportedLocale) : ''
  const unitName = project ? getUnitName(project.unit_name_i18n, project.unit_name, locale as SupportedLocale) : ''

  const [quantity, setQuantity] = useState(1)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorMessage, setDonorMessage] = useState('')
  const [contactTelegram, setContactTelegram] = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')
  // const [operationalSupport, setOperationalSupport] = useState(0)
  const [paymentParams, setPaymentParams] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const projectAmount = project ? (project.unit_price || 0) * quantity : 0
  // const totalAmount = projectAmount + operationalSupport
  const totalAmount = projectAmount
  const quantityOptions = [1, 2, 5, 10]
  // const supportOptions = [5, 10, 20]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !project.id) return

    // Prevent duplicate submissions
    if (loading) return

    setError(null)

    // Validate quantity before submitting
    if (!quantity || quantity < 1) {
      setError(locale === 'en' ? 'Please enter a valid quantity (minimum 1)' : '请输入有效数量（最少1）')
      return
    }

    setLoading(true)

    try {
      const result = await createWayForPayDonation({
        project_id: project.id,
        quantity,
        donor_name: donorName.trim(),
        donor_email: donorEmail.trim(),
        donor_message: donorMessage || undefined,
        contact_telegram: contactTelegram ? contactTelegram.trim() : undefined,
        contact_whatsapp: contactWhatsapp ? contactWhatsapp.trim() : undefined,
        locale: locale as 'en' | 'zh' | 'ua',
      })

      // Check if the result is successful
      if (!result.success) {
        // Handle different error types
        if (result.error === 'quantity_exceeded') {
          const remainingUnits = result.remainingUnits || 0
          const unitName = result.unitName || (locale === 'en' ? 'units' : '单位')

          // Set quantity to remaining units
          setQuantity(remainingUnits)

          // Show localized error message
          const errorMsg = locale === 'en'
            ? `The requested quantity exceeds available units. Maximum available: ${remainingUnits} ${unitName}`
            : `请求的数量超过可用数量。最大可用：${remainingUnits} ${unitName}`
          setError(errorMsg)
        } else if (result.error === 'project_not_found') {
          setError(locale === 'en' ? 'Project not found' : '项目未找到')
        } else if (result.error === 'project_not_active') {
          setError(locale === 'en' ? 'Project is not active' : '项目未激活')
        } else {
          setError(t('errors.serverError'))
        }
        setLoading(false)
        return
      }

      // TEST MODE: Skip payment and redirect directly to success page
      if (result.skipPayment) {
        console.log('🧪 TEST MODE: Redirecting to success page')
        window.location.href = `/${locale}/donate/success?order=${result.orderReference}`
        return
      }

      // Success - set payment params and scroll to payment form
      setPaymentParams(result.paymentParams!)

      // Scroll to top when payment form appears
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Error creating payment intent:', err)
      if (err instanceof Error && err.message.includes('email')) {
        setError(t('errors.invalidEmail'))
      } else if (err instanceof Error && err.message.includes('validation')) {
        setError(t('errors.validationError'))
      } else {
        setError(t('errors.serverError'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Handler to go back to edit form
  const handleBack = () => {
    setPaymentParams(null)
    setError(null)
  }

  // Show payment form if payment params are available
  if (paymentParams && project) {
    return (
      <div className="lg:sticky lg:top-24">
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
          <WayForPayWidget
            paymentParams={paymentParams}
            amount={totalAmount}
            locale={locale}
            onBack={handleBack}
          />
        </div>
      </div>
    )
  }

  // Show empty state if no project selected
  if (!project) {
    return (
      <div className="lg:sticky lg:top-24">
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {t('noProjectSelected')}
          </h3>
          <p className="text-sm text-gray-500">
            {locale === 'en'
              ? 'Choose a project from the gallery above to view details and make a donation'
              : '从上方画廊中选择一个项目以查看详情并进行捐赠'}
          </p>
        </div>
      </div>
    )
  }

  // Check if in test mode
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE_SKIP_PAYMENT === 'true'

  // Show donation form
  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
        {/* Test Mode Banner */}
        {isTestMode && (
          <div className="bg-yellow-100 border-b-2 border-yellow-300 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧪</span>
              <p className="text-sm font-bold text-yellow-800">
                {locale === 'en'
                  ? 'TEST MODE: Payment will be skipped'
                  : locale === 'zh'
                  ? '测试模式：将跳过支付'
                  : 'ТЕСТОВИЙ РЕЖИМ: Оплата буде пропущена'}
              </p>
            </div>
          </div>
        )}

        {/* Project Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2">
            {projectName}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{location}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                ${(project.unit_price || 0).toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">
                {t('quantity.perUnit', { unitName })}
              </span>
            </div>
          </div>
        </div>

        {/* Donation Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('quantity.label')} *
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {quantityOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuantity(num)}
                  className={`px-3 py-2 rounded-lg border font-medium text-sm transition-all ${
                    quantity === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value
                if (val === '') {
                  setQuantity(0)
                } else {
                  setQuantity(Number(e.target.value))
                }
              }}
              onBlur={(e) => {
                // Clean up on blur: ensure valid range and no leading zeros
                const num = parseInt(e.target.value, 10)
                if (isNaN(num) || num < 1) {
                  setQuantity(1)
                } else if (num > 999) {
                  setQuantity(999)
                } else {
                  setQuantity(num) // This removes leading zeros
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('quantity.custom')}
            />
            <div className="mt-2 p-2.5 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {locale === 'en' ? 'Project Total' : '项目总计'}:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  ${projectAmount.toFixed(2)} {t('payment.currency')}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Support - COMMENTED OUT */}
          {/* <div className="border-t pt-5">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {t('operationalSupport.title')}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {t('operationalSupport.description')}
                </p>
              </div>
              <div className="flex-shrink-0 bg-amber-50 px-2 py-1 rounded text-xs font-medium text-amber-700">
                Optional
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <ul className="space-y-1.5 text-xs text-gray-600">
                {(t.raw('operationalSupport.items') as string[]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {supportOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setOperationalSupport(amount)}
                  className={`px-3 py-2 rounded-lg border font-medium text-sm transition-all ${
                    operationalSupport === amount
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              max="9999"
              step="0.01"
              value={operationalSupport || ''}
              onChange={(e) => setOperationalSupport(Number(e.target.value) || 0)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder={t('operationalSupport.placeholder')}
            />
            {operationalSupport > 0 && (
              <p className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                {locale === 'en'
                  ? 'Thank you for supporting our operations!'
                  : '感谢您支持我们的运营！'}
              </p>
            )}
          </div> */}

          {/* Total Amount Summary */}
          <div className="border-t pt-3">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                {/* <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {locale === 'en' ? 'Project Donation' : '项目捐赠'}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${projectAmount.toFixed(2)}
                  </span>
                </div> */}
                {/* {operationalSupport > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {locale === 'en' ? 'Operational Support' : '运营支持'}:
                    </span>
                    <span className="font-semibold text-amber-700">
                      ${operationalSupport.toFixed(2)}
                    </span>
                  </div>
                )} */}
                {/* <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div> */}
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">
                    {t('payment.total')}:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${totalAmount.toFixed(2)} {t('payment.currency')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Donor Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 border-b pb-2">
              {t('donor.title')}
            </h4>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('donor.name')} *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={255}
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('donor.namePlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-500">{t('donor.nameHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('donor.email')} *
              </label>
              <input
                type="email"
                required
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                onBlur={(e) => setDonorEmail(e.target.value.trim())}
                pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('donor.emailPlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-500">{t('donor.emailHint')}</p>
            </div>
          </div>

          {/* Contact Methods (Optional) */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 border-b pb-2">
                {t('contact.title')}
              </h4>
              <p className="text-xs text-gray-600 mt-1">{t('contact.description')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('contact.telegram')}
              </label>
              <input
                type="text"
                maxLength={255}
                value={contactTelegram}
                onChange={(e) => setContactTelegram(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('contact.telegramPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('contact.whatsapp')}
              </label>
              <input
                type="text"
                maxLength={255}
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('contact.whatsappPlaceholder')}
              />
            </div>
          </div>

          {/* Message (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('message.label')}
            </label>
            <textarea
              maxLength={1000}
              rows={3}
              value={donorMessage}
              onChange={(e) => setDonorMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={t('message.placeholder')}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('message.hint', { remaining: 1000 - donorMessage.length })}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || project.status !== 'active'}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-md ${
              project.status !== 'active'
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {project.status !== 'active'
              ? (locale === 'en' ? 'Project Ended' : '项目已结束')
              : (loading ? t('submitting') : t('submit'))
            }
          </button>
        </form>
      </div>
    </div>
  )
}
