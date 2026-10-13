import { cookies } from 'next/headers'

import { randomToken } from '@/lib/tokens'

// Long-lived random id for this browser. Not personal data on its own: we only store its hash
// on accounts that signed in here, to recognise trusted browsers.
const COOKIE = 'jb_device'

export async function getDeviceId(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(COOKIE)?.value
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing
  const id = randomToken()
  jar.set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 400,
  })
  return id
}
