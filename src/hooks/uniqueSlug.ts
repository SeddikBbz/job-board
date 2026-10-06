import type { CollectionBeforeValidateHook, Where } from 'payload'

import { slugify } from '@/lib/slugify'

// Fills `slug` from `sourceField` and appends -2, -3... until it is unique in the collection.
// An existing slug is kept on update unless a new one is sent explicitly.
export const uniqueSlug =
  (sourceField: string): CollectionBeforeValidateHook =>
  async ({ collection, data, originalDoc, req }) => {
    if (!data) return data
    if (!data.slug && originalDoc?.slug) return data

    const source = data.slug || data[sourceField] || originalDoc?.[sourceField] || ''
    const base = slugify(String(source)) || collection.slug

    let candidate = base
    for (let n = 2; ; n++) {
      const where: Where = { slug: { equals: candidate } }
      if (originalDoc?.id) where.id = { not_equals: originalDoc.id }

      const { totalDocs } = await req.payload.count({ collection: collection.slug, where, req })
      if (totalDocs === 0) break
      candidate = `${base}-${n}`
    }

    return { ...data, slug: candidate }
  }
