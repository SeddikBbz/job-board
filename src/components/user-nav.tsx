'use client'

import { Briefcase, Building2, FileText, LayoutDashboard, LogOut, Plus, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { logoutAction } from '@/app/(frontend)/(auth)/actions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Me = { name: string; email: string; role: 'admin' | 'employer' | 'candidate' } | null

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

// Fetched in the browser so the header doesn't make every page dynamic (cookies).
// Re-checked on navigation so it updates right after login and logout.
export function UserNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<Me | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me', { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => !cancelled && setUser(data.user ?? null))
      .catch(() => !cancelled && setUser(null))
    return () => {
      cancelled = true
    }
  }, [pathname])

  // Keep the space while loading to avoid layout shift
  if (user === undefined) return <div className="h-9 w-44" aria-hidden />

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {user.role === 'employer' && (
        <Button size="sm" className="hidden sm:inline-flex" asChild>
          <Link href="/dashboard/jobs/new">
            <Plus aria-hidden /> Post a job
          </Link>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 rounded-full pr-3 pl-1" aria-label={`Account menu for ${user.name}`}>
            <Avatar className="size-8">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard aria-hidden /> Dashboard
            </Link>
          </DropdownMenuItem>
          {user.role === 'candidate' && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard/applications">
                <FileText aria-hidden /> My applications
              </Link>
            </DropdownMenuItem>
          )}
          {user.role === 'employer' && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/jobs">
                  <Briefcase aria-hidden /> My jobs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/company">
                  <Building2 aria-hidden /> Company profile
                </Link>
              </DropdownMenuItem>
            </>
          )}
          {user.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield aria-hidden /> Admin panel
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <form action={logoutAction}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOut aria-hidden /> Log out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
