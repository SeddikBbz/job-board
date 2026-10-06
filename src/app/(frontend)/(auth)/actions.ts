'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ValidationError } from 'payload'

import { safeRedirectPath } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { verifyTurnstile } from '@/lib/turnstile'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type FormState,
} from '@/lib/validation/auth'

const clientIp = async () => (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

const humanCheckFailed: FormState = {
  error: 'Please complete the "I am human" check and try again.',
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  const values = { name: String(raw.name ?? ''), email: String(raw.email ?? ''), role: String(raw.role ?? '') }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  if (!(await verifyTurnstile(raw.turnstileToken, await clientIp()))) return { ...humanCheckFailed, values }

  const payload = await getPayloadClient()
  try {
    // Public signup: access control applies, and the protectRole hook blocks "admin"
    await payload.create({
      collection: 'users',
      data: parsed.data,
      overrideAccess: false,
    })
  } catch (error) {
    // Payload reports a duplicate email as a ValidationError on the email field
    if (error instanceof ValidationError && error.data.errors.some((e) => e.path === 'email')) {
      return { fieldErrors: { email: ['An account with this email already exists.'] }, values }
    }
    return { error: 'Could not create your account. Please try again.', values }
  }

  await login({ collection: 'users', config, email: parsed.data.email, password: parsed.data.password })
  redirect('/dashboard')
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  const values = { email: String(raw.email ?? '') }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values }
  if (!(await verifyTurnstile(raw.turnstileToken, await clientIp()))) return { ...humanCheckFailed, values }

  try {
    await login({ collection: 'users', config, ...parsed.data })
  } catch {
    // Same message for unknown email, wrong password and locked account: don't leak which one
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

  const payload = await getPayloadClient()
  try {
    await payload.forgotPassword({ collection: 'users', data: parsed.data })
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
  } catch {
    return { error: 'This reset link is invalid or has expired. Please request a new one.' }
  }

  await login({ collection: 'users', config, email, password: parsed.data.password })
  redirect('/dashboard')
}
