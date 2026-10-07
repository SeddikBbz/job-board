import {
  ArrowRight,
  BarChart3,
  Code2,
  GraduationCap,
  Laptop,
  Megaphone,
  Palette,
  ServerCog,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import { CompanyLogo } from '@/components/company-logo'
import { EmptyState } from '@/components/empty-state'
import { JobCard } from '@/components/job-card'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { getFeaturedCompanies, getLatestJobs, getStats } from '@/lib/queries'

// Safety net: rebuild at least hourly so expired jobs drop off even without an edit
export const revalidate = 3600

const CATEGORIES = [
  { label: 'Software engineering', href: '/jobs?q=developer', icon: Code2 },
  { label: 'Data & analytics', href: '/jobs?q=data', icon: BarChart3 },
  { label: 'Design', href: '/jobs?skills=figma', icon: Palette },
  { label: 'DevOps & cloud', href: '/jobs?skills=docker', icon: ServerCog },
  { label: 'Sales & marketing', href: '/jobs?q=sales', icon: Megaphone },
  { label: 'Remote', href: '/jobs?mode=remote', icon: Laptop },
  { label: 'Internships', href: '/jobs?type=internship', icon: GraduationCap },
  { label: 'Product & management', href: '/jobs?q=manager', icon: Users },
]

const POPULAR_SEARCHES = ['react', 'python', 'typescript', 'node', 'sql', 'figma']

export default async function HomePage() {
  const [jobs, stats, companies] = await Promise.all([getLatestJobs(6), getStats(), getFeaturedCompanies(6)])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="from-secondary via-background to-background absolute inset-0 -z-10 bg-gradient-to-b"
        />
        <div
          aria-hidden
          className="bg-primary/10 absolute -top-24 right-[-10%] -z-10 size-[28rem] rounded-full blur-3xl"
        />
        <div className="container mx-auto max-w-6xl px-4 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <p className="bg-background text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm">
            <span className="bg-primary size-1.5 rounded-full" aria-hidden />
            {stats.jobs} open {stats.jobs === 1 ? 'role' : 'roles'} right now
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Find the job that <span className="text-primary">fits your life</span>.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-8">
            Search roles from companies hiring now, and apply in two minutes with one resume.
          </p>

          <SearchBar className="mt-8 max-w-3xl" />

          <div className="text-muted-foreground mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span>Popular:</span>
            {POPULAR_SEARCHES.map((skill) => (
              <Link
                key={skill}
                href={`/jobs?skills=${skill}`}
                className="bg-background hover:border-primary/40 hover:text-foreground rounded-full border px-3 py-1 transition-colors"
              >
                {skill}
              </Link>
            ))}
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6">
            <div>
              <dt className="text-muted-foreground text-sm">Open jobs</dt>
              <dd className="text-3xl font-bold tracking-tight">{stats.jobs}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Companies hiring</dt>
              <dd className="text-3xl font-bold tracking-tight">{stats.companies}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Companies */}
      {companies.length > 0 && (
        <section aria-labelledby="companies" className="border-b">
          <div className="container mx-auto max-w-6xl px-4 py-10">
            <h2 id="companies" className="text-muted-foreground text-center text-sm font-medium">
              Companies hiring on JobBoard
            </h2>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {companies.map((company) => (
                <li key={company.id}>
                  <Link
                    href={`/companies/${company.slug}`}
                    className="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100"
                  >
                    <CompanyLogo company={company} size={36} />
                    <span className="font-semibold">{company.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Categories */}
      <section aria-labelledby="categories" className="container mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 id="categories" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Explore by category
          </h2>
          <p className="text-muted-foreground mt-2">Jump straight to the kind of work you&apos;re looking for.</p>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group bg-card hover:border-primary/40 flex h-full items-center gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Latest jobs */}
      <section aria-labelledby="latest" className="bg-surface border-y">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="latest" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Latest jobs
              </h2>
              <p className="text-muted-foreground mt-2">Fresh roles, updated as companies post them.</p>
            </div>
            <Button variant="outline" className="hidden sm:inline-flex" asChild>
              <Link href="/jobs">
                View all jobs <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
          {jobs.length ? (
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState title="No jobs yet" description="New roles will show up here as soon as they are published." />
            </div>
          )}
          <Button variant="outline" className="mt-6 w-full sm:hidden" asChild>
            <Link href="/jobs">View all jobs</Link>
          </Button>
        </div>
      </section>

      {/* Employer CTA */}
      <section className="container mx-auto max-w-6xl px-4 py-16">
        <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12">
          <div aria-hidden className="absolute -right-16 -bottom-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Hiring? Meet your next teammate here.</h2>
            <p className="text-primary-foreground/80 mt-3 leading-7">
              Create a company page, post a job in minutes and review applicants in one simple dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Start hiring for free</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                asChild
              >
                <Link href="/jobs">
                  Browse jobs <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
