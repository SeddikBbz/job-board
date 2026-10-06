import { RichText } from '@payloadcms/richtext-lexical/react'
import { ArrowLeft, Banknote, Calendar, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CompanyLogo } from '@/components/company-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatSalary, JOB_TYPE_LABELS, WORK_MODE_LABELS } from '@/lib/format'
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

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/jobs">
          <ArrowLeft aria-hidden /> All jobs
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {company && <CompanyLogo company={company} size={64} />}
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
          {company && (
            <Link href={`/companies/${company.slug}`} className="text-primary font-medium hover:underline">
              {company.name}
            </Link>
          )}
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden /> {job.location}
              </span>
            )}
            {salary && (
              <span className="inline-flex items-center gap-1">
                <Banknote className="size-4" aria-hidden /> {salary}
              </span>
            )}
            {job.publishedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-4" aria-hidden /> Posted {formatDate(job.publishedAt)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.jobType && <Badge variant="secondary">{JOB_TYPE_LABELS[job.jobType]}</Badge>}
            {job.workMode && <Badge variant="secondary">{WORK_MODE_LABELS[job.workMode]}</Badge>}
          </div>
        </div>
        {/* The real apply form arrives in M8 */}
        <Button size="lg" disabled title="Applying opens soon">
          Apply now
        </Button>
      </header>

      <Separator className="my-8" />

      <div className="grid gap-10 md:grid-cols-[1fr_220px]">
        <article className="prose-sm max-w-none space-y-4 leading-7 [&_a]:text-primary [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
          <RichText data={job.description} />
        </article>

        <aside className="space-y-6 text-sm">
          {job.skills?.length ? (
            <div>
              <h2 className="mb-2 font-semibold">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="outline" asChild>
                    <Link href={`/jobs?skills=${encodeURIComponent(skill)}`}>{skill}</Link>
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {job.expiresAt && (
            <div>
              <h2 className="mb-1 font-semibold">Apply before</h2>
              <p className="text-muted-foreground">{formatDate(job.expiresAt)}</p>
            </div>
          )}
          {company?.description && (
            <div>
              <h2 className="mb-1 font-semibold">About {company.name}</h2>
              <p className="text-muted-foreground line-clamp-6">{company.description}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
