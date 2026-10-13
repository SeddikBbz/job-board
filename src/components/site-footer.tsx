import Link from 'next/link'

import { Container } from '@/components/container'
import { Logo } from '@/components/logo'
import { InstallApp } from '@/components/pwa/install-app'

const COLUMNS = [
  {
    title: 'For candidates',
    links: [
      { href: '/jobs', label: 'Browse jobs' },
      { href: '/jobs?mode=remote', label: 'Remote jobs' },
      { href: '/jobs?type=internship', label: 'Internships' },
      { href: '/register', label: 'Create a profile' },
    ],
  },
  {
    title: 'For employers',
    links: [
      { href: '/register?role=employer', label: 'Start hiring' },
      { href: '/dashboard/jobs/new', label: 'Post a job' },
      { href: '/dashboard/company', label: 'Company profile' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Log in' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/forgot-password', label: 'Reset password' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-surface border-t pb-[env(safe-area-inset-bottom)]">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <InstallApp />
          <p className="text-muted-foreground max-w-xs text-sm leading-6">
            The simplest way to find your next role, and for companies to meet great candidates.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="space-y-3 text-sm">
            <h2 className="font-semibold">{column.title}</h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t">
        <Container className="text-muted-foreground py-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} JobBoard. All rights reserved.</p>
            <nav aria-label="Legal" className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
            </nav>
          </div>
        </Container>
      </div>
    </footer>
  )
}
