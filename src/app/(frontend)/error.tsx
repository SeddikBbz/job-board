'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { Container } from '@/components/container'
import { Button } from '@/components/ui/button'

// Error boundaries must be client components
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <Container className="py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2">
        We couldn&apos;t load this page. Please try again in a moment.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </Container>
  )
}
