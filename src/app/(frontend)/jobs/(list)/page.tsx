import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Container } from '@/components/container'
import { EmptyState } from '@/components/empty-state'
import { JobCard } from '@/components/job-card'
import { JobFilters } from '@/components/job-filters'
import { MobileFilters } from '@/components/mobile-filters'
import { Pagination } from '@/components/pagination'
import { ActiveFilters } from '@/components/search/active-filters'
import { SearchBox } from '@/components/search/search-box'
import { PendingResults, SearchTransitionProvider } from '@/components/search/search-transition'
import { Button } from '@/components/ui/button'
import { hasActiveFilters, parseJobFilters } from '@/lib/jobFilters'
import { getJobs, getTaxonomy } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Browse jobs',
  description: 'Search and filter open jobs by type, work mode, location, salary and skills.',
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function JobsPage({ searchParams }: Props) {
  const params = await searchParams
  const filters = parseJobFilters(params)
  const [result, taxonomy] = await Promise.all([getJobs(filters), getTaxonomy()])
  const skillNames = Object.fromEntries(taxonomy.skills.map((s) => [s.slug, s.name]))
  const popularSkills = taxonomy.skills.filter((s) => s.popular).slice(0, 6)

  return (
    <SearchTransitionProvider>
      <div className="bg-surface flex-1">
        <div className="bg-background border-b">
          <Container className="space-y-4 py-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {filters.q ? `Jobs for “${filters.q}”` : 'Find your next job'}
              </h1>
              <p className="text-muted-foreground mt-1" aria-live="polite">
                {result.totalDocs} {result.totalDocs === 1 ? 'job' : 'jobs'} found
              </p>
            </div>
            {/* useSearchParams in client components needs a Suspense boundary */}
            <Suspense>
              <SearchBox mode="live" className="max-w-3xl" />
            </Suspense>
            <ActiveFilters filters={filters} skillNames={skillNames} />
          </Container>
        </div>

        <Container className="grid gap-8 py-8 md:grid-cols-[280px_1fr]">
          <div className="hidden md:block">
            <div className="bg-card sticky top-24 rounded-xl border p-5">
              <Suspense>
                <JobFilters />
              </Suspense>
            </div>
          </div>

          <section aria-label="Results" className="min-w-0 space-y-4">
            <div className="flex items-center justify-between md:hidden">
              <Suspense>
                <MobileFilters />
              </Suspense>
            </div>

            <PendingResults>
              {result.docs.length ? (
                <div className="grid-cards gap-4">
                  {result.docs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={filters.page > 1 && result.totalDocs > 0 ? 'This page is empty' : 'No jobs match your search'}
                  description="Try removing a filter, a nearby city, or one of the popular skills below."
                  action={
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        {popularSkills.map((s) => (
                          <Link key={s.id} href={`/jobs?skills=${s.slug}`} className="bg-muted hover:bg-secondary rounded-full px-3 py-1 text-sm">
                            {s.name}
                          </Link>
                        ))}
                      </div>
                      {(hasActiveFilters(filters) || filters.page > 1) && (
                        <Button variant="outline" asChild>
                          <Link href="/jobs">Clear filters</Link>
                        </Button>
                      )}
                    </div>
                  }
                />
              )}
            </PendingResults>

            <Pagination page={result.page ?? 1} totalPages={result.totalPages} searchParams={params} />
          </section>
        </Container>
      </div>
    </SearchTransitionProvider>
  )
}
