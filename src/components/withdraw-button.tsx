'use client'

import { Loader2 } from 'lucide-react'
import { useActionState } from 'react'

import { withdrawApplication } from '@/app/(frontend)/dashboard/actions'
import { Button } from '@/components/ui/button'
import type { FormState } from '@/lib/validation/auth'

export function WithdrawButton({ applicationId, jobTitle }: { applicationId: number; jobTitle: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(withdrawApplication, {})
  return (
    <form
      action={action}
      className="inline-flex flex-col items-start gap-1"
      onSubmit={(e) => {
        // Withdrawing can't be undone, so ask first
        if (!window.confirm(`Withdraw your application for "${jobTitle}"? This can't be undone.`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Withdraw
      </Button>
      {state.error && (
        <p role="alert" className="text-destructive max-w-48 text-xs">
          {state.error}
        </p>
      )}
    </form>
  )
}
