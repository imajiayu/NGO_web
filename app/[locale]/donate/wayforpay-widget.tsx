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

// Helper function to detect iOS
const isIOS = () => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Helper function to get device info
const getDeviceInfo = () => {
  if (typeof navigator === 'undefined') return 'Unknown'
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isIOS: isIOS(),
    online: navigator.onLine,
  }
}

export default function WayForPayWidget({ paymentParams, amount, locale, onBack }: Props) {
  const t = useTranslations('donate')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const scriptLoadedRef = useRef(false)
  const scriptLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    // Log device info on mount
    const deviceInfo = getDeviceInfo()
    const debugLog = (message: string) => {
      console.log(`[WayForPay Debug] ${message}`)
      setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`])
    }

    debugLog(`Device: ${JSON.stringify(deviceInfo)}`)
    debugLog('Starting payment widget initialization')

    // Load WayForPay widget script
    const loadWayForPayScript = () => {
      if (scriptLoadedRef.current) {
        debugLog('Script already loaded, initializing widget')
        initializeWidget()
        return
      }

      // Check if we're online
      if (!navigator.onLine) {
        const offlineError = locale === 'en'
          ? 'No internet connection. Please check your network and try again.'
          : locale === 'zh'
          ? '无网络连接。请检查网络后重试。'
          : 'Немає підключення до Інтернету. Будь ласка, перевірте ваше з\'єднання і спробуйте ще раз.'
        debugLog('Device is offline')
        setError(offlineError)
        setIsLoading(false)
        return
      }

      debugLog('Creating script element for WayForPay widget')
      const script = document.createElement('script')
      script.src = 'https://secure.wayforpay.com/server/pay-widget.js'
      script.id = 'widget-wfp-script'
      script.async = true

      // Set timeout for script loading (15 seconds)
      scriptLoadTimeoutRef.current = setTimeout(() => {
        if (!scriptLoadedRef.current) {
          debugLog('Script loading timeout (15s)')
          setError(t('errors.paymentLoadFailed') +
            (isIOS() ? ` (iOS: ${locale === 'zh' ? '请尝试刷新页面' : 'Please try refreshing the page'})` : ''))
          setIsLoading(false)
        }
      }, 15000)

      script.onload = () => {
        debugLog('WayForPay script loaded successfully')
        if (scriptLoadTimeoutRef.current) {
          clearTimeout(scriptLoadTimeoutRef.current)
        }
        scriptLoadedRef.current = true
        initializeWidget()
      }

      script.onerror = (e) => {
        debugLog(`Script loading error: ${e}`)
        if (scriptLoadTimeoutRef.current) {
          clearTimeout(scriptLoadTimeoutRef.current)
        }
        let errorMsg = t('errors.paymentLoadFailed')
        if (isIOS()) {
          errorMsg += locale === 'en'
            ? ' (iOS detected: Please ensure you have a stable internet connection and try again)'
            : locale === 'zh'
            ? ' (检测到iOS设备：请确保网络连接稳定后重试)'
            : ' (Виявлено iOS: Переконайтеся, що у вас стабільне з\'єднання з Інтернетом і спробуйте ще раз)'
        }
        setError(errorMsg)
        setIsLoading(false)
      }

      debugLog('Appending script to document body')
      document.body.appendChild(script)
    }

    const initializeWidget = () => {
      debugLog('Initializing WayForPay widget')

      if (!window.Wayforpay) {
        debugLog('ERROR: window.Wayforpay is not defined')
        setError(t('errors.paymentLoadFailed'))
        setIsLoading(false)
        return
      }

      debugLog('window.Wayforpay found, creating instance')

      try {
        const wayforpay = new window.Wayforpay()
        debugLog('WayForPay instance created successfully')
        debugLog(`Payment params: orderReference=${paymentParams.orderReference}, amount=${paymentParams.amount}`)
        debugLog(`Device is mobile: ${isIOS()}`)

        // Use default popup mode (no straightWidget parameter)
        wayforpay.run(
          paymentParams,
          // Success callback
          function (response: any) {
            debugLog('WayForPay success callback triggered')
            console.log('WayForPay success:', response)
            // Redirect is handled by returnUrl in paymentParams
          },
          // Failed callback
          function (response: any) {
            debugLog(`WayForPay failed callback: ${response?.reason || 'Unknown reason'}`)
            console.log('WayForPay failed:', response)
            hasRedirectedRef.current = true // Prevent redirect detection from triggering
            setError(
              response.reason ||
              t('errors.paymentFailed')
            )
            setIsLoading(false)
            setIsRedirecting(false)
          },
          // Pending callback (also triggered when user closes popup or payment is being processed)
          function (response: any) {
            debugLog(`WayForPay pending callback: orderReference=${response?.orderReference}`)
            console.log('WayForPay pending/closed:', response)

            // If we have an orderReference, the payment might be processing
            // Redirect to success page to show pending status
            if (response && response.orderReference) {
              debugLog('Payment is pending, redirecting to success page...')
              console.log('Payment is pending, redirecting to success page...')
              hasRedirectedRef.current = true
              // Use the returnUrl from paymentParams
              if (paymentParams.returnUrl) {
                window.location.href = paymentParams.returnUrl
              }
            } else {
              debugLog('User closed payment window without completing')
              hasRedirectedRef.current = true
              // User likely closed the popup without completing payment
              setError(
                locale === 'en'
                  ? 'Payment window was closed. You can try again or contact support if you believe this is an error.'
                  : locale === 'zh'
                  ? '支付窗口已关闭。您可以重试，或如果您认为这是错误请联系支持。'
                  : 'Вікно оплати було закрито. Ви можете спробувати ще раз або зв\'язатися з підтримкою, якщо вважаєте, що це помилка.'
              )
              setIsLoading(false)
              setIsRedirecting(false)
            }
          }
        )

        debugLog('wayforpay.run() called successfully')

        // On mobile devices, WayForPay typically redirects to their payment page
        // Set a flag to show "redirecting" message
        if (isIOS()) {
          debugLog('Mobile device detected - expecting redirect to WayForPay page')
          setIsRedirecting(true)
          setIsLoading(false)

          // Safety check: if we haven't redirected after 3 seconds, something might be wrong
          setTimeout(() => {
            if (!hasRedirectedRef.current) {
              debugLog('WARNING: No redirect detected after 3 seconds on mobile device')
              // Don't show error yet, just log it
            }
          }, 3000)

          // After 10 seconds, if still no redirect, show helpful message
          setTimeout(() => {
            if (!hasRedirectedRef.current && !error) {
              debugLog('ERROR: No redirect after 10 seconds - possible popup blocker')
              setIsRedirecting(false)
              setError(
                locale === 'en'
                  ? 'Payment page did not open. Please check if popup blockers are enabled in Safari settings and try again.'
                  : locale === 'zh'
                  ? '支付页面未打开。请检查 Safari 设置中是否启用了弹窗拦截器，然后重试。'
                  : 'Сторінка оплати не відкрилася. Будь ласка, перевірте налаштування Safari щодо блокування спливаючих вікон і спробуйте ще раз.'
              )
            }
          }, 10000)
        } else {
          // Desktop - popup should appear
          setIsLoading(false)
        }
      } catch (err) {
        debugLog(`EXCEPTION in initializeWidget: ${err}`)
        console.error('Error initializing WayForPay:', err)
        setError(t('errors.serverError'))
        setIsLoading(false)
        setIsRedirecting(false)
      }
    }

    loadWayForPayScript()

    // Cleanup
    return () => {
      debugLog('Component unmounting, cleaning up')
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current)
      }
    }
  }, [paymentParams, t])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('payment.title')}</h2>
        <p className="text-sm text-gray-600">
          {locale === 'en'
            ? 'A payment window will open shortly'
            : locale === 'zh'
            ? '支付窗口即将打开'
            : 'Вікно оплати відкриється незабаром'}
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
                {locale === 'en'
                  ? 'Redirecting to Payment Page...'
                  : locale === 'zh'
                  ? '正在跳转到支付页面...'
                  : 'Перенаправлення на сторінку оплати...'}
              </p>
              <p className="text-sm text-blue-700 mb-3">
                {locale === 'en'
                  ? 'You will be redirected to WayForPay secure payment page in a moment. Please do not close this window.'
                  : locale === 'zh'
                  ? '您即将跳转到 WayForPay 安全支付页面。请不要关闭此窗口。'
                  : 'Ви будете перенаправлені на безпечну сторінку оплати WayForPay. Будь ласка, не закривайте це вікно.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {locale === 'en'
                    ? 'If nothing happens, check your popup blocker settings'
                    : locale === 'zh'
                    ? '如果没有跳转，请检查弹窗拦截设置'
                    : 'Якщо нічого не відбувається, перевірте налаштування блокування спливаючих вікон'}
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
                {locale === 'en' ? 'Payment Failed' : locale === 'zh' ? '支付失败' : 'Помилка оплати'}
              </p>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <p className="text-xs text-red-600">
                {locale === 'en'
                  ? 'You can go back and try again with a different payment method.'
                  : locale === 'zh'
                  ? '您可以返回并使用其他支付方式重试。'
                  : 'Ви можете повернутися і спробувати інший спосіб оплати.'}
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
            {locale === 'en'
              ? 'Preparing payment window...'
              : locale === 'zh'
              ? '正在准备支付窗口...'
              : 'Підготовка вікна оплати...'}
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
            {locale === 'en'
              ? 'Back to Edit Donation'
              : locale === 'zh'
              ? '返回修改捐赠信息'
              : 'Повернутися до редагування'}
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
              {locale === 'en' ? 'Secure Payment' : locale === 'zh' ? '安全支付' : 'Безпечна оплата'}
            </p>
            <p className="text-gray-600">
              {locale === 'en'
                ? 'Your payment is processed securely through WayForPay'
                : locale === 'zh'
                ? '您的支付通过 WayForPay 安全处理'
                : 'Ваш платіж обробляється безпечно через WayForPay'}
            </p>
          </div>
        </div>
      </div>

      {/* Debug Info - Only show when there's an error or in development */}
      {(error || process.env.NODE_ENV === 'development') && debugInfo.length > 0 && (
        <details className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-xs">
          <summary className="cursor-pointer font-mono font-semibold text-gray-700 mb-2">
            {locale === 'en' ? 'Debug Information' : locale === 'zh' ? '调试信息' : 'Інформація для відлагодження'}
            {' '}({debugInfo.length} logs)
          </summary>
          <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
            {debugInfo.map((log, index) => (
              <div key={index} className="font-mono text-gray-600 break-all">
                {log}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const debugText = debugInfo.join('\n')
              navigator.clipboard.writeText(debugText)
              alert(locale === 'en' ? 'Debug info copied!' : locale === 'zh' ? '调试信息已复制！' : 'Інформацію для відлагодження скопійовано!')
            }}
            className="mt-3 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium text-xs"
          >
            {locale === 'en' ? 'Copy Debug Info' : locale === 'zh' ? '复制调试信息' : 'Копіювати інформацію'}
          </button>
        </details>
      )}
    </div>
  )
}
