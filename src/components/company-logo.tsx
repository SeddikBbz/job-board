import Image from 'next/image'

import { imageUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Company } from '@/payload-types'

type Props = {
  company: Pick<Company, 'name' | 'logo'>
  size?: number
  className?: string
}

// Square frame for a company logo. Logos of any shape fit inside without cropping (object-contain);
// without a logo, the first letter is shown on a brand-colored tile.
export function CompanyLogo({ company, size = 48, className }: Props) {
  // The `logo` size (400x200, never cropped) is plenty for every place a logo is shown
  const src = imageUrl(company.logo, ['logo', 'card'])
  const frame = cn('flex shrink-0 items-center justify-center self-start overflow-hidden rounded-lg', className)

  if (!src) {
    return (
      <div
        aria-hidden
        data-testid="company-logo-fallback"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        className={cn(frame, 'bg-secondary text-primary font-semibold')}
      >
        {company.name.trim()[0]?.toUpperCase()}
      </div>
    )
  }

  const alt = typeof company.logo === 'object' && company.logo?.alt ? company.logo.alt : `${company.name} logo`
  return (
    // Fixed size + self-start: otherwise flex rows stretch the frame to the card's height
    <div style={{ width: size, height: size }} className={cn(frame, 'bg-white')}>
      <Image src={src} alt={alt} width={size} height={size} className="size-full object-contain" />
    </div>
  )
}
