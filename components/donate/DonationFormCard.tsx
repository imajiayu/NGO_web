'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import type { ProjectStats } from '@/types'
import { createWayForPayDonation } from '@/app/actions/donation'
import WayForPayWidget from '@/app/[locale]/donate/wayforpay-widget'
import { getProjectName, getLocation, getUnitName, type SupportedLocale } from '@/lib/i18n-utils'

interface DonationFormCardProps {
  project: ProjectStats | null
  locale: string
}

interface PaymentWidgetContainerProps {
  processingState: 'idle' | 'creating' | 'ready' | 'error'
  paymentParams: any | null
  amount: number
  locale: string
  error: string | null
  onBack: () => void
}

// Component that handles all payment widget states
function PaymentWidgetContainer({
  processingState,
  paymentParams,
  amount,
  locale,
  error,
  onBack
}: PaymentWidgetContainerProps) {
  const t = useTranslations('donate')

  // Creating donation state
  if (processingState === 'creating') {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('processing.title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('processing.wait')}
          </p>
        </div>

        {/* Amount Display */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">
              {t('processing.donationAmount')}
            </p>
            <p className="text-3xl font-bold text-blue-600">
              ${amount.toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* Processing Animation */}
        <div className="py-8 flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-medium">
            {t('processing.creatingRecord')}
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">
                {t('securePayment.title')}
              </p>
              <p className="text-gray-600">
                {t('securePayment.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (processingState === 'error' || error) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('paymentError.title')}
          </h2>
        </div>

        {/* Amount Display */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">
              {t('processing.donationAmount')}
            </p>
            <p className="text-3xl font-bold text-blue-600">
              ${amount.toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* Error Message */}
        <div className="p-5 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-base font-bold text-red-800 mb-2">
                {t('paymentError.unableToProcess')}
              </p>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <p className="text-xs text-red-600">
                {t('paymentError.tryAgainMessage')}
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>
            {t('paymentError.backToEdit')}
          </span>
        </button>
      </div>
    )
  }

  // Ready state - show WayForPay widget
  if (processingState === 'ready' && paymentParams) {
    return (
      <WayForPayWidget
        paymentParams={paymentParams}
        amount={amount}
        locale={locale}
        onBack={onBack}
      />
    )
  }

  // Fallback
  return null
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
  const [showWidget, setShowWidget] = useState(false)
  const [processingState, setProcessingState] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const projectAmount = project ? (project.unit_price || 0) * quantity : 0
  // const totalAmount = projectAmount + operationalSupport
  const totalAmount = projectAmount
  const quantityOptions = [1, 2, 5, 10]
  // const supportOptions = [5, 10, 20]

  // Helper function to scroll to the form/widget area
  const scrollToFormArea = useCallback(() => {
    // Use requestAnimationFrame to ensure scroll happens after any DOM updates
    requestAnimationFrame(() => {
      const targetElement = widgetContainerRef.current || formContainerRef.current
      if (!targetElement) return

      // Check if mobile (screen width < 1024px, which is Tailwind's lg breakpoint)
      const isMobile = window.innerWidth < 1024

      if (isMobile) {
        // Mobile: Scroll to top of viewport with generous padding
        const elementTop = targetElement.getBoundingClientRect().top
        const offsetPosition = elementTop + window.pageYOffset - 100 // 100px padding from top

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      } else {
        // Desktop: Scroll to show the container in view
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }
    })
  }, [])

  // Effect to scroll when payment params are set (widget appears)
  useEffect(() => {
    if (paymentParams && widgetContainerRef.current) {
      // Scroll again when widget actually renders
      setTimeout(() => {
        scrollToFormArea()
      }, 150) // Small delay to ensure widget is fully rendered
    }
  }, [paymentParams, scrollToFormArea])

  // Set custom validation messages based on locale
  useEffect(() => {
    // Name input validation messages
    if (nameInputRef.current) {
      nameInputRef.current.addEventListener('invalid', () => {
        if (nameInputRef.current!.validity.valueMissing) {
          nameInputRef.current!.setCustomValidity(t('validation.nameRequired'))
        } else if (nameInputRef.current!.validity.tooShort) {
          nameInputRef.current!.setCustomValidity(t('validation.nameMin'))
        } else {
          nameInputRef.current!.setCustomValidity('')
        }
      })
      nameInputRef.current.addEventListener('input', () => {
        nameInputRef.current!.setCustomValidity('')
      })
    }

    // Email input validation messages
    if (emailInputRef.current) {
      emailInputRef.current.addEventListener('invalid', () => {
        if (emailInputRef.current!.validity.valueMissing) {
          emailInputRef.current!.setCustomValidity(t('validation.emailRequired'))
        } else if (emailInputRef.current!.validity.typeMismatch || emailInputRef.current!.validity.patternMismatch) {
          emailInputRef.current!.setCustomValidity(t('validation.emailInvalid'))
        } else {
          emailInputRef.current!.setCustomValidity('')
        }
      })
      emailInputRef.current.addEventListener('input', () => {
        emailInputRef.current!.setCustomValidity('')
      })
    }
  }, [t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !project.id) return

    // Prevent duplicate submissions
    if (processingState === 'creating') return

    setError(null)

    // Validate quantity before submitting
    if (!quantity || quantity < 1) {
      setError(t('errors.invalidQuantity'))
      return
    }

    // IMMEDIATELY show widget and scroll to it
    setShowWidget(true)
    setProcessingState('creating')
    scrollToFormArea()

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
          setError(t('errors.quantityExceeded', { remaining: remainingUnits, unitName }))
        } else if (result.error === 'project_not_found') {
          setError(t('errors.projectNotFound'))
        } else if (result.error === 'project_not_active') {
          setError(t('errors.projectNotActive'))
        } else {
          setError(t('errors.serverError'))
        }
        setProcessingState('error')
        return
      }

      // Success - set payment params and mark as ready
      setPaymentParams(result.paymentParams!)
      setProcessingState('ready')
    } catch (err) {
      console.error('Error creating payment intent:', err)
      if (err instanceof Error && err.message.includes('email')) {
        setError(t('errors.invalidEmail'))
      } else if (err instanceof Error && err.message.includes('validation')) {
        setError(t('errors.validationError'))
      } else {
        setError(t('errors.serverError'))
      }
      setProcessingState('error')
    }
  }

  // Handler to go back to edit form
  const handleBack = () => {
    setShowWidget(false)
    setPaymentParams(null)
    setProcessingState('idle')
    setError(null)
  }

  // Show widget if user clicked submit
  if (showWidget && project) {
    return (
      <div ref={widgetContainerRef} className="lg:sticky lg:top-24">
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
          <PaymentWidgetContainer
            processingState={processingState}
            paymentParams={paymentParams}
            amount={totalAmount}
            locale={locale}
            error={error}
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
            {t('formCard.noProjectDescription')}
          </p>
        </div>
      </div>
    )
  }

  // Show donation form
  return (
    <div ref={formContainerRef} className="lg:sticky lg:top-24">
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
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
                  {t('payment.projectTotal')}:
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
                ref={nameInputRef}
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
                ref={emailInputRef}
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
            disabled={processingState === 'creating' || project.status !== 'active'}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-md ${
              project.status !== 'active'
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {project.status !== 'active'
              ? t('formCard.projectEnded')
              : t('submit')
            }
          </button>
        </form>
      </div>
    </div>
  )
}
