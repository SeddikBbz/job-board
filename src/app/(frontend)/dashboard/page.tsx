import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Dashboard' }

const ROLE_LABELS = { admin: 'Admin', employer: 'Employer', candidate: 'Candidate' } as const

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

      {/* Role-specific dashboards (applications, jobs, applicants) are built in M9 */}
      <div className="flex flex-wrap gap-2">
        {user.role === 'admin' && (
          <Button asChild>
            <Link href="/admin">Open admin panel</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/jobs">Browse jobs</Link>
        </Button>
      </div>
    </div>
  )
}
