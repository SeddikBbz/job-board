import { RichText } from '@payloadcms/richtext-lexical/react'
import { Banknote, Briefcase, CalendarClock, CalendarDays, ChevronRight, Laptop, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ApplyNowButton } from '@/components/apply-now-button'
import { ApplySection } from '@/components/apply-section'
import { CompanyLogo } from '@/components/company-logo'
import { formatDate, formatSalary, JOB_TYPE_LABELS, timeAgo, WORK_MODE_LABELS } from '@/lib/format'
import { jobPostingJsonLd, serializeJsonLd } from '@/lib/jobPostingJsonLd'
import { getJobBySlug } from '@/lib/queries'
import type { Company } from '@/payload-types'

// Safety net so an expired job page disappears within an hour even without an edit
export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = await getJobBySlug(slug)
  if (!job) return { title: 'Job not found' }

  const company = typeof job.company === 'object' ? (job.company as Company) : null
  const description = [company?.name, job.location, job.jobType && JOB_TYPE_LABELS[job.jobType]]
    .filter(Boolean)
    .join(' · ')
  return {
    title: company ? `${job.title} at ${company.name}` : job.title,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
  }
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params
  const job = await getJobBySlug(slug)
  if (!job) notFound()

  const company = typeof job.company === 'object' ? (job.company as Company) : null
  const salary = formatSalary(job)
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  const overview = [
    { icon: MapPin, label: 'Location', value: job.location },
    { icon: Laptop, label: 'Work mode', value: job.workMode && WORK_MODE_LABELS[job.workMode] },
    { icon: Briefcase, label: 'Job type', value: job.jobType && JOB_TYPE_LABELS[job.jobType] },
    { icon: Banknote, label: 'Salary', value: salary },
    { icon: CalendarDays, label: 'Posted', value: formatDate(job.publishedAt) },
    { icon: CalendarClock, label: 'Apply before', value: formatDate(job.expiresAt) },
  ].filter((item) => item.value)

  return (
    <div className="bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jobPostingJsonLd(job, siteUrl)) }} />

      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <nav aria-label="Breadcrumb" className="text-muted-foreground mb-6 flex items-center gap-1 text-sm">
            <Link href="/jobs" className="hover:text-foreground">
              Jobs
            </Link>
            {company && (
              <>
                <ChevronRight className="size-4" aria-hidden />
                <Link href={`/companies/${company.slug}`} className="hover:text-foreground">
                  {company.name}
                </Link>
              </>
            )}
          </nav>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {company && <CompanyLogo company={company} size={72} className="rounded-xl border" />}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-balance">{job.title}</h1>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {company && (
                  <Link href={`/companies/${company.slug}`} className="text-foreground font-medium hover:underline">
                    {company.name}
                  </Link>
                )}
                {job.location && <span>· {job.location}</span>}
                {job.publishedAt && <span>· Posted {timeAgo(job.publishedAt)}</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.workMode && (
                  <span className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-semibold">
                    {WORK_MODE_LABELS[job.workMode]}
                  </span>
                )}
                {job.jobType && (
                  <span className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-semibold">
                    {JOB_TYPE_LABELS[job.jobType]}
                  </span>
                )}
                {salary && (
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{salary}</span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <ApplyNowButton />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section aria-labelledby="about-role" className="bg-card rounded-xl border p-6 sm:p-8">
            <h2 id="about-role" className="text-lg font-semibold">
              About the role
            </h2>
            <article className="mt-4 space-y-4 leading-7 text-slate-700 [&_a]:text-primary [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
              <RichText data={job.description} />
            </article>
            {job.skills?.length ? (
              <div className="mt-8">
                <h3 className="text-sm font-semibold">Skills</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <li key={skill}>
                      <Link
                        href={`/jobs?skills=${encodeURIComponent(skill)}`}
                        className="bg-muted hover:bg-secondary hover:text-secondary-foreground rounded-md px-2.5 py-1 text-sm font-medium transition-colors"
                      >
                        {skill}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section id="apply" aria-label="Apply" className="scroll-mt-24">
            <ApplySection jobId={job.id} jobSlug={job.slug ?? ''} jobTitle={job.title} />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold">Job overview</h2>
            <dl className="mt-4 space-y-4">
              {overview.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="bg-secondary text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {company && (
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3">
                <CompanyLogo company={company} size={44} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{company.name}</h2>
                  {company.size && <p className="text-muted-foreground text-xs">{company.size} employees</p>}
                </div>
              </div>
              {company.description && (
                <p className="text-muted-foreground mt-4 line-clamp-5 text-sm leading-6">{company.description}</p>
              )}
              <Link href={`/companies/${company.slug}`} className="text-primary mt-4 inline-block text-sm font-medium hover:underline">
                View company and all jobs →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
