import Link from 'next/link'

import { Logo } from '@/components/logo'
import { MobileNav } from '@/components/mobile-nav'
import { MAIN_NAV } from '@/components/nav-links'
import { UserNav } from '@/components/user-nav'

export function SiteHeader() {
  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <MobileNav />
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium md:flex">
          {MAIN_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <UserNav />
        </div>
      </div>
    </header>
  )
}
