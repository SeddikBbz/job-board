import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { getMyApplications, getMyCompany, getMyJobs } from '@/lib/dashboard'

export const metadata: Metadata = { title: 'Dashboard' }

const ROLE_LABELS = { admin: 'Admin', employer: 'Employer', candidate: 'Candidate' } as const

function Stat({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="bg-card hover:border-primary/40 rounded-xl border p-5 transition-colors">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </Link>
  )
}

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi, {user.name}</h1>
        <p className="text-muted-foreground text-sm">
          Signed in as {user.email} · {ROLE_LABELS[user.role]}
        </p>
      </div>

      {user.role === 'candidate' && <CandidateOverview applications={await getMyApplications(user)} />}
      {user.role === 'employer' && <EmployerOverview user={user} />}
      {user.role === 'admin' && (
        <Button asChild>
          <Link href="/admin">Open admin panel</Link>
        </Button>
      )}
    </div>
  )
}

function CandidateOverview({ applications }: { applications: Awaited<ReturnType<typeof getMyApplications>> }) {
  const active = applications.filter((a) => !['rejected', 'hired', 'withdrawn'].includes(a.status)).length
  const interviews = applications.filter((a) => a.status === 'interview').length
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Applications" value={applications.length} href="/dashboard/applications" />
        <Stat label="In progress" value={active} href="/dashboard/applications" />
        <Stat label="Interviews" value={interviews} href="/dashboard/applications" />
      </div>
      <Button variant="outline" asChild>
        <Link href="/jobs">Find more jobs</Link>
      </Button>
    </div>
  )
}

async function EmployerOverview({ user }: { user: Parameters<typeof getMyJobs>[0] }) {
  const [company, jobs] = await Promise.all([getMyCompany(user), getMyJobs(user)])
  if (!company) {
    return (
      <div className="bg-card rounded-xl border border-dashed p-6">
        <p className="font-semibold">Set up your company first</p>
        <p className="text-muted-foreground mt-1 text-sm">Candidates see your company on every job you post.</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/company">Create company profile</Link>
        </Button>
      </div>
    )
  }
  const published = jobs.filter(({ job }) => job.status === 'published').length
  const applicants = jobs.reduce((sum, j) => sum + j.applicants, 0)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Jobs" value={jobs.length} href="/dashboard/jobs" />
        <Stat label="Published" value={published} href="/dashboard/jobs" />
        <Stat label="Applicants" value={applicants} href="/dashboard/jobs" />
      </div>
      <Button asChild>
        <Link href="/dashboard/jobs/new">Post a job</Link>
      </Button>
    </div>
  )
}
