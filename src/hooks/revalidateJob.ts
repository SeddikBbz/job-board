import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Job } from '@/payload-types'

// Scripts that run outside Next.js (e.g. the seed) set context.disableRevalidate.
export const revalidateJob: CollectionAfterChangeHook<Job> = ({ doc, previousDoc, context }) => {
  if (context.disableRevalidate) return doc

  revalidatePath('/jobs')
  revalidatePath(`/jobs/${doc.slug}`)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(`/jobs/${previousDoc.slug}`)
  }
  return doc
}

export const revalidateDeletedJob: CollectionAfterDeleteHook<Job> = ({ doc, context }) => {
  if (context.disableRevalidate) return doc

  revalidatePath('/jobs')
  revalidatePath(`/jobs/${doc.slug}`)
  return doc
}
