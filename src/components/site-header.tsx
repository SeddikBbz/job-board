import { BriefcaseBusiness } from 'lucide-react'
import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BriefcaseBusiness className="text-primary size-5" aria-hidden />
          JobBoard
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <Link href="/jobs" className="hover:bg-muted rounded-md px-3 py-2">
            Browse jobs
          </Link>
          {/* Login / register / user menu are added in M7 */}
        </nav>
      </div>
    </header>
  )
}
