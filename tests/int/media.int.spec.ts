/**
 * Image uploads: resizing, generated sizes, format, metadata, rejections and access.
 * Runs through the Local API as a real user ({ user, overrideAccess: false }). Needs DATABASE_URI.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { deleteTestData, testContext } from '../helpers/fixtures'
import { exifRotatedJpeg, hugeFile, jpeg, pdfPretendingToBePng, storedFile, svg, transparentPng } from '../helpers/images'
import type { Media, User } from '@/payload-types'

const DOMAIN = '@media-int.test'
let payload: Payload
let owner: User, other: User
const as = (user: User) => ({ user, overrideAccess: false, context: testContext }) as const

const upload = (user: User, file: Awaited<ReturnType<typeof jpeg>>) =>
  payload.create({ collection: 'media', data: { alt: 'Test image' }, file, ...as(user) })

beforeAll(async () => {
  payload = await getPayload({ config })
  await deleteTestData(payload, DOMAIN)
  const makeUser = (name: string) =>
    payload.create({
      collection: 'users',
      data: { email: `${name}${DOMAIN}`, name, role: 'employer', password: 'Password123!' },
      context: { ...testContext, skipRoleProtection: true },
    })
  ;[owner, other] = await Promise.all([makeUser('owner'), makeUser('other')])
})

afterAll(async () => {
  // Skipped when setup failed (e.g. no database connection): the real error is already reported
  if (payload) await deleteTestData(payload, DOMAIN)
})

describe('resizing and generated sizes', () => {
  it('never enlarges a tiny image and skips sizes bigger than it', async () => {
    const doc = await upload(owner, await jpeg(50, 50))
    expect([doc.width, doc.height]).toEqual([50, 50])
    expect(doc.sizes?.thumb?.url).toBeFalsy()
    expect(doc.sizes?.logo?.url).toBeFalsy()
  })

  it('creates every size with the expected dimensions for a normal photo', async () => {
    const doc = await upload(owner, await jpeg(1000, 800))
    expect([doc.width, doc.height]).toEqual([1000, 800])
    const dims = (size: keyof NonNullable<Media['sizes']>) => [doc.sizes?.[size]?.width, doc.sizes?.[size]?.height]
    expect(dims('thumb')).toEqual([160, 160])
    expect(dims('avatar')).toEqual([400, 400])
    // inside 400x200, aspect ratio kept
    expect(dims('logo')).toEqual([250, 200])
    expect(dims('card')).toEqual([640, 512])
    expect(dims('og')).toEqual([1200, 630])
    // 1600 wide would be an enlargement: skipped
    expect(doc.sizes?.hero?.url).toBeFalsy()
  })

  it('shrinks a huge photo so the longest side is 2400 px', async () => {
    const doc = await upload(owner, await jpeg(6000, 4000))
    expect([doc.width, doc.height]).toEqual([2400, 1600])
    expect([doc.sizes?.hero?.width, doc.sizes?.hero?.height]).toEqual([1600, 1067])
  })

  it('keeps the aspect ratio of very wide and very tall images', async () => {
    const wide = await upload(owner, await jpeg(4000, 300))
    expect([wide.width, wide.height]).toEqual([2400, 180])
    expect([wide.sizes?.logo?.width, wide.sizes?.logo?.height]).toEqual([400, 30])

    const tall = await upload(owner, await jpeg(300, 4000))
    expect([tall.width, tall.height]).toEqual([180, 2400])
    expect([tall.sizes?.logo?.width, tall.sizes?.logo?.height]).toEqual([15, 200])
  })
})

describe('format and metadata', () => {
  it('stores WebP and keeps transparency', async () => {
    const doc = await upload(owner, await transparentPng())
    expect(doc.mimeType).toBe('image/webp')
    expect(doc.filename).toMatch(/\.webp$/)
    const meta = await sharp(await storedFile(doc)).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.hasAlpha).toBe(true)
  })

  it('applies the EXIF rotation, then strips EXIF', async () => {
    const doc = await upload(owner, await exifRotatedJpeg())
    expect([doc.width, doc.height]).toEqual([100, 200])
    const meta = await sharp(await storedFile(doc)).metadata()
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation ?? 1).toBe(1)
  })
})

describe('rejections', () => {
  it('rejects a PDF renamed to .png', async () => {
    await expect(upload(owner, pdfPretendingToBePng())).rejects.toThrow(/not a valid image|JPG, PNG or WebP/)
  })

  it('rejects SVG', async () => {
    await expect(upload(owner, svg())).rejects.toThrow(/JPG, PNG or WebP/)
  })

  it('rejects a 20 MB file', async () => {
    await expect(upload(owner, hugeFile())).rejects.toThrow(/8 MB or smaller/)
  })
})

describe('access', () => {
  it('an anonymous visitor cannot upload', async () => {
    await expect(
      payload.create({ collection: 'media', data: { alt: 'x' }, file: await jpeg(100, 100), overrideAccess: false, context: testContext }),
    ).rejects.toThrow()
  })

  it('only the uploader can update or delete an image', async () => {
    const doc = await upload(owner, await jpeg(100, 100))
    expect(typeof doc.owner === 'object' ? doc.owner?.id : doc.owner).toBe(owner.id)

    await expect(payload.update({ collection: 'media', id: doc.id, data: { alt: 'Hacked' }, ...as(other) })).rejects.toThrow()
    await expect(payload.delete({ collection: 'media', id: doc.id, ...as(other) })).rejects.toThrow()

    const updated = await payload.update({ collection: 'media', id: doc.id, data: { alt: 'Renamed' }, ...as(owner) })
    expect(updated.alt).toBe('Renamed')
    await payload.delete({ collection: 'media', id: doc.id, ...as(owner) })
  })
})
