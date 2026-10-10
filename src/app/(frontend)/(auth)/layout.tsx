import { AuthPanel } from '@/components/auth/auth-panel'
import { AuthRoleProvider } from '@/components/auth/auth-role'
import { getOpenJobsCount } from '@/lib/queries'

// Shared shell for login, register, forgot and reset password:
// form on the left (about 420 px wide), brand panel on the right from the lg breakpoint.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const openJobs = await getOpenJobsCount()
  return (
    <AuthRoleProvider>
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex flex-col">
          {/* Small screens: a slim brand strip instead of the panel */}
          <div className="bg-primary text-primary-foreground px-(--gutter) py-3 text-center text-sm font-medium lg:hidden">
            Your next career move starts here
          </div>
          <div className="flex flex-1 items-center justify-center px-(--gutter) py-10 sm:py-14">
            <div className="w-full max-w-[420px]">{children}</div>
          </div>
        </div>

        <div className="bg-primary text-primary-foreground relative hidden overflow-hidden lg:flex lg:items-center">
          {/* Brand color with a soft shade towards the corner (tokens only, works in any theme) */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-transparent to-black/25" />
          <div aria-hidden className="absolute -end-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <AuthPanel openJobs={openJobs} />
        </div>
      </div>
    </AuthRoleProvider>
  )
}
