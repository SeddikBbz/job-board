import { Banknote, MapPin } from 'lucide-react'
import Link from 'next/link'

import { CompanyLogo } from '@/components/company-logo'
import { Badge } from '@/components/ui/badge'
import { formatSalary, JOB_TYPE_LABELS, timeAgo, WORK_MODE_LABELS } from '@/lib/format'
import type { Company, Job } from '@/payload-types'

export function JobCard({ job }: { job: Job }) {
  const company = typeof job.company === 'object' ? (job.company as Company) : null
  const salary = formatSalary(job)

  return (
    <article className="bg-card hover:border-primary/40 relative flex gap-4 rounded-xl border p-4 transition-colors">
      {company && <CompanyLogo company={company} />}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight">
              {/* The ::after makes the whole card clickable while keeping one link for screen readers */}
              <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {job.title}
              </Link>
            </h3>
            {company && <p className="text-muted-foreground text-sm">{company.name}</p>}
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">{timeAgo(job.publishedAt)}</span>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {job.location}
            </span>
          )}
          {salary && (
            <span className="inline-flex items-center gap-1">
              <Banknote className="size-3.5" aria-hidden /> {salary}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {job.jobType && <Badge variant="secondary">{JOB_TYPE_LABELS[job.jobType]}</Badge>}
          {job.workMode && <Badge variant="secondary">{WORK_MODE_LABELS[job.workMode]}</Badge>}
          {job.skills?.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  )
}
