'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

// Registers the service worker (production only) and offers a reload when a new version is ready.
export function RegisterServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Only an update (a worker already controls the page) deserves a banner
        const offer = (worker: ServiceWorker | null) => worker && navigator.serviceWorker.controller && setWaiting(worker)
        offer(registration.waiting)
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => worker.state === 'installed' && offer(worker))
        })
      })
      .catch(() => {})
    // When the new worker takes over, load the page again with the new version
    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloaded) {
        reloaded = true
        window.location.reload()
      }
    })
  }, [])

  if (!waiting) return null
  return (
    <div role="status" className="bg-foreground text-background fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm shadow-lg">
      <span>A new version is available.</span>
      <Button size="sm" variant="secondary" onClick={() => waiting.postMessage('skipWaiting')}>
        Reload
      </Button>
    </div>
  )
}
