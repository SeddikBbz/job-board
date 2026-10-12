import { WifiOff } from 'lucide-react'
import type { Metadata } from 'next'

import { Container } from '@/components/container'

export const metadata: Metadata = { title: 'Offline', robots: { index: false } }

// Shown by the service worker when a page can't load without a connection
export default function OfflinePage() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <WifiOff className="text-muted-foreground size-10" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">Check your internet connection, then try again.</p>
    </Container>
  )
}
