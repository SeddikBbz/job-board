import { Briefcase, ExternalLink, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CompanyLogo } from '@/components/company-logo'
import { EmptyState } from '@/components/empty-state'
import { JobCard } from '@/components/job-card'
import { Button } from '@/components/ui/button'
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
    <div className="bg-surface min-h-[70vh]">
      {/* Cover + identity */}
      <div className="bg-background border-b">
        <div aria-hidden className="from-primary/15 via-secondary to-background h-32 bg-gradient-to-r sm:h-40" />
        <div className="container mx-auto max-w-6xl px-4 pb-8">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
            <CompanyLogo company={company} size={96} className="bg-background rounded-2xl border-4 border-white shadow-md" />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
              <ul className="text-muted-foreground mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {company.location && (
                  <li className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden /> {company.location}
                  </li>
                )}
                {company.size && (
                  <li className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden /> {company.size} employees
                  </li>
                )}
                <li className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-4" aria-hidden /> {jobs.length} open {jobs.length === 1 ? 'job' : 'jobs'}
                </li>
              </ul>
            </div>
            {company.website && (
              <Button variant="outline" asChild>
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  Visit website <ExternalLink aria-hidden />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
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

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold">About {company.name}</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-6 whitespace-pre-line">
              {company.description || 'This company hasn’t added a description yet.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
