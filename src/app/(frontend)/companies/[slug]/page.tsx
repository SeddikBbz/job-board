import { ExternalLink, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CompanyLogo } from '@/components/company-logo'
import { EmptyState } from '@/components/empty-state'
import { JobCard } from '@/components/job-card'
import { getCompanyBySlug, getCompanyJobs } from '@/lib/queries'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = await getCompanyBySlug(slug)
  if (!company) return { title: 'Company not found' }
  return {
    title: `${company.name} – jobs`,
    description: company.description || `Open jobs at ${company.name}.`,
    alternates: { canonical: `/companies/${company.slug}` },
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params
  const company = await getCompanyBySlug(slug)
  if (!company) notFound()

  // Public read rules: only published, non-expired jobs come back
  const jobs = await getCompanyJobs(company.id)

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <CompanyLogo company={company} size={80} />
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {company.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden /> {company.location}
              </span>
            )}
            {company.size && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-4" aria-hidden /> {company.size} employees
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                Website <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </header>

      {company.description && <p className="text-muted-foreground max-w-2xl leading-7">{company.description}</p>}

      <section aria-labelledby="open-jobs" className="space-y-3">
        <h2 id="open-jobs" className="text-xl font-semibold">
          Open jobs ({jobs.length})
        </h2>
        {jobs.length ? (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <EmptyState title="No open jobs right now" description="Check back soon for new roles." />
        )}
      </section>
    </div>
  )
}
