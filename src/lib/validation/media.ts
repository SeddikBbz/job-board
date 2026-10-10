// Image upload rules, shared by the media collection (server) and the ImageUpload component (browser).

export const MAX_IMAGE_MB = 8
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024
// Decompression-bomb guard: a tiny file can decode into a gigantic bitmap
export const MAX_IMAGE_PIXELS = 50_000_000
// The original is shrunk to this longest side before it is stored
export const MAX_IMAGE_SIDE = 2400

// Static GIFs only matter for old logos; SVG is excluded on purpose (it can carry scripts)
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
const PHONE_FORMATS = ['image/heic', 'image/heif']

export const IMAGE_TYPE_ERROR = 'Please upload a JPG, PNG or WebP image.'

type ImageInfo = { type: string; size: number; width?: number; height?: number }

// Returns a friendly error message, or null when the image is acceptable.
export function checkImage({ type, size, width, height }: ImageInfo): string | null {
  if (PHONE_FORMATS.includes(type)) {
    return 'iPhone photos (HEIC) are not supported yet. Please upload a JPG, PNG or WebP image.'
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(type)) return IMAGE_TYPE_ERROR
  if (size > MAX_IMAGE_BYTES) return `Image must be ${MAX_IMAGE_MB} MB or smaller.`
  if (width && height && width * height > MAX_IMAGE_PIXELS) {
    return 'This image has too many pixels. Please upload a smaller image (under 50 megapixels).'
  }
  return null
}
