import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { getPayloadClient } from './payload'

// The logged-in user for this request (or null). Cached so several components can call it.
export const getCurrentUser = cache(async () => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return user
})

// For pages that need a user: sends logged-out visitors to /login and back here afterwards.
export async function requireUser(returnTo: string) {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`)
  return user
}

// Only allow same-site paths ("/dashboard"), never "//evil.com" or "https://…" (open redirect).
export const safeRedirectPath = (value: unknown, fallback = '/dashboard') =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : fallback
