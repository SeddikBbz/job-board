import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

// Secrets are emailed in clear but only their hash is stored, like passwords.
export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

// Long random token for links (email verification)
export const randomToken = () => randomBytes(32).toString('hex')

// 6-digit code typed by the user (new-device sign-in)
export const randomCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')

// Constant-time comparison of two hex hashes
export function sameHash(a: string | null | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
