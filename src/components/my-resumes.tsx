'use client'

import { FileText, Trash2 } from 'lucide-react'
import { useActionState } from 'react'

import { deleteResume } from '@/app/(frontend)/dashboard/actions'
import { Button } from '@/components/ui/button'
import type { FormState } from '@/lib/validation/auth'

type Resume = { id: number; filename?: string | null; url?: string | null; createdAt: string }

function DeleteResume({ resume }: { resume: Resume }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteResume, {})
  return (
    <form
      action={action}
      onSubmit={(e) => {
        // Employers of jobs you applied to won't be able to open it anymore
        if (!window.confirm('Delete this resume? Employers you applied to will no longer be able to open it.')) e.preventDefault()
      }}
    >
      <input type="hidden" name="resumeId" value={resume.id} />
      <Button type="submit" size="sm" variant="ghost" disabled={pending} aria-label={`Delete ${resume.filename ?? 'resume'}`}>
        <Trash2 aria-hidden /> Delete
      </Button>
      {state.error && <p role="alert" className="text-destructive text-xs">{state.error}</p>}
    </form>
  )
}

// "My resumes" on the candidate dashboard: open or delete any of them at any time
export function MyResumes({ resumes }: { resumes: Resume[] }) {
  return (
    <section aria-labelledby="my-resumes" className="bg-card rounded-xl border p-5">
      <h2 id="my-resumes" className="font-semibold">
        My resumes
      </h2>
      {resumes.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">Resumes you upload when applying appear here.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {resumes.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <a href={r.url ?? '#'} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 underline underline-offset-2">
                <FileText className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Resume uploaded {new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
              </a>
              <DeleteResume resume={r} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
