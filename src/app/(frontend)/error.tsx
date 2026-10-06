'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

// Error boundaries must be client components
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error) // replaced by Sentry in M11
  }, [error])

  return (
    <div className="container mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2">
        We couldn&apos;t load this page. Please try again in a moment.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
