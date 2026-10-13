import { createLocalReq, type Payload } from 'payload'

import { loginCodeEmail, verifyEmailEmail } from '@/lib/email/templates'
import { queueEmail } from '@/lib/email/queue'
import { randomCode, randomToken, sameHash, sha256 } from '@/lib/tokens'
import type { User } from '@/payload-types'

export const RESEND_COOLDOWN_MS = 60_000
const VERIFY_TTL_MS = 24 * 60 * 60_000
const CODE_TTL_MS = 10 * 60_000
const MAX_CODE_ATTEMPTS = 5
const MAX_DEVICES = 10

// Trusted server code: these fields are hidden from every API
const trusted = { overrideAccess: true, showHiddenFields: true, depth: 0 } as const

const loadUser = (payload: Payload, id: number) => payload.findByID({ collection: 'users', id, ...trusted })

const sendEmail = async (payload: Payload, message: Parameters<typeof queueEmail>[1]) =>
  queueEmail(await createLocalReq({}, payload), message)

const isFresh = (sentAt: string | null | undefined, ms: number) => Boolean(sentAt && Date.now() - Date.parse(sentAt) < ms)

// ---------- email verification ----------

// Sends (or re-sends) the confirmation link. Returns false when asked again within the cooldown.
export async function sendVerificationEmail(payload: Payload, userId: number): Promise<boolean> {
  const user = await loadUser(payload, userId)
  if (user.emailVerified) return true
  if (isFresh(user.verificationSentAt, RESEND_COOLDOWN_MS)) return false
  const token = randomToken()
  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      verificationTokenHash: sha256(token),
      verificationExpires: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
      verificationSentAt: new Date().toISOString(),
    },
    ...trusted,
  })
  await sendEmail(payload, verifyEmailEmail({ to: user.email, name: user.name, token }))
  return true
}

// Marks the account verified if the link's token is valid. Returns the user or null.
export async function confirmEmail(payload: Payload, token: string): Promise<User | null> {
  if (!token) return null
  const { docs } = await payload.find({
    collection: 'users',
    where: { verificationTokenHash: { equals: sha256(token) } },
    limit: 1,
    ...trusted,
  })
  const user = docs[0]
  if (!user || !user.verificationExpires || Date.parse(user.verificationExpires) < Date.now()) return null
  return payload.update({
    collection: 'users',
    id: user.id,
    data: { emailVerified: true, emailVerifiedAt: new Date().toISOString(), verificationTokenHash: null, verificationExpires: null },
    ...trusted,
  })
}

// ---------- new-device sign-in check ----------

export type DeviceCheck =
  | { ok: true }
  | { ok: false; reason: 'code-sent' | 'code-recently-sent' | 'wrong-code' | 'expired-code' }

const deviceHash = (userId: number, deviceId: string) => sha256(`${userId}:${deviceId}`)

export async function trustDevice(payload: Payload, userId: number, deviceId: string) {
  const user = await loadUser(payload, userId)
  const hash = deviceHash(userId, deviceId)
  const known = (user.knownDevices ?? []).filter((d) => d !== hash)
  await payload.update({
    collection: 'users',
    id: userId,
    // Most recent first; the oldest is forgotten after MAX_DEVICES
    data: { knownDevices: [hash, ...known].slice(0, MAX_DEVICES), loginCodeHash: null, loginCodeDevice: null, loginCodeExpires: null, loginCodeAttempts: 0 },
    ...trusted,
  })
}

/**
 * Called after the password was checked. A known browser passes. An account with no known
 * browser yet (existing accounts, first sign-in after this feature) trusts this one ("trust on
 * first use"), so nobody is locked out. Any other browser must enter the code we email.
 */
export async function checkDevice(payload: Payload, userId: number, deviceId: string, code?: string): Promise<DeviceCheck> {
  const user = await loadUser(payload, userId)
  const hash = deviceHash(userId, deviceId)
  const known = user.knownDevices ?? []

  if (known.length === 0 || known.includes(hash)) {
    await trustDevice(payload, userId, deviceId)
    return { ok: true }
  }

  const pendingForThisDevice = user.loginCodeDevice === hash && user.loginCodeExpires && Date.parse(user.loginCodeExpires) > Date.now()

  if (code && pendingForThisDevice) {
    const attempts = (user.loginCodeAttempts ?? 0) + 1
    if (attempts > MAX_CODE_ATTEMPTS) return { ok: false, reason: 'expired-code' }
    if (sameHash(user.loginCodeHash, sha256(`${userId}:${code.trim()}`))) {
      await trustDevice(payload, userId, deviceId)
      return { ok: true }
    }
    await payload.update({ collection: 'users', id: userId, data: { loginCodeAttempts: attempts }, ...trusted })
    return { ok: false, reason: attempts >= MAX_CODE_ATTEMPTS ? 'expired-code' : 'wrong-code' }
  }

  if (pendingForThisDevice && isFresh(user.loginCodeSentAt, RESEND_COOLDOWN_MS)) {
    return { ok: false, reason: code ? 'expired-code' : 'code-recently-sent' }
  }

  const newCode = randomCode()
  await payload.update({
    collection: 'users',
    id: userId,
    data: {
      loginCodeHash: sha256(`${userId}:${newCode}`),
      loginCodeDevice: hash,
      loginCodeExpires: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      loginCodeSentAt: new Date().toISOString(),
      loginCodeAttempts: 0,
    },
    ...trusted,
  })
  await sendEmail(payload, loginCodeEmail({ to: user.email, name: user.name, code: newCode }))
  return { ok: false, reason: 'code-sent' }
}
