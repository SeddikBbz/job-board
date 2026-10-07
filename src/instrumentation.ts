import * as Sentry from '@sentry/nextjs'

// Runs once when the server starts (Node.js and Edge runtimes).
// Without SENTRY_DSN, Sentry stays off (local development).
export function register() {
  if (!process.env.SENTRY_DSN) return
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Sample 10% of requests for performance tracing; errors are always sent
    tracesSampleRate: 0.1,
  })
}

// Reports errors thrown while rendering Server Components, route handlers and server actions
export const onRequestError = Sentry.captureRequestError
