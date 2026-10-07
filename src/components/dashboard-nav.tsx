'use client'

import { Briefcase, Building2, FileText, LayoutDashboard, Search, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const LINKS = {
  candidate: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/applications', label: 'My applications', icon: FileText },
    { href: '/jobs', label: 'Find jobs', icon: Search },
  ],
  employer: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/jobs', label: 'My jobs', icon: Briefcase },
    { href: '/dashboard/company', label: 'Company profile', icon: Building2 },
  ],
  admin: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin', label: 'Admin panel', icon: Shield },
  ],
} as const

// Vertical sidebar on desktop, horizontal scrollable tabs on mobile
export function DashboardNav({ role }: { role: keyof typeof LINKS }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1 md:flex-col">
        {LINKS[role].map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-slate-900/5'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', active && 'text-primary')} aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
