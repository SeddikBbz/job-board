import { BadgeCheck, Briefcase, ExternalLink, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container } from '@/components/container'
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
    <div className="bg-surface flex-1">
      {/* Cover + identity */}
      <div className="bg-background border-b">
        <div aria-hidden className="from-primary/15 via-secondary to-background h-32 bg-gradient-to-r sm:h-40" />
        <Container className="pb-8">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
            <CompanyLogo company={company} size={96} className="bg-background rounded-2xl border-4 border-white shadow-md" />
            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight">
                {company.name}
                {/* Set by an admin after checking the company is real */}
                {company.verified && (
                  <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    <BadgeCheck className="size-3.5" aria-hidden /> Verified company
                  </span>
                )}
              </h1>
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
        </Container>
      </div>

      <Container className="grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="open-jobs" className="min-w-0 space-y-3">
          <h2 id="open-jobs" className="text-xl font-semibold">
            Open jobs ({jobs.length})
          </h2>
          {jobs.length ? (
            <div className="grid-cards gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
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
      </Container>
    </div>
  )
}
