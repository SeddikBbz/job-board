'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'

import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
} from '@/app/(frontend)/(auth)/actions'
import { useAuthRole, type AuthRole } from '@/components/auth/auth-role'
import { FormField, FormMessage } from '@/components/form'
import { PasswordField } from '@/components/password-field'
import { Turnstile } from '@/components/turnstile'
import { Button } from '@/components/ui/button'
import { useFormFeedback } from '@/components/use-form-feedback'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type FormState,
} from '@/lib/validation/auth'

const initialState: FormState = {}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}

export function LoginForm({ siteKey, next }: { siteKey: string; next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState)
  const { formProps, errorsFor } = useFormFeedback(loginSchema.shape, state)
  // Controlled, so a second step (code from a new browser) can resend them with the code
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  if (state.needsCode) {
    return (
      <form action={action} className="space-y-4" noValidate {...formProps}>
        <FormMessage error={state.error} success={state.success} />
        <input type="hidden" name="next" value={next ?? ''} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />
        <p className="text-muted-foreground text-sm">
          This browser is new for <strong className="text-foreground">{email}</strong>, so we check it&apos;s really you.
        </p>
        <FormField
          label="6-digit code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          errors={errorsFor('code')}
        />
        <Turnstile siteKey={siteKey} resetKey={state} />
        <SubmitButton pending={pending}>Confirm and log in</SubmitButton>
      </form>
    )
  }
  return (
    <form action={action} className="space-y-4" noValidate {...formProps}>
      <FormMessage error={state.error} />
      <input type="hidden" name="next" value={next ?? ''} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} errors={errorsFor('email')} />
      <div className="space-y-2">
        <PasswordField label="Password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} errors={errorsFor('password')} />
        <div className="text-end text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>
      </div>
      <Turnstile siteKey={siteKey} resetKey={state} />
      <SubmitButton pending={pending}>Log in</SubmitButton>
    </form>
  )
}

const ROLES: { value: AuthRole; label: string }[] = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'employer', label: 'Employer' },
]

export function RegisterForm({ siteKey, next, initialRole = 'candidate' }: { siteKey: string; next?: string; initialRole?: AuthRole }) {
  const [state, action, pending] = useActionState(registerAction, initialState)
  const { formProps, errorsFor } = useFormFeedback(registerSchema.shape, state)
  const { role, setRole } = useAuthRole()
  // The panel follows this form: start from the URL (?role=employer) or the last submitted value
  const startRole = (state.values?.role as AuthRole) || initialRole
  useEffect(() => setRole(startRole), [startRole, setRole])
  const termsErrors = errorsFor('terms')

  return (
    <form action={action} className="space-y-4" noValidate {...formProps}>
      <FormMessage error={state.error} />
      <input type="hidden" name="next" value={next ?? ''} />

      {/* Segmented control: two radio buttons, so it works with the keyboard (arrow keys) */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">I am a</legend>
        <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1">
          {ROLES.map((option) => (
            <label
              key={option.value}
              className="text-foreground/75 has-[:checked]:bg-background has-[:checked]:text-foreground has-[:focus-visible]:ring-ring flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors has-[:checked]:shadow-sm has-[:focus-visible]:ring-2"
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label="Full name" name="name" autoComplete="name" required defaultValue={state.values?.name} errors={errorsFor('name')} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} errors={errorsFor('email')} />
      <PasswordField label="Password" name="password" autoComplete="new-password" required showRules errors={errorsFor('password')} />

      <div className="space-y-1">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="terms"
            required
            className="accent-primary mt-0.5 size-4 shrink-0"
            aria-invalid={Boolean(termsErrors) || undefined}
            aria-describedby={termsErrors ? 'terms-error' : undefined}
          />
          <span className="text-muted-foreground">
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-primary font-medium underline underline-offset-2">
              terms
            </Link>{' '}
            and the{' '}
            <Link href="/privacy" target="_blank" className="text-primary font-medium underline underline-offset-2">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {termsErrors && (
          <p id="terms-error" className="text-destructive text-sm">
            {termsErrors[0]}
          </p>
        )}
      </div>

      <Turnstile siteKey={siteKey} resetKey={state} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  )
}

export function ForgotPasswordForm({ siteKey }: { siteKey: string }) {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState)
  const { formProps, errorsFor } = useFormFeedback(forgotPasswordSchema.shape, state)
  if (state.success) return <FormMessage success={state.success} />
  return (
    <form action={action} className="space-y-4" noValidate {...formProps}>
      <FormMessage error={state.error} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required errors={errorsFor('email')} />
      <Turnstile siteKey={siteKey} resetKey={state} />
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState)
  const { formProps, errorsFor } = useFormFeedback(resetPasswordSchema.shape, state)
  return (
    <form action={action} className="space-y-4" noValidate {...formProps}>
      <FormMessage error={state.error ?? state.fieldErrors?.token?.[0]} />
      <input type="hidden" name="token" value={token} />
      <PasswordField label="New password" name="password" autoComplete="new-password" required showRules errors={errorsFor('password')} />
      <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" required errors={errorsFor('confirmPassword')} />
      <SubmitButton pending={pending}>Save new password</SubmitButton>
    </form>
  )
}
