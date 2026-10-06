'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

type Props = {
  siteKey: string
  // Change this value (e.g. pass the form state) to get a fresh token: tokens are single-use
  resetKey?: unknown
}

// Cloudflare Turnstile widget. Puts the token in a hidden "turnstileToken" input;
// the server action verifies it with Cloudflare.
export function Turnstile({ siteKey, resetKey }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [token, setToken] = useState('')

  const render = useCallback(() => {
    if (!container.current || !window.turnstile || widgetId.current) return
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      callback: setToken,
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    })
  }, [siteKey])

  useEffect(() => {
    render()
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = null
    }
  }, [render])

  useEffect(() => {
    if (resetKey && widgetId.current) {
      window.turnstile?.reset(widgetId.current)
      setToken('')
    }
  }, [resetKey])

  if (!siteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={container} className="min-h-[65px]" />
      <input type="hidden" name="turnstileToken" value={token} />
    </>
  )
}
