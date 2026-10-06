import { DashboardNav } from '@/components/dashboard-nav'
import { requireUser } from '@/lib/auth'

// Every page under /dashboard requires a logged-in user.
// Pages still re-check the user and role themselves before reading or writing data.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/dashboard')
  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <DashboardNav role={user.role} />
      {children}
    </div>
  )
}
