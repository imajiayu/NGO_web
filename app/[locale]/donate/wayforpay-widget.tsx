'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { markDonationWidgetFailed } from '@/app/actions/donation'

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

// Helper function to detect iOS
const isIOS = () => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function WayForPayWidget({ paymentParams, amount, locale, onBack }: Props) {
  const t = useTranslations('donate')
  const tWidget = useTranslations('wayforpayWidget')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const scriptLoadedRef = useRef(false)
  const scriptLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const widgetOpenCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const earlyDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasRedirectedRef = useRef(false)
  const widgetOpenedRef = useRef(false)
  const widgetEverDetectedRef = useRef(false) // Track if widget was ever detected in DOM

  useEffect(() => {
    // Listen for iframe load errors (403, network errors, etc.)
    const handleWindowError = (event: ErrorEvent) => {
      // Check if error is related to WayForPay
      if (event.message && event.message.includes('wayforpay')) {
        console.error('[WIDGET] Window error detected:', event.message)
        // Only mark as failed if widget was never detected (true load failure)
        if (!widgetOpenedRef.current && !hasRedirectedRef.current && !widgetEverDetectedRef.current) {
          setError(t('errors.paymentLoadFailed'))
          setIsLoading(false)
          setIsRedirecting(false)
          markDonationWidgetFailed(paymentParams.orderReference)
            .catch(err => console.error('[WIDGET] Failed to mark as widget_load_failed:', err))
        }
      }
    }

    // Helper function to check if WayForPay widget is open
    const checkWidgetOpened = () => {
      // WayForPay creates elements with specific classes/ids when widget opens
      const wfpFrame = document.querySelector('iframe[src*="wayforpay"]')
      const wfpOverlay = document.querySelector('.wfp-overlay, .wayforpay-overlay, [class*="wfp-"], [id*="wayforpay"]')
      const wfpPopup = document.querySelector('[class*="wayforpay"], [class*="wfp"]')
      const isOpen = !!(wfpFrame || wfpOverlay || wfpPopup)
      // Once detected, remember it permanently (widget may be closed later by user)
      if (isOpen) {
        widgetEverDetectedRef.current = true
      }
      return isOpen
    }

    window.addEventListener('error', handleWindowError, true)

    // Load WayForPay widget script
    const loadWayForPayScript = () => {
      if (scriptLoadedRef.current) {
        initializeWidget()
        return
      }

      // Check if we're online
      if (!navigator.onLine) {
        const offlineError = tWidget('networkError')
        setError(offlineError)
        setIsLoading(false)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://secure.wayforpay.com/server/pay-widget.js'
      script.id = 'widget-wfp-script'
      script.async = true

      // Set timeout for script loading (15 seconds)
      scriptLoadTimeoutRef.current = setTimeout(() => {
        if (!scriptLoadedRef.current) {
          setError(t('errors.paymentLoadFailed'))
          setIsLoading(false)
          // Mark donation as widget_load_failed
          markDonationWidgetFailed(paymentParams.orderReference)
            .catch(err => console.error('[WIDGET] Failed to mark as widget_load_failed:', err))
        }
      }, 15000)

      script.onload = () => {
        if (scriptLoadTimeoutRef.current) {
          clearTimeout(scriptLoadTimeoutRef.current)
        }
        scriptLoadedRef.current = true
        initializeWidget()
      }

      script.onerror = () => {
        if (scriptLoadTimeoutRef.current) {
          clearTimeout(scriptLoadTimeoutRef.current)
        }
        setError(t('errors.paymentLoadFailed'))
        setIsLoading(false)
        // Mark donation as widget_load_failed
        markDonationWidgetFailed(paymentParams.orderReference)
          .catch(err => console.error('[WIDGET] Failed to mark as widget_load_failed:', err))
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

        // Clear widget opened flag
        widgetOpenedRef.current = false

        wayforpay.run(
          paymentParams,
          // Success callback
          function (response: any) {
            widgetOpenedRef.current = true
            if (widgetOpenCheckTimeoutRef.current) {
              clearTimeout(widgetOpenCheckTimeoutRef.current)
            }
            // Redirect is handled by returnUrl in paymentParams
          },
          // Failed callback
          function (response: any) {
            widgetOpenedRef.current = true
            if (widgetOpenCheckTimeoutRef.current) {
              clearTimeout(widgetOpenCheckTimeoutRef.current)
            }
            hasRedirectedRef.current = true
            setError(response.reason || t('errors.paymentFailed'))
            setIsLoading(false)
            setIsRedirecting(false)
          },
          // Pending callback
          function (response: any) {
            widgetOpenedRef.current = true
            if (widgetOpenCheckTimeoutRef.current) {
              clearTimeout(widgetOpenCheckTimeoutRef.current)
            }
            if (response && response.orderReference) {
              // User completed payment action, redirect to success page
              hasRedirectedRef.current = true
              if (paymentParams.returnUrl) {
                window.location.href = paymentParams.returnUrl
              }
            }
            // Note: If user closes window without payment, donation stays 'pending'
            // WayForPay will send 'Expired' webhook after timeout period
          }
        )

        // Early detection: check for widget DOM elements every 500ms for the first 5 seconds
        // This helps detect widget opening even if user closes it before the final check
        earlyDetectionIntervalRef.current = setInterval(() => {
          if (checkWidgetOpened()) {
            console.log('[WIDGET] Early detection: widget found in DOM')
            if (earlyDetectionIntervalRef.current) {
              clearInterval(earlyDetectionIntervalRef.current)
              earlyDetectionIntervalRef.current = null
            }
          }
        }, 500)

        // Check if widget opened successfully after a short delay (5 seconds)
        // This gives WayForPay time to create its DOM elements
        widgetOpenCheckTimeoutRef.current = setTimeout(() => {
          if (earlyDetectionIntervalRef.current) {
            clearInterval(earlyDetectionIntervalRef.current)
            earlyDetectionIntervalRef.current = null
          }
          if (!widgetOpenedRef.current && !hasRedirectedRef.current) {
            // First check if widget was ever detected (user may have closed it)
            if (widgetEverDetectedRef.current) {
              console.log('[WIDGET] Widget was previously detected - user may have closed it')
              widgetOpenedRef.current = true
              // Don't mark as failed - donation stays pending, WayForPay will handle expiration
            } else if (checkWidgetOpened()) {
              // Check DOM for WayForPay elements
              console.log('[WIDGET] Widget detected in DOM - marking as opened')
              widgetOpenedRef.current = true
            } else {
              // Widget never appeared - true load failure
              console.error('[WIDGET] Widget failed to open - no WayForPay elements detected')
              setError(t('errors.paymentLoadFailed'))
              setIsLoading(false)
              setIsRedirecting(false)
              // Mark donation as widget_load_failed
              markDonationWidgetFailed(paymentParams.orderReference)
                .catch(err => console.error('[WIDGET] Failed to mark as widget_load_failed:', err))
            }
          }
        }, 5000)

        // On mobile devices, show redirecting message
        if (isIOS()) {
          setIsRedirecting(true)
          setIsLoading(false)

          // After 10 seconds, if still no redirect, show error
          setTimeout(() => {
            if (!hasRedirectedRef.current && !error) {
              setIsRedirecting(false)
              setError(tWidget('popupBlocked'))
            }
          }, 10000)
        } else {
          setIsLoading(false)
        }
      } catch (err) {
        setError(t('errors.serverError'))
        setIsLoading(false)
        setIsRedirecting(false)
      }
    }

    loadWayForPayScript()

    // Cleanup
    return () => {
      window.removeEventListener('error', handleWindowError, true)
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current)
      }
      if (widgetOpenCheckTimeoutRef.current) {
        clearTimeout(widgetOpenCheckTimeoutRef.current)
      }
      if (earlyDetectionIntervalRef.current) {
        clearInterval(earlyDetectionIntervalRef.current)
      }
    }
  }, [paymentParams, t, tWidget])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('payment.title')}</h2>
        <p className="text-sm text-gray-600">
          {tWidget('windowOpening')}
        </p>
      </div>

      {/* Amount Display */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">
            {t('payment.total')}
          </p>
          <p className="text-3xl font-bold text-blue-600">
            ${amount.toFixed(2)} {paymentParams.currency}
          </p>
        </div>
      </div>

      {/* Redirecting State - Mobile devices */}
      {isRedirecting && !error && (
        <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex gap-3 items-start">
            <svg className="animate-spin h-6 w-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="flex-1">
              <p className="text-base font-bold text-blue-800 mb-2">
                {tWidget('redirecting.title')}
              </p>
              <p className="text-sm text-blue-700 mb-3">
                {tWidget('redirecting.description')}
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {tWidget('redirecting.popupHint')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-base font-bold text-red-800 mb-2">
                {tWidget('paymentFailed.title')}
              </p>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <p className="text-xs text-red-600">
                {tWidget('paymentFailed.message')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-medium">{t('payment.loading')}</p>
          <p className="text-sm text-gray-500">
            {tWidget('preparing')}
          </p>
        </div>
      )}

      {/* Back Button - Always show when not loading */}
      {!isLoading && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>
            {tWidget('backToEdit')}
          </span>
        </button>
      )}

      {/* Security Notice */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">
              {tWidget('securePayment.title')}
            </p>
            <p className="text-gray-600">
              {tWidget('securePayment.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
