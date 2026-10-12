import { Banknote, Briefcase, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

import { CompanyLogo } from '@/components/company-logo'
import { jobPlace, jobSkills } from '@/lib/jobTaxonomy'
import { formatSalary, JOB_TYPE_LABELS, timeAgo, WORK_MODE_LABELS } from '@/lib/format'
import type { Company, Job } from '@/payload-types'

const isNew = (publishedAt?: string | null) =>
  Boolean(publishedAt) && Date.now() - new Date(publishedAt!).getTime() < 3 * 86_400_000

export function JobCard({ job }: { job: Job }) {
  const company = typeof job.company === 'object' ? (job.company as Company) : null
  const salary = formatSalary(job)
  const place = jobPlace(job)

  return (
    <article className="group bg-card hover:border-primary/40 relative flex h-full gap-4 rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5">
      {company && <CompanyLogo company={company} size={52} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {company && <p className="text-muted-foreground truncate text-sm font-medium">{company.name}</p>}
            <h3 className="mt-0.5 font-semibold leading-snug">
              {/* The ::after makes the whole card clickable while keeping one link for screen readers */}
              <Link
                href={`/jobs/${job.slug}`}
                className="group-hover:text-primary transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
              >
                {job.title}
              </Link>
            </h3>
          </div>
          {isNew(job.publishedAt) && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
              New
            </span>
          )}
        </div>

        <ul className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {place && (
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> {place}
            </li>
          )}
          {(job.jobType || job.workMode) && (
            <li className="inline-flex items-center gap-1.5">
              <Briefcase className="size-4" aria-hidden />
              {[job.jobType && JOB_TYPE_LABELS[job.jobType], job.workMode && WORK_MODE_LABELS[job.workMode]]
                .filter(Boolean)
                .join(' · ')}
            </li>
          )}
          {job.publishedAt && (
            <li className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden /> {timeAgo(job.publishedAt)}
            </li>
          )}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {salary && (
            <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold">
              <Banknote className="size-3.5" aria-hidden /> {salary}
            </span>
          )}
          {jobSkills(job).slice(0, 4).map((skill) => (
            <span key={skill.id} className="bg-muted text-foreground/75 rounded-md px-2 py-1 text-xs font-medium">
              {skill.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
