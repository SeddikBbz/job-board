import * as Sentry from '@sentry/nextjs'

// Browser-side Sentry. The DSN is not a secret, but it must be NEXT_PUBLIC_ to reach the browser.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
