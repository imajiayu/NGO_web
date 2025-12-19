'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  paymentParams: any
  amount: number
  locale: string
  onBack?: () => void
}

// Declare WayForPay on window object
declare global {
  interface Window {
    Wayforpay: any
  }
}

export default function WayForPayWidget({ paymentParams, amount, locale, onBack }: Props) {
  const t = useTranslations('donate')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    // Load WayForPay widget script
    const loadWayForPayScript = () => {
      if (scriptLoadedRef.current) {
        initializeWidget()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://secure.wayforpay.com/server/pay-widget.js'
      script.id = 'widget-wfp-script'
      script.async = true

      script.onload = () => {
        scriptLoadedRef.current = true
        initializeWidget()
      }

      script.onerror = () => {
        setError(t('errors.paymentLoadFailed'))
        setIsLoading(false)
      }

      document.body.appendChild(script)
    }

    const initializeWidget = () => {
      if (!window.Wayforpay) {
        setError(t('errors.paymentLoadFailed'))
        setIsLoading(false)
        return
      }

      try {
        const wayforpay = new window.Wayforpay()

        wayforpay.run(
          paymentParams,
          // Success callback
          function (response: any) {
            console.log('WayForPay success:', response)
            // Redirect is handled by returnUrl in paymentParams
          },
          // Failed callback
          function (response: any) {
            console.log('WayForPay failed:', response)
            setError(
              response.reason ||
              t('errors.paymentFailed')
            )
          },
          // Pending callback
          function (response: any) {
            console.log('WayForPay pending:', response)
          }
        )

        setIsLoading(false)
      } catch (err) {
        console.error('Error initializing WayForPay:', err)
        setError(t('errors.serverError'))
        setIsLoading(false)
      }
    }

    loadWayForPayScript()

    // Cleanup
    return () => {
      // WayForPay widget cleans up itself
    }
  }, [paymentParams, t])

  return (
    <div className="p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:text-gray-900 font-medium"
            title={t('payment.backToEdit')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{t('payment.back')}</span>
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{t('payment.title')}</h2>
        </div>
      </div>

      {/* Amount Summary */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            {t('payment.total')}:
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {paymentParams.currency === 'UAH' ? '₴' : '$'}{amount.toFixed(2)} {paymentParams.currency}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="min-h-[360px] flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">{t('payment.loading')}</p>
        </div>
      )}

      {/* Widget Container */}
      <div
        ref={widgetRef}
        id="wayforpay-widget"
        className={`min-h-[360px] ${isLoading ? 'hidden' : ''}`}
      />

      {/* Back Button */}
      {onBack && !isLoading && (
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 px-6 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t('payment.back')}</span>
          </button>
        </div>
      )}

      {/* Information Notice */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">
              {locale === 'en' ? 'Secure Payment' : locale === 'zh' ? '安全支付' : 'Безпечна оплата'}
            </p>
            <p>
              {locale === 'en'
                ? 'Your payment is processed securely through WayForPay, a trusted Ukrainian payment provider.'
                : locale === 'zh'
                ? '您的支付通过 WayForPay（值得信赖的乌克兰支付提供商）安全处理。'
                : 'Ваш платіж обробляється безпечно через WayForPay, надійного українського платіжного провайдера.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
