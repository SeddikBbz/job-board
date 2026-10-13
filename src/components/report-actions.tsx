'use client'

import { useActionState } from 'react'

import { handleJobReports } from '@/app/(frontend)/dashboard/reports/actions'
import { FormMessage } from '@/components/form'
import { Button } from '@/components/ui/button'
import type { FormState } from '@/lib/validation/auth'

export function ReportActions({ jobId }: { jobId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(handleJobReports, {})
  if (state.success) return <FormMessage success={state.success} />
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="jobId" value={jobId} />
      <FormMessage error={state.error} />
      <label className="sr-only" htmlFor={`note-${jobId}`}>
        Note (optional, sent to the employer)
      </label>
      <input
        id={`note-${jobId}`}
        name="note"
        placeholder="Note (optional, sent to the employer)"
        className="border-input h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="dismiss" size="sm" variant="outline" disabled={pending}>
          Dismiss
        </Button>
        <Button type="submit" name="decision" value="unpublish" size="sm" disabled={pending}>
          Unpublish job
        </Button>
        <Button type="submit" name="decision" value="ban" size="sm" variant="destructive" disabled={pending}>
          Ban employer
        </Button>
      </div>
    </form>
  )
}
