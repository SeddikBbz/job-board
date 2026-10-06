import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { requireRole, getMyApplications } from '@/lib/dashboard'
import { formatDate } from '@/lib/format'
import type { Company, Job } from '@/payload-types'

export const metadata: Metadata = { title: 'My applications' }

export default async function MyApplicationsPage() {
  const user = await requireRole(['candidate'], '/dashboard/applications')
  const applications = await getMyApplications(user)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My applications</h1>
      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="When you apply to a job, you can follow its status here."
          action={
            <Button asChild>
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Job</th>
                <th scope="col" className="px-4 py-3 font-medium">Company</th>
                <th scope="col" className="px-4 py-3 font-medium">Applied</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((application) => {
                // If the job was closed or unpublished, public read rules return only its ID
                const job = typeof application.job === 'object' ? (application.job as Job) : null
                const company = job && typeof job.company === 'object' ? (job.company as Company) : null
                return (
                  <tr key={application.id}>
                    <td className="px-4 py-3">
                      {job ? (
                        <Link href={`/jobs/${job.slug}`} className="text-primary font-medium hover:underline">
                          {job.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">Job no longer available</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{company?.name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(application.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={application.status} />
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
