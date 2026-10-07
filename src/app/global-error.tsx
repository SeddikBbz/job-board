'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Last-resort error page, used when a root layout itself fails. It replaces the whole
// document, so it renders its own <html> and can't rely on the site's styles.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1rem', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>Please refresh the page or try again later.</p>
      </body>
    </html>
  )
}
