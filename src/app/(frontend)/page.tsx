import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
import { JobCard } from '@/components/job-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getLatestJobs } from '@/lib/queries'

// Safety net: rebuild at least hourly so expired jobs drop off even without an edit
export const revalidate = 3600

const CATEGORIES = [
  { label: 'Remote', href: '/jobs?mode=remote' },
  { label: 'Hybrid', href: '/jobs?mode=hybrid' },
  { label: 'Internships', href: '/jobs?type=internship' },
  { label: 'Part-time', href: '/jobs?type=part-time' },
  { label: 'Contract', href: '/jobs?type=contract' },
]
const POPULAR_SKILLS = ['react', 'typescript', 'python', 'node', 'sql', 'figma', 'docker']

export default async function HomePage() {
  const jobs = await getLatestJobs(6)

  return (
    <>
      <section className="from-primary/10 to-background border-b bg-gradient-to-b">
        <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Find a job you&apos;ll love.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Browse open roles from companies hiring now, and apply in a couple of minutes.
          </p>

          {/* A plain GET form: works without JavaScript and lands on /jobs?q=…&location=… */}
          <form action="/jobs" role="search" className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <label htmlFor="home-q" className="sr-only">
              Keywords
            </label>
            <Input id="home-q" name="q" placeholder="Job title, skill or company" className="h-11 bg-background" />
            <label htmlFor="home-location" className="sr-only">
              Location
            </label>
            <Input id="home-location" name="location" placeholder="Location" className="h-11 bg-background sm:max-w-48" />
            <Button type="submit" size="lg" className="h-11 px-5">
              <Search aria-hidden /> Search
            </Button>
          </form>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl space-y-4 px-4 py-10" aria-labelledby="categories">
        <h2 id="categories" className="text-xl font-semibold">
          Browse by category
        </h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button key={c.href} variant="outline" asChild>
              <Link href={c.href}>{c.label}</Link>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SKILLS.map((skill) => (
            <Button key={skill} variant="ghost" size="sm" asChild>
              <Link href={`/jobs?skills=${skill}`}>#{skill}</Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl space-y-4 px-4 pb-16" aria-labelledby="latest">
        <div className="flex items-center justify-between">
          <h2 id="latest" className="text-xl font-semibold">
            Latest jobs
          </h2>
          <Button variant="link" asChild>
            <Link href="/jobs">
              View all <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        {jobs.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState title="No jobs yet" description="New roles will show up here as soon as they are published." />
        )}
      </section>
    </>
  )
}
