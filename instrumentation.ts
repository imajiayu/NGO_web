// This file is used to configure Sentry on the server side and edge runtime.
// It will be automatically called by Next.js when the server starts.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // Filter out sensitive data
      beforeSend(event) {
        // Remove email addresses from error messages
        if (event.message) {
          event.message = event.message.replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[EMAIL]')
        }

        // Remove sensitive data from request body
        if (event.request?.data) {
          const data = event.request.data
          if (typeof data === 'object') {
            // Redact sensitive fields
            const redactedData = { ...data }
            const sensitiveFields = ['email', 'password', 'token', 'secret', 'apiKey', 'merchantAccount']

            for (const field of sensitiveFields) {
              if (field in redactedData) {
                redactedData[field] = '[REDACTED]'
              }
            }

            event.request.data = redactedData
          }
        }

        return event
      },
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    })
  }
}
