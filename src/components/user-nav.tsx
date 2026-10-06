'use client'

import { LayoutDashboard, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { logoutAction } from '@/app/(frontend)/(auth)/actions'
import { Button } from '@/components/ui/button'

type Me = { name: string; role: string } | null

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
  if (user === undefined) return <div className="h-8 w-40" aria-hidden />

  if (!user) {
    return (
      <div className="flex items-center gap-1">
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
    <div className="flex items-center gap-1">
      <Button variant="ghost" asChild>
        <Link href="/dashboard">
          <LayoutDashboard aria-hidden />
          <span className="max-w-32 truncate">{user.name}</span>
        </Link>
      </Button>
      <form action={logoutAction}>
        <Button variant="ghost" size="icon" type="submit" aria-label="Log out" title="Log out">
          <LogOut aria-hidden />
        </Button>
      </form>
    </div>
  )
}
