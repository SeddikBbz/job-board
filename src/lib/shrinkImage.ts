// Browser only. Shrinks a photo before upload: Vercel rejects request bodies over 4.5 MB,
// and a 12 MP phone photo is often larger. The server resizes again anyway (2400 px, WebP).
import { MAX_IMAGE_SIDE } from '@/lib/validation/media'

// Small files are sent untouched (no quality loss), and GIFs keep their original bytes
const SHRINK_ABOVE_BYTES = 1024 * 1024

export async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return null // not decodable by this browser (or not an image)
  }
}

export async function shrinkImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= SHRINK_ABOVE_BYTES) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  // WebP keeps transparency (logos)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob || blob.size >= file.size) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
}
