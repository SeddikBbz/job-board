import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
import { ReportActions } from '@/components/report-actions'
import { StatusBadge } from '@/components/status-badge'
import { requireRole } from '@/lib/dashboard'
import { formatDate } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import { REPORT_REASONS } from '@/lib/reportReasons'
import type { Job } from '@/payload-types'

export const metadata: Metadata = { title: 'Reports' }

const REASON_LABEL = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]))

// Admins: open reports, grouped by the job they are about (most reported first)
export default async function ReportsPage() {
  const user = await requireRole(['admin'], '/dashboard/reports')
  const payload = await getPayloadClient()
  const { docs: reports } = await payload.find({
    collection: 'reports',
    where: { status: { in: ['open', 'reviewing'] }, 'target.relationTo': { equals: 'jobs' } },
    sort: '-createdAt',
    depth: 1,
    limit: 200,
    user,
    overrideAccess: false,
  })

  const byJob = new Map<number, { job: Job; reports: typeof reports }>()
  for (const report of reports) {
    const job = report.target.value as Job
    if (typeof job !== 'object') continue
    const entry = byJob.get(job.id) ?? { job, reports: [] }
    entry.reports.push(report)
    byJob.set(job.id, entry)
  }
  const groups = [...byJob.values()].sort((a, b) => b.reports.length - a.reports.length)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      {groups.length === 0 ? (
        <EmptyState title="No open reports" description="Reports from visitors appear here." />
      ) : (
        <ul className="space-y-4">
          {groups.map(({ job, reports: list }) => (
            <li key={job.id} className="bg-card space-y-3 rounded-xl border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/jobs/${job.slug}`} className="font-semibold underline underline-offset-2">
                  {job.title}
                </Link>
                <StatusBadge status={job.status} />
                <span className="text-muted-foreground text-sm">
                  {list.length} {list.length === 1 ? 'report' : 'reports'}
                </span>
              </div>
              <ul className="divide-y rounded-lg border text-sm">
                {list.map((r) => (
                  <li key={r.id} className="p-3">
                    <p className="font-medium">
                      {REASON_LABEL[r.reason] ?? r.reason} <span className="text-muted-foreground font-normal">· {formatDate(r.createdAt)}</span>
                    </p>
                    {r.details && <p className="text-foreground/80 mt-1 whitespace-pre-line">{r.details}</p>}
                  </li>
                ))}
              </ul>
              <ReportActions jobId={job.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
