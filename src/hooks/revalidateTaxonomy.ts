import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const TAXONOMY_TAG = 'taxonomy'

// Skills and cities are cached for the pickers; refresh them after an admin edit.
export const revalidateTaxonomy: CollectionAfterChangeHook = ({ doc, context }) => {
  if (context.disableRevalidate) return doc
  try {
    revalidateTag(TAXONOMY_TAG, 'max')
  } catch {
    // Outside a Next.js request (seed, migration): nothing is cached yet
  }
  return doc
}
