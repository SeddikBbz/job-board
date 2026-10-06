'use client'

import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'

import { applyToJob } from '@/app/(frontend)/jobs/[slug]/actions'
import { FormMessage } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/format'
import { MAX_RESUME_BYTES } from '@/lib/validation/application'
import type { FormState } from '@/lib/validation/auth'

type Status =
  | { kind: 'loading' }
  | { kind: 'anonymous' }
  | { kind: 'not-candidate' }
  | { kind: 'applied'; at: string }
  | { kind: 'can-apply' }

type Props = { jobId: number; jobSlug: string; jobTitle: string }

// Client-side so the job page itself stays cached and public.
// The server action re-checks everything; this only decides what to show.
export function ApplySection({ jobId, jobSlug, jobTitle }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' })
  const [state, action, pending] = useActionState<FormState, FormData>(applyToJob, {})
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const me = await fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json()).catch(() => null)
      const user = me?.user
      if (!user) return { kind: 'anonymous' } as const
      if (user.role !== 'candidate') return { kind: 'not-candidate' } as const
      // Candidates can only read their own applications, so this only finds theirs
      const res = await fetch(`/api/applications?where[job][equals]=${jobId}&limit=1&depth=0`, {
        credentials: 'include',
      }).then((r) => r.json())
      const existing = res?.docs?.[0]
      return existing ? ({ kind: 'applied', at: existing.createdAt } as const) : ({ kind: 'can-apply' } as const)
    }
    load()
      .then((s) => !cancelled && setStatus(s))
      .catch(() => !cancelled && setStatus({ kind: 'anonymous' }))
    return () => {
      cancelled = true
    }
  }, [jobId])

  if (status.kind === 'loading') {
    return <div className="bg-muted h-40 animate-pulse rounded-xl" aria-label="Loading application form" />
  }

  if (state.success || status.kind === 'applied') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-600/30 bg-emerald-50 p-5 text-emerald-900">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{state.success ? 'Application sent' : 'Already applied'}</p>
          <p>
            {state.success ??
              `You applied to this job on ${formatDate(status.kind === 'applied' ? status.at : null)}.`}
          </p>
          <Link href="/dashboard/applications" className="font-medium underline">
            Track your applications
          </Link>
        </div>
      </div>
    )
  }

  if (status.kind === 'anonymous') {
    return (
      <div className="rounded-xl border p-5 text-sm">
        <p className="font-semibold">Interested in this job?</p>
        <p className="text-muted-foreground mt-1">Log in or create a candidate account to apply.</p>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(`/jobs/${jobSlug}#apply`)}`}>Log in to apply</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (status.kind === 'not-candidate') {
    return (
      <p className="text-muted-foreground rounded-xl border p-5 text-sm">
        Only candidate accounts can apply to jobs.
      </p>
    )
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border p-5"
      noValidate
      onSubmit={(e) => {
        // Stop oversized files before uploading (they would exceed the request size limit).
        // The server validates everything again.
        const file = (e.currentTarget.elements.namedItem('resume') as HTMLInputElement).files?.[0]
        if (file && file.size > MAX_RESUME_BYTES) {
          e.preventDefault()
          setClientError('Resume must be 5 MB or smaller.')
        }
      }}
    >
      <h2 className="text-lg font-semibold">Apply for {jobTitle}</h2>
      <FormMessage error={state.error} />
      <input type="hidden" name="jobId" value={jobId} />

      <div className="space-y-2">
        <Label htmlFor="resume">Resume (PDF, max 5 MB)</Label>
        <div className="flex items-center gap-2">
          <FileText className="text-muted-foreground size-5" aria-hidden />
          <input
            id="resume"
            name="resume"
            type="file"
            accept="application/pdf"
            required
            aria-invalid={Boolean(clientError || state.fieldErrors?.resume) || undefined}
            aria-describedby={clientError || state.fieldErrors?.resume ? 'resume-error' : undefined}
            className="file:bg-secondary file:text-secondary-foreground text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
            onChange={() => setClientError(null)}
          />
        </div>
        {(clientError || state.fieldErrors?.resume) && (
          <p id="resume-error" className="text-destructive text-sm">
            {clientError ?? state.fieldErrors?.resume?.[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverLetter">Cover letter (optional)</Label>
        <textarea
          id="coverLetter"
          name="coverLetter"
          rows={6}
          maxLength={5000}
          defaultValue={state.values?.coverLetter}
          placeholder="Tell the employer why you're a great fit…"
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
          aria-invalid={Boolean(state.fieldErrors?.coverLetter) || undefined}
        />
        {state.fieldErrors?.coverLetter && <p className="text-destructive text-sm">{state.fieldErrors.coverLetter[0]}</p>}
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Send application
      </Button>
    </form>
  )
}
