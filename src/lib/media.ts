import type { Media } from '@/payload-types'

export type ImageSize = keyof NonNullable<Media['sizes']>

// URL of the first generated size that exists, else the original.
// Payload skips sizes bigger than the original, so small images only have the original.
export function imageUrl(media: Media | number | null | undefined, preferred: ImageSize[]): string | null {
  if (!media || typeof media !== 'object') return null
  for (const size of preferred) {
    const url = media.sizes?.[size]?.url
    if (url) return url
  }
  return media.url ?? null
}

// "Atlas Digital" -> "AD", "jane" -> "J"
export function initials(name: string, max = 2): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, max)
    .toUpperCase()
}
