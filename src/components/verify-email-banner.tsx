'use client'

import { MailWarning } from 'lucide-react'
import { useActionState } from 'react'

import { resendVerificationAction } from '@/app/(frontend)/(auth)/actions'
import { Button } from '@/components/ui/button'
import type { FormState } from '@/lib/validation/auth'

// Shown on the dashboard until the email address is confirmed
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState>(resendVerificationAction, {})
  return (
    <div role="status" data-testid="verify-email-banner" className="bg-secondary text-secondary-foreground mb-6 flex flex-col gap-3 rounded-xl p-4 text-sm sm:flex-row sm:items-center">
      <MailWarning className="size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold">Confirm your email address</p>
        <p>
          We sent a link to <strong>{email}</strong>. You need it to apply, post jobs and upload files.
          {state.success && <span className="mt-1 block">{state.success}</span>}
          {state.error && <span className="text-destructive mt-1 block">{state.error}</span>}
        </p>
      </div>
      <form action={action}>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Send a new link
        </Button>
      </form>
    </div>
  )
}
