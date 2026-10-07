import { headers } from 'next/headers'

// Simple fixed-window limiter kept in memory. Good enough for one server; on Vercel each
// instance has its own memory, so add Vercel Firewall rate-limit rules in production too.
type Window = { count: number; resetAt: number }
const windows = new Map<string, Window>()

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  forgotPassword: { limit: 5, windowMs: 60 * 60_000 },
  apply: { limit: 20, windowMs: 60 * 60_000 },
} as const

// Returns true if the action may proceed, false if the caller is over the limit.
export function rateLimit(action: keyof typeof RATE_LIMITS, key: string): boolean {
  const { limit, windowMs } = RATE_LIMITS[action]
  const now = Date.now()
  const id = `${action}:${key}`
  const current = windows.get(id)

  if (!current || current.resetAt <= now) {
    windows.set(id, { count: 1, resetAt: now + windowMs })
    // Drop expired entries now and then so the map can't grow forever
    if (windows.size > 10_000) for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k)
    return true
  }
  current.count++
  return current.count <= limit
}

export async function clientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

export const TOO_MANY_REQUESTS = 'Too many attempts. Please wait a few minutes and try again.'
