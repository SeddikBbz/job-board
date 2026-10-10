/**
 * One-time script: re-upload every existing image so it gets the new sizes (thumb, logo, og…),
 * the 2400 px limit and WebP format. Safe to run twice: each image is just processed again.
 *
 *   pnpm media:reprocess
 *
 * Run it against the database you want to fix (local first, production after a backup).
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

// Logos are the only images used today; mark them so the new `kind` field is correct
const { docs: companies } = await payload.find({ collection: 'companies', depth: 0, limit: 0, pagination: false })
const logoIds = new Set(companies.map((c) => c.logo).filter(Boolean))

const { docs: images } = await payload.find({ collection: 'media', depth: 0, limit: 0, pagination: false })
let ok = 0
let failed = 0

for (const image of images) {
  try {
    // Vercel Blob gives absolute URLs; local development stores files in ./media
    const data =
      image.url?.startsWith('http')
        ? Buffer.from(await (await fetch(image.url)).arrayBuffer())
        : await readFile(path.join(process.cwd(), 'media', image.filename!))

    await payload.update({
      collection: 'media',
      id: image.id,
      data: { kind: logoIds.has(image.id) ? 'logo' : (image.kind ?? 'other') },
      file: { data, mimetype: image.mimeType!, name: image.filename!, size: data.length },
      // Trusted maintenance script, not a user request
      overrideAccess: true,
    })
    ok++
    payload.logger.info(`Reprocessed ${image.filename}`)
  } catch (error) {
    failed++
    payload.logger.error(`Could not reprocess ${image.filename}: ${(error as Error).message}`)
  }
}

payload.logger.info(`Done: ${ok} reprocessed, ${failed} failed.`)
process.exit(failed ? 1 : 0)
