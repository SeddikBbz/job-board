import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { JobStatusButton } from '@/components/dashboard-forms'
import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { getMyCompany, getMyJobs, requireRole } from '@/lib/dashboard'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'My jobs' }

export default async function MyJobsPage() {
  const user = await requireRole(['employer'], '/dashboard/jobs')
  const [company, jobs] = await Promise.all([getMyCompany(user), getMyJobs(user)])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My jobs</h1>
        {company && (
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <Plus aria-hidden /> Post a job
            </Link>
          </Button>
        )}
      </div>

      {!company ? (
        <EmptyState
          title="Create your company first"
          description="Jobs are posted under your company profile."
          action={
            <Button asChild>
              <Link href="/dashboard/company">Create company profile</Link>
            </Button>
          }
        />
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs yet" description="Post your first job to start receiving applications." />
      ) : (
        <div className="bg-card overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Job</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Applicants</th>
                <th scope="col" className="px-4 py-3 font-medium">Expires</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map(({ job, applicants }) => {
                const expired = job.expiresAt && new Date(job.expiresAt) <= new Date()
                return (
                  <tr key={job.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/jobs/${job.id}/edit`} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/jobs/${job.id}/applicants`} className="text-primary hover:underline">
                        {applicants} {applicants === 1 ? 'applicant' : 'applicants'}
                      </Link>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${expired ? 'text-destructive' : ''}`}>
                      {formatDate(job.expiresAt) ?? '—'}
                      {expired && ' (expired)'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {job.status === 'draft' && <JobStatusButton jobId={job.id} status="published" label="Publish" />}
                        {job.status === 'published' && <JobStatusButton jobId={job.id} status="closed" label="Close" />}
                        {job.status === 'closed' && <JobStatusButton jobId={job.id} status="published" label="Reopen" />}
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/jobs/${job.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
