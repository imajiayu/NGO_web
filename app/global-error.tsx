'use client'

import { useEffect } from 'react'

// Minimal error messages for global error boundary
const errorMessages = {
  en: {
    title: 'Something went wrong',
    description: "We're sorry, but something unexpected happened. Please try again, or contact us if the problem persists.",
    button: 'Try again',
  },
  zh: {
    title: '发生了错误',
    description: '很抱歉，发生了意外错误。请重试，如果问题持续存在请联系我们。',
    button: '重试',
  },
  ua: {
    title: 'Щось пішло не так',
    description: 'Вибачте, але сталася неочікувана помилка. Спробуйте ще раз або зв’яжіться з нами, якщо проблема не зникає.',
    button: 'Спробувати знову',
  },
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentry 已从 client bundle 移除（性能优化，-122KB gzip）。纯 client 端根崩溃
    // 仅在控制台记录；服务端错误仍由 instrumentation.ts 的 server 端 Sentry 捕获。
    console.error('Global error:', error)
  }, [error])

  // Try to detect locale from browser, fallback to 'en'
  const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en'
  const locale = browserLang in errorMessages ? browserLang : 'en'
  const messages = errorMessages[locale as keyof typeof errorMessages]

  return (
    <html lang={locale}>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#f9fafb',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              textAlign: 'center',
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h1
              style={{
                fontSize: '2rem',
                marginBottom: '1rem',
                color: '#111827',
                fontWeight: '600',
              }}
            >
              {messages.title}
            </h1>
            <p
              style={{
                marginBottom: '2rem',
                color: '#6b7280',
                lineHeight: '1.6',
              }}
            >
              {messages.description}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 32px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#374151'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#000'
              }}
            >
              {messages.button}
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
