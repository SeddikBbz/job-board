import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Job } from '@/payload-types'

// Pages that list jobs: the jobs list, the home page ("latest jobs") and all company pages.
const revalidateJobLists = () => {
  revalidatePath('/jobs')
  revalidatePath('/')
  revalidatePath('/companies/[slug]', 'page')
}

// Scripts that run outside Next.js (e.g. the seed) set context.disableRevalidate.
export const revalidateJob: CollectionAfterChangeHook<Job> = ({ doc, previousDoc, context }) => {
  if (context.disableRevalidate) return doc

  revalidateJobLists()
  revalidatePath(`/jobs/${doc.slug}`)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(`/jobs/${previousDoc.slug}`)
  }
  return doc
}

export const revalidateDeletedJob: CollectionAfterDeleteHook<Job> = ({ doc, context }) => {
  if (context.disableRevalidate) return doc

  revalidateJobLists()
  revalidatePath(`/jobs/${doc.slug}`)
  return doc
}
