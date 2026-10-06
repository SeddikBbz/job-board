import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="text-muted-foreground border-t text-sm">
      <div className="container mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} JobBoard. Find your next role.</p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/jobs" className="hover:text-foreground">
            Jobs
          </Link>
          <Link href="/jobs?mode=remote" className="hover:text-foreground">
            Remote jobs
          </Link>
          <Link href="/jobs?type=internship" className="hover:text-foreground">
            Internships
          </Link>
        </nav>
      </div>
    </footer>
  )
}
