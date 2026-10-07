import { ArrowLeft, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { ApplicationStatusForm } from '@/components/dashboard-forms'
import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { getApplicants, getManagedJobOr404, requireRole } from '@/lib/dashboard'
import { formatDate } from '@/lib/format'
import type { Resume, User } from '@/payload-types'

export const metadata: Metadata = { title: 'Applicants' }

type Props = { params: Promise<{ id: string }> }

export default async function ApplicantsPage({ params }: Props) {
  const { id } = await params
  const user = await requireRole(['employer'], `/dashboard/jobs/${id}/applicants`)
  // 404 for anyone else's job, even though they could guess the ID
  const job = await getManagedJobOr404(user, id)
  const applications = await getApplicants(user, job.id)

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/jobs">
          <ArrowLeft aria-hidden /> My jobs
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">Applicants</h1>
        <p className="text-muted-foreground text-sm">{job.title}</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="No applicants yet" description="Applications for this job will appear here." />
      ) : (
        <ul className="divide-y rounded-xl border">
          {applications.map((application) => {
            const candidate = typeof application.candidate === 'object' ? (application.candidate as User) : null
            const resume = typeof application.resume === 'object' ? (application.resume as Resume) : null
            return (
              <li key={application.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{candidate?.name ?? 'Candidate'}</p>
                  {candidate?.email && (
                    <a href={`mailto:${candidate.email}`} className="text-primary text-sm hover:underline">
                      {candidate.email}
                    </a>
                  )}
                  <p className="text-muted-foreground text-xs">Applied {formatDate(application.createdAt)}</p>
                  {application.coverLetter && (
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm whitespace-pre-line">{application.coverLetter}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  {application.status === 'withdrawn' ? (
                    // Only the candidate can withdraw, and a withdrawn application can't be changed
                    <StatusBadge status="withdrawn" />
                  ) : (
                    <ApplicationStatusForm applicationId={application.id} status={application.status} />
                  )}
                  {resume?.url && (
                    // Served by Payload (/api/resumes/file/…), which checks access on every download
                    <Button size="sm" variant="outline" asChild>
                      <a href={resume.url} target="_blank" rel="noopener noreferrer">
                        <FileText aria-hidden /> Resume
                      </a>
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
