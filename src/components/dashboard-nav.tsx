'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const LINKS = {
  candidate: [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/applications', label: 'My applications' },
  ],
  employer: [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/jobs', label: 'My jobs' },
    { href: '/dashboard/company', label: 'Company profile' },
  ],
  admin: [
    { href: '/dashboard', label: 'Overview' },
    { href: '/admin', label: 'Admin panel' },
  ],
} as const

export function DashboardNav({ role }: { role: keyof typeof LINKS }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto border-b">
      {LINKS[role].map((link) => {
        const active = link.href === '/dashboard' ? pathname === link.href : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap',
              active ? 'border-primary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
