import * as Sentry from '@sentry/nextjs'

// For errors we turn into a friendly message: still record the real cause, so it shows up
// in the server logs (Vercel → Logs) and in Sentry (when a DSN is configured).
export function reportUnexpectedError(error: unknown, where: string) {
  console.error(`[${where}]`, error)
  Sentry.captureException(error, { tags: { where } })
}
