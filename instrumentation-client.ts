// This file configures the initialization of Sentry on the client (browser).
// The config you add here will be used whenever a user loads a page in their browser.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from '@sentry/nextjs'

// Export the router transition start hook to instrument navigation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',

  // 生产采样 10%，既保留性能洞察又不影响 first load JS bundle
  tracesSampleRate: 0.1,

  enableLogs: true,

  debug: false,

  beforeSend(event) {
    // Remove email addresses from error messages
    if (event.message) {
      event.message = event.message.replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[EMAIL]')
    }

    // Remove sensitive query parameters
    if (event.request?.query_string && typeof event.request.query_string === 'string') {
      event.request.query_string = event.request.query_string
        .replace(/email=[^&]*/gi, 'email=[REDACTED]')
        .replace(/token=[^&]*/gi, 'token=[REDACTED]')
    }

    return event
  },
})
