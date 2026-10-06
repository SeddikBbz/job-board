'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'

import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
} from '@/app/(frontend)/(auth)/actions'
import { FormField, FormMessage } from '@/components/form'
import { Turnstile } from '@/components/turnstile'
import { Button } from '@/components/ui/button'
import type { FormState } from '@/lib/validation/auth'

const initialState: FormState = {}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}

export function LoginForm({ siteKey, next }: { siteKey: string; next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState)
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state.error} />
      <input type="hidden" name="next" value={next ?? ''} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" required errors={state.fieldErrors?.password} />
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot your password?
        </Link>
      </div>
      <Turnstile siteKey={siteKey} resetKey={state} />
      <SubmitButton pending={pending}>Log in</SubmitButton>
    </form>
  )
}

export function RegisterForm({ siteKey }: { siteKey: string }) {
  const [state, action, pending] = useActionState(registerAction, initialState)
  const role = state.values?.role || 'candidate'
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state.error} />
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">I want to</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'candidate', label: 'Find a job' },
            { value: 'employer', label: 'Hire people' },
          ].map((option) => (
            <label
              key={option.value}
              className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-ring flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:focus-visible]:ring-2"
            >
              <input type="radio" name="role" value={option.value} defaultChecked={role === option.value} className="accent-primary" />
              {option.label}
            </label>
          ))}
        </div>
        {state.fieldErrors?.role && <p className="text-destructive text-sm">{state.fieldErrors.role[0]}</p>}
      </fieldset>
      <FormField label="Full name" name="name" autoComplete="name" required defaultValue={state.values?.name} errors={state.fieldErrors?.name} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
      <FormField label="Password" name="password" type="password" autoComplete="new-password" required hint="At least 8 characters." errors={state.fieldErrors?.password} />
      <Turnstile siteKey={siteKey} resetKey={state} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState)
  if (state.success) return <FormMessage success={state.success} />
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state.error} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required errors={state.fieldErrors?.email} />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState)
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage error={state.error ?? state.fieldErrors?.token?.[0]} />
      <input type="hidden" name="token" value={token} />
      <FormField label="New password" name="password" type="password" autoComplete="new-password" required hint="At least 8 characters." errors={state.fieldErrors?.password} />
      <FormField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required errors={state.fieldErrors?.confirmPassword} />
      <SubmitButton pending={pending}>Save new password</SubmitButton>
    </form>
  )
}
