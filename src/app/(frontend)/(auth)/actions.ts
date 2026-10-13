'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'
import { ValidationError } from 'payload'

import { checkDevice, sendVerificationEmail, trustDevice } from '@/lib/accountSecurity'
import { getCurrentUser, safeRedirectPath } from '@/lib/auth'
import { getDeviceId } from '@/lib/device'
import { TERMS_VERSION } from '@/lib/legal'
import { getPayloadClient } from '@/lib/payload'
import { clientIp, rateLimit, TOO_MANY_REQUESTS } from '@/lib/rateLimit'
import { reportUnexpectedError } from '@/lib/reportError'
import { verifyTurnstile } from '@/lib/turnstile'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type FormState,
} from '@/lib/validation/auth'

const humanCheckFailed: FormState = {
  error: 'Please complete the "I am human" check and try again.',
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  const values = { name: String(raw.name ?? ''), email: String(raw.email ?? ''), role: String(raw.role ?? '') }
  const ip = await clientIp()

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  if (!rateLimit('register', ip)) return { error: TOO_MANY_REQUESTS, values }
  if (!(await verifyTurnstile(raw.turnstileToken, ip))) return { ...humanCheckFailed, values }

  const payload = await getPayloadClient()
  let userId: number
  try {
    // Public signup: access control applies, and the protectRole hook blocks "admin"
    const user = await payload.create({
      collection: 'users',
      data: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password, role: parsed.data.role },
      overrideAccess: false,
    })
    userId = user.id
    // Trusted server step: record which terms were accepted (not writable by the visitor)
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { termsAcceptedAt: new Date().toISOString(), termsVersion: TERMS_VERSION },
      overrideAccess: true,
    })
  } catch (error) {
    // Payload reports a duplicate email as a ValidationError on the email field
    if (error instanceof ValidationError && error.data.errors.some((e) => e.path === 'email')) {
      return { fieldErrors: { email: ['An account with this email already exists.'] }, values }
    }
    return { error: 'Could not create your account. Please try again.', values }
  }

  // The browser used to sign up is trusted; the confirmation link goes out by email
  await trustDevice(payload, userId, await getDeviceId())
  await sendVerificationEmail(payload, userId)
  await login({ collection: 'users', config, email: parsed.data.email, password: parsed.data.password })
  // Back to where the visitor was going (e.g. a job they wanted to apply to), same-site only
  redirect(safeRedirectPath(raw.next))
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  const values = { email: String(raw.email ?? '') }
  const ip = await clientIp()

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  if (!rateLimit('login', ip)) return { error: TOO_MANY_REQUESTS, values }
  if (!(await verifyTurnstile(raw.turnstileToken, ip))) return { ...humanCheckFailed, values }

  const payload = await getPayloadClient()
  let userId: number
  try {
    // Check the password first without signing in (still counts towards the lockout)
    const result = await payload.login({ collection: 'users', data: { email: parsed.data.email, password: parsed.data.password } })
    if (!result.user || result.user.banned) throw new Error('not allowed')
    userId = result.user.id
  } catch {
    // Same message for unknown email, wrong password and locked account: don't leak which one
    return { error: 'Invalid email or password.', values }
  }

  // A browser this account hasn't used before needs the code we email
  const device = await checkDevice(payload, userId, await getDeviceId(), parsed.data.code)
  if (!device.ok) {
    const messages = {
      'code-sent': 'We sent a 6-digit code to your email. Enter it to finish signing in.',
      'code-recently-sent': 'Enter the 6-digit code we just emailed you.',
      'wrong-code': 'That code is not right. Check the latest email and try again.',
      'expired-code': 'This code has expired. Sign in again to get a new one.',
    } as const
    const isError = device.reason === 'wrong-code' || device.reason === 'expired-code'
    return { needsCode: device.reason !== 'expired-code', values, ...(isError ? { error: messages[device.reason] } : { success: messages[device.reason] }) }
  }

  try {
    await login({ collection: 'users', config, email: parsed.data.email, password: parsed.data.password })
  } catch {
    return { error: 'Invalid email or password.', values }
  }

  // redirect() works by throwing, so it must stay outside the try/catch
  redirect(safeRedirectPath(raw.next))
}

export async function logoutAction() {
  await logout({ config })
  redirect('/')
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const ip = await clientIp()
  if (!rateLimit('forgotPassword', ip)) return { error: TOO_MANY_REQUESTS }
  if (!(await verifyTurnstile(formData.get('turnstileToken'), ip))) return humanCheckFailed

  const payload = await getPayloadClient()
  try {
    await payload.forgotPassword({ collection: 'users', data: parsed.data, overrideAccess: false })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'forgotPassword failed' })
  }
  // Always the same answer, so the form can't be used to find out who has an account
  return { success: 'If an account exists for that email, we sent a link to reset your password.' }
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const payload = await getPayloadClient()
  let email: string
  try {
    const result = await payload.resetPassword({
      collection: 'users',
      data: { token: parsed.data.token, password: parsed.data.password },
      overrideAccess: false,
    })
    email = (result.user as { email: string }).email
  } catch (error) {
    // Usually an old/used/expired token; logged so other causes show up in the server logs
    reportUnexpectedError(error, 'resetPassword')
    return { error: 'This reset link is invalid or has expired. Please request a new one.' }
  }

  await login({ collection: 'users', config, email, password: parsed.data.password })
  redirect('/dashboard')
}

// "Resend the link" in the dashboard banner (one email per minute at most)
export async function resendVerificationAction(_prev: FormState): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please log in again.' }
  if (user.emailVerified) return { success: 'Your email is already confirmed.' }
  const sent = await sendVerificationEmail(await getPayloadClient(), user.id)
  return sent ? { success: `We sent a new link to ${user.email}.` } : { error: 'Please wait a minute before asking for another link.' }
}
