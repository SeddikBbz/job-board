/**
 * Generates the app icons in public/icons from the logo mark (briefcase on the brand color).
 * Run once after changing the logo:  pnpm icons
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const BRAND = '#4f46e5' // matches --primary in styles.css
const OUT = path.join(process.cwd(), 'public', 'icons')

// Lucide "briefcase-business" (same icon as the header logo), white strokes on a 24x24 grid
const briefcase = `
  <g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/>
  </g>`

// `inset` is the share of the canvas kept free around the mark. Maskable icons need a bigger
// safe zone because Android may crop them to a circle.
function svg(size: number, { inset, rounded }: { inset: number; rounded: boolean }) {
  const mark = size * (1 - inset * 2)
  const scale = mark / 24
  const offset = size * inset
  const radius = rounded ? size * 0.22 : 0
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND}"/>
    <g transform="translate(${offset} ${offset}) scale(${scale})">${briefcase}</g>
  </svg>`)
}

const icons = [
  { file: 'icon-192.png', size: 192, inset: 0.2, rounded: true },
  { file: 'icon-512.png', size: 512, inset: 0.2, rounded: true },
  { file: 'maskable-512.png', size: 512, inset: 0.3, rounded: false },
  // iOS adds its own rounded corners
  { file: 'apple-touch-icon.png', size: 180, inset: 0.2, rounded: false },
  { file: 'favicon-32.png', size: 32, inset: 0.15, rounded: true },
]

await mkdir(OUT, { recursive: true })
for (const { file, size, ...options } of icons) {
  await sharp(svg(size, options)).png().toFile(path.join(OUT, file))
  console.log(`public/icons/${file}`)
}
