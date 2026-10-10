import Image from 'next/image'

import { imageUrl, initials } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

type Props = {
  name: string
  image?: Media | number | null
  size?: number
  className?: string
}

// Round picture of a person. Photos of any shape are cropped to a circle (object-cover);
// without a photo, the person's initials are shown.
export function UserAvatar({ name, image, size = 32, className }: Props) {
  const src = imageUrl(image, size <= 160 ? ['thumb', 'avatar'] : ['avatar'])
  const frame = cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full', className)

  if (!src) {
    return (
      <span
        aria-hidden
        data-testid="avatar-fallback"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        className={cn(frame, 'bg-secondary text-secondary-foreground font-semibold')}
      >
        {initials(name)}
      </span>
    )
  }

  return (
    <span style={{ width: size, height: size }} className={frame}>
      <Image src={src} alt={name} width={size} height={size} className="size-full object-cover" />
    </span>
  )
}
