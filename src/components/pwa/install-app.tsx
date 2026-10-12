'use client'

import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const IOS_HINT_KEY = 'ios-install-hint-dismissed'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

// "Install app" button (Android/Chrome fire beforeinstallprompt), or a short hint on iOS Safari,
// which has no install prompt. Nothing shows once the app is installed.
export function InstallApp({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    const ua = navigator.userAgent
    const iosSafari = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
    let dismissed = false
    try {
      dismissed = localStorage.getItem(IOS_HINT_KEY) === '1'
    } catch {}
    // Deferred so the first render matches the server (no hydration mismatch)
    const timer = setTimeout(() => setIosHint(iosSafari && !dismissed), 0)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      clearTimeout(timer)
    }
  }, [])

  if (prompt) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={async () => {
          await prompt.prompt()
          setPrompt(null)
        }}
      >
        <Download aria-hidden /> Install app
      </Button>
    )
  }

  if (iosHint) {
    return (
      <p className={`bg-muted flex items-start gap-2 rounded-lg p-3 text-xs ${className ?? ''}`}>
        <Share className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span className="flex-1">
          Install the app: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            setIosHint(false)
            try {
              localStorage.setItem(IOS_HINT_KEY, '1')
            } catch {}
          }}
        >
          <X className="size-4" aria-hidden />
        </button>
      </p>
    )
  }
  return null
}
