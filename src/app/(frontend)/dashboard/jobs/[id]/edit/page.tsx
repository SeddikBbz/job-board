import type { Metadata } from 'next'
import Link from 'next/link'

import { JobForm } from '@/components/dashboard-forms'
import { StatusBadge } from '@/components/status-badge'
import { getManagedJobOr404, requireRole } from '@/lib/dashboard'
import { richTextToText } from '@/lib/richText'

export const metadata: Metadata = { title: 'Edit job' }

type Props = { params: Promise<{ id: string }> }

export default async function EditJobPage({ params }: Props) {
  const { id } = await params
  const user = await requireRole(['employer'], `/dashboard/jobs/${id}/edit`)
  // 404 unless this job belongs to the employer's company
  const job = await getManagedJobOr404(user, id)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Edit job</h1>
        <StatusBadge status={job.status} />
        {job.status === 'published' && (
          <Link href={`/jobs/${job.slug}`} className="text-primary text-sm hover:underline">
            View public page
          </Link>
        )}
      </div>
      <JobForm
        defaults={{
          id: job.id,
          status: job.status,
          title: job.title,
          description: richTextToText(job.description),
          location: job.location ?? undefined,
          jobType: job.jobType ?? undefined,
          workMode: job.workMode ?? undefined,
          salaryMin: job.salaryMin?.toString(),
          salaryMax: job.salaryMax?.toString(),
          salaryCurrency: job.salaryCurrency ?? undefined,
          skills: job.skills?.join(', '),
          expiresAt: job.expiresAt?.slice(0, 10),
        }}
      />
    </div>
  )
}
