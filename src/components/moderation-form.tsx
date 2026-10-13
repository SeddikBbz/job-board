'use client'

import { useActionState, useState } from 'react'

import { moderateJobAction } from '@/app/(frontend)/dashboard/moderation/actions'
import { FormMessage } from '@/components/form'
import { Button } from '@/components/ui/button'
import type { FormState } from '@/lib/validation/auth'

export function ModerationForm({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(moderateJobAction, {})
  const [rejecting, setRejecting] = useState(false)
  if (state.success) return <FormMessage success={state.success} />
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="jobId" value={jobId} />
      <FormMessage error={state.error} />
      {rejecting && (
        <div className="space-y-1">
          <label htmlFor={`reason-${jobId}`} className="text-sm font-medium">
            Reason (sent to the employer)
          </label>
          <textarea
            id={`reason-${jobId}`}
            name="reason"
            rows={3}
            required
            className="border-input w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {rejecting ? (
          <>
            <Button type="submit" name="decision" value="reject" variant="destructive" size="sm" disabled={pending}>
              Reject job
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" name="decision" value="approve" size="sm" disabled={pending}>
              Approve
            </Button>
            <Button type="submit" name="decision" value="approve-trust" size="sm" variant="outline" disabled={pending}>
              Approve and trust company
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRejecting(true)}>
              Reject…
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
