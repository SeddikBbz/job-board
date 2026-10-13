import { AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
import { ModerationForm } from '@/components/moderation-form'
import { requireRole } from '@/lib/dashboard'
import { formatDate } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import { richTextToText } from '@/lib/richText'
import type { Company } from '@/payload-types'

export const metadata: Metadata = { title: 'Review queue' }

// Admins: jobs waiting for review, oldest first, with the reasons they were flagged
export default async function ModerationPage() {
  const user = await requireRole(['admin'], '/dashboard/moderation')
  const payload = await getPayloadClient()
  const { docs: jobs } = await payload.find({
    collection: 'jobs',
    where: { status: { equals: 'pending_review' } },
    sort: 'updatedAt',
    depth: 1,
    limit: 50,
    user,
    overrideAccess: false,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Review queue</h1>
      {jobs.length === 0 ? (
        <EmptyState title="Nothing to review" description="Jobs from companies that aren't trusted wait here before they go public." />
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => {
            const company = typeof job.company === 'object' ? (job.company as Company) : null
            return (
              <li key={job.id} className="bg-card space-y-3 rounded-xl border p-5" data-testid="review-item">
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {company?.name} · submitted {formatDate(job.updatedAt)}
                    {company?.slug && (
                      <>
                        {' · '}
                        <Link href={`/companies/${company.slug}`} className="text-primary underline underline-offset-2">
                          company page
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {job.moderationFlags?.length ? (
                  <ul className="space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    {job.moderationFlags.map((flag) => (
                      <li key={flag} className="flex gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {flag}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-foreground/80 line-clamp-6 text-sm whitespace-pre-line">{richTextToText(job.description)}</p>
                <ModerationForm jobId={job.id} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
