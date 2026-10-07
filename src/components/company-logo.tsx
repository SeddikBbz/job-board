import Image from 'next/image'

import { cn } from '@/lib/utils'
import type { Company, Media } from '@/payload-types'

type Props = {
  company: Pick<Company, 'name' | 'logo'>
  size?: number
  className?: string
}

export function CompanyLogo({ company, size = 48, className }: Props) {
  const logo = typeof company.logo === 'object' ? (company.logo as Media | null) : null
  const src = logo?.sizes?.thumbnail?.url || logo?.url

  if (!src) {
    const initials = company.name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    return (
      <div
        aria-hidden
        style={{ width: size, height: size }}
        className={cn(
          'bg-muted text-muted-foreground flex shrink-0 items-center justify-center self-start rounded-lg text-sm font-semibold',
          className,
        )}
      >
        {initials}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={logo?.alt || `${company.name} logo`}
      width={size}
      height={size}
      // Fixed size + self-start: otherwise flex rows stretch the image to the card's height
      style={{ width: size, height: size }}
      className={cn('shrink-0 self-start rounded-lg object-cover', className)}
    />
  )
}
