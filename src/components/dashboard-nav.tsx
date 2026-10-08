'use client'

import { Briefcase, Building2, FileText, LayoutDashboard, Menu, Search, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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

type Role = keyof typeof LINKS

const isActive = (href: string, pathname: string) =>
  href === '/dashboard' ? pathname === href : pathname.startsWith(href)

// Vertical list of dashboard links, used by the desktop sidebar and the mobile drawer
export function DashboardNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard">
      <ul className="flex flex-col gap-1">
        {LINKS[role].map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-background text-foreground ring-foreground/5 shadow-sm ring-1'
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

// Small screens: the sidebar collapses into a slide-in drawer. The button shows the current section.
export function DashboardMobileNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = LINKS[role].find(({ href }) => isActive(href, pathname))
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-start md:hidden" aria-label="Open dashboard menu">
          <Menu aria-hidden />
          {current?.label ?? 'Dashboard'}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-surface w-72">
        <SheetHeader>
          <SheetTitle>Dashboard</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <DashboardNav role={role} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
