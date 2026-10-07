import { DashboardNav } from '@/components/dashboard-nav'
import { requireUser } from '@/lib/auth'

// Every page under /dashboard requires a logged-in user.
// Pages still re-check the user and role themselves before reading or writing data.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/dashboard')
  return (
    <div className="bg-surface min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr] md:gap-10">
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="text-muted-foreground mb-3 hidden px-3 text-xs font-semibold tracking-wide uppercase md:block">
            {user.role === 'employer' ? 'Employer' : user.role === 'admin' ? 'Admin' : 'Candidate'}
          </p>
          <DashboardNav role={user.role} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
