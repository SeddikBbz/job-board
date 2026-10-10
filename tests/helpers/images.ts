import { readFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import { pdfFile } from './fixtures'

type UploadFile = { data: Buffer; name: string; mimetype: string; size: number }

const file = (data: Buffer, name: string, mimetype: string): UploadFile => ({ data, name, mimetype, size: data.length })

// Generated on the fly so no binary fixtures live in git
export async function jpeg(width: number, height: number, name = `photo-${width}x${height}.jpg`) {
  const data = await sharp({ create: { width, height, channels: 3, background: '#4f46e5' } }).jpeg().toBuffer()
  return file(data, name, 'image/jpeg')
}

export async function transparentPng() {
  const data = await sharp({ create: { width: 600, height: 300, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png()
    .toBuffer()
  return file(data, 'logo-transparent.png', 'image/png')
}

// 200x100 pixels stored, but EXIF says "rotate 90°": the real picture is 100x200
export async function exifRotatedJpeg() {
  const data = await sharp({ create: { width: 200, height: 100, channels: 3, background: '#16a34a' } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer()
  return file(data, 'rotated.jpg', 'image/jpeg')
}

export const pdfPretendingToBePng = () => ({ ...pdfFile('logo.png'), mimetype: 'image/png' })

export const svg = () =>
  file(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>'), 'logo.svg', 'image/svg+xml')

export const hugeFile = () => file(Buffer.alloc(20 * 1024 * 1024, 1), 'huge.jpg', 'image/jpeg')

// Reads a stored file back (local disk in development, Blob URL when storage is enabled)
export async function storedFile(doc: { url?: string | null; filename?: string | null }) {
  if (doc.url?.startsWith('http')) return Buffer.from(await (await fetch(doc.url)).arrayBuffer())
  return readFile(path.join(process.cwd(), 'media', doc.filename!))
}
