import { describe, expect, it } from 'vitest'

import { imageUrl, initials } from '@/lib/media'
import { checkImage, MAX_IMAGE_BYTES } from '@/lib/validation/media'
import type { Media } from '@/payload-types'

describe('checkImage', () => {
  const ok = { type: 'image/jpeg', size: 1000, width: 1000, height: 800 }

  it('accepts common web image types', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']) {
      expect(checkImage({ ...ok, type })).toBeNull()
    }
  })

  it('rejects SVG, PDF and unknown types', () => {
    expect(checkImage({ ...ok, type: 'image/svg+xml' })).toMatch(/JPG, PNG or WebP/)
    expect(checkImage({ ...ok, type: 'application/pdf' })).toMatch(/JPG, PNG or WebP/)
    expect(checkImage({ ...ok, type: '' })).toMatch(/JPG, PNG or WebP/)
  })

  it('explains that iPhone HEIC photos are not supported', () => {
    expect(checkImage({ ...ok, type: 'image/heic' })).toMatch(/HEIC/)
  })

  it('rejects files over 8 MB', () => {
    expect(checkImage({ ...ok, size: MAX_IMAGE_BYTES })).toBeNull()
    expect(checkImage({ ...ok, size: MAX_IMAGE_BYTES + 1 })).toMatch(/8 MB/)
  })

  it('rejects images over 50 megapixels (decompression bombs)', () => {
    expect(checkImage({ ...ok, width: 8000, height: 7000 })).toMatch(/megapixels/)
    expect(checkImage({ ...ok, width: undefined, height: undefined })).toBeNull()
  })
})

describe('imageUrl', () => {
  const media = {
    url: '/api/media/file/original.webp',
    sizes: { thumb: { url: null }, logo: { url: '/api/media/file/logo.webp' } },
  } as unknown as Media

  it('returns the first generated size that exists', () => {
    expect(imageUrl(media, ['thumb', 'logo'])).toBe('/api/media/file/logo.webp')
  })

  it('falls back to the original when no size exists', () => {
    expect(imageUrl(media, ['thumb', 'og'])).toBe('/api/media/file/original.webp')
  })

  it('returns null for a missing or unpopulated image', () => {
    expect(imageUrl(null, ['thumb'])).toBeNull()
    expect(imageUrl(42, ['thumb'])).toBeNull()
  })
})

describe('initials', () => {
  it('takes the first letters of up to two words', () => {
    expect(initials('Atlas Digital')).toBe('AD')
    expect(initials('  jane  ')).toBe('J')
    expect(initials('Anna Maria Lopez')).toBe('AM')
  })
})
