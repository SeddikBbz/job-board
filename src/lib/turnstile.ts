// Server-side only: imported from server actions (the secret key must never reach the browser).

// Cloudflare's official test keys: the widget always passes. Used only outside production
// so local development and CI work without a Cloudflare account.
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TEST_SITE_KEY = '1x00000000000000000000AA'
const TEST_SECRET_KEY = '1x0000000000000000000000000000000AA'
const isProduction = process.env.NODE_ENV === 'production'

export const getTurnstileSiteKey = () =>
  process.env.TURNSTILE_SITE_KEY || (isProduction ? '' : TEST_SITE_KEY)

// Fails closed: no secret or no token means "not verified".
export async function verifyTurnstile(token: unknown, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || (isProduction ? '' : TEST_SECRET_KEY)
  if (!secret || typeof token !== 'string' || !token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
