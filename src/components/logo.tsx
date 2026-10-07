import { BriefcaseBusiness } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
        <BriefcaseBusiness className="size-4" aria-hidden />
      </span>
      <span className="text-lg">JobBoard</span>
    </Link>
  )
}
