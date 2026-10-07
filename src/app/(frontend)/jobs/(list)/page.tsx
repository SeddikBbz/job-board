import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { EmptyState } from '@/components/empty-state'
import { JobCard } from '@/components/job-card'
import { JobFilters } from '@/components/job-filters'
import { MobileFilters } from '@/components/mobile-filters'
import { Pagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { hasActiveFilters, parseJobFilters } from '@/lib/jobFilters'
import { getJobs } from '@/lib/queries'

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
  const result = await getJobs(filters)

  return (
    <div className="bg-surface min-h-[70vh]">
      <div className="bg-background border-b">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {filters.q ? `Jobs for “${filters.q}”` : 'Find your next job'}
          </h1>
          <p className="text-muted-foreground mt-1" aria-live="polite">
            {result.totalDocs} {result.totalDocs === 1 ? 'job' : 'jobs'} found
          </p>
        </div>
      </div>

      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[280px_1fr]">
        {/* useSearchParams in a client component needs a Suspense boundary */}
        <div className="hidden md:block">
          <div className="bg-card sticky top-24 rounded-xl border p-5">
            <Suspense>
              <JobFilters />
            </Suspense>
          </div>
        </div>

        <section aria-label="Results" className="space-y-4">
          <div className="flex items-center justify-between md:hidden">
            <Suspense>
              <MobileFilters />
            </Suspense>
          </div>

          {result.docs.length ? (
            <div className="space-y-3">
              {result.docs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={filters.page > 1 && result.totalDocs > 0 ? 'This page is empty' : 'No jobs match your search'}
              description="Try removing a filter or searching for something broader."
              action={
                hasActiveFilters(filters) || filters.page > 1 ? (
                  <Button variant="outline" asChild>
                    <Link href="/jobs">Clear filters</Link>
                  </Button>
                ) : undefined
              }
            />
          )}

          <Pagination page={result.page ?? 1} totalPages={result.totalPages} searchParams={params} />
        </section>
      </div>
    </div>
  )
}
