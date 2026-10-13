'use client'

import { Flag } from 'lucide-react'
import { useActionState } from 'react'

import { reportJob } from '@/app/(frontend)/jobs/[slug]/actions'
import { FormMessage } from '@/components/form'
import { Turnstile } from '@/components/turnstile'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { REPORT_REASONS } from '@/lib/reportReasons'
import type { FormState } from '@/lib/validation/auth'

// "Report this job" in two clicks. The panel is a dialog: it keeps keyboard focus inside and
// closes with Escape.
export function ReportJob({ jobId, siteKey }: { jobId: number; siteKey: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reportJob, {})
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag aria-hidden /> Report this job
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Report this job</SheetTitle>
          <SheetDescription>Tell us what&apos;s wrong. Reports are private: the employer never sees who sent them.</SheetDescription>
        </SheetHeader>
        {state.success ? (
          <div className="px-4">
            <FormMessage success={state.success} />
          </div>
        ) : (
          <form action={action} className="space-y-4 px-4 pb-6">
            <input type="hidden" name="jobId" value={jobId} />
            <FormMessage error={state.error} />
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">Reason</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="radio" name="reason" value={r.value} required className="accent-primary size-4" />
                  {r.label}
                </label>
              ))}
              {state.fieldErrors?.reason && <p className="text-destructive text-sm">{state.fieldErrors.reason[0]}</p>}
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="report-details">Details (optional)</Label>
              <textarea
                id="report-details"
                name="details"
                rows={4}
                maxLength={2000}
                className="border-input w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <Turnstile siteKey={siteKey} resetKey={state} />
            <Button type="submit" disabled={pending}>
              Send report
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
