import { Container } from '@/components/container'
import { DashboardMobileNav, DashboardNav } from '@/components/dashboard-nav'
import { VerifyEmailBanner } from '@/components/verify-email-banner'
import { isVerified } from '@/access/isVerified'
import { getCurrentUser } from '@/lib/auth'

const ROLE_LABELS = { admin: 'Admin', employer: 'Employer', candidate: 'Candidate' } as const

// Every page under /dashboard requires a logged-in user, and each page enforces it itself
// (requireUser/requireRole with its own path). The layout must not redirect: it doesn't know
// the current path, so it would always send ?next=/dashboard and lose deep links.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  // Logged out: let the page run, it redirects to /login?next=<this page>
  if (!user) return children
  return (
    // flex-1 + flex column: sidebar and content fill the height between header and footer
    <div className="bg-surface flex flex-1 flex-col">
      <Container className="grid flex-1 content-start gap-6 py-8 md:grid-cols-[220px_1fr] md:gap-10">
        <aside className="md:sticky md:top-24 md:self-start">
          <DashboardMobileNav role={user.role} />
          <div className="hidden md:block">
            <p className="text-muted-foreground mb-3 px-3 text-xs font-semibold tracking-wide uppercase">
              {ROLE_LABELS[user.role]}
            </p>
            <DashboardNav role={user.role} />
          </div>
        </aside>
        {/* min-w-0 lets wide tables scroll inside their own box instead of widening the page */}
        <div className="min-w-0">
          {!isVerified(user) && <VerifyEmailBanner email={user.email} />}
          {children}
        </div>
      </Container>
    </div>
  )
}
