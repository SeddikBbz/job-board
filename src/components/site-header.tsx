import Link from 'next/link'

import { Container } from '@/components/container'
import { Logo } from '@/components/logo'
import { MobileNav } from '@/components/mobile-nav'
import { MAIN_NAV } from '@/components/nav-links'
import { UserNav } from '@/components/user-nav'

export function SiteHeader() {
  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur">
      <Container className="flex h-16 items-center gap-3 md:gap-6">
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
        <div className="ms-auto">
          <UserNav />
        </div>
      </Container>
    </header>
  )
}
