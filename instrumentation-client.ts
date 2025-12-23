// This file configures the initialization of Sentry on the client (browser).
// The config you add here will be used whenever a user loads a page in their browser.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from '@sentry/nextjs'

// Export the router transition start hook to instrument navigation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  // Filter out sensitive data
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
