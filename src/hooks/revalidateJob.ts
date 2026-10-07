import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import type { Job } from '@/payload-types'

// Pages that show this job: the jobs list, the home page ("latest jobs"), all company pages
// and the job page itself (plus its old URL if the slug changed).
const revalidateJobPages = (req: PayloadRequest, ...slugs: (string | null | undefined)[]) => {
  try {
    revalidatePath('/jobs')
    revalidatePath('/')
    revalidatePath('/companies/[slug]', 'page')
    for (const slug of new Set(slugs)) if (slug) revalidatePath(`/jobs/${slug}`)
  } catch (error) {
    // Outside a Next.js request (e.g. a background task) there is no cache to revalidate;
    // pages still refresh on their own revalidate interval.
    req.payload.logger.warn({ err: error, msg: 'revalidatePath skipped' })
  }
}

// Scripts that run outside Next.js (e.g. the seed) set context.disableRevalidate.
export const revalidateJob: CollectionAfterChangeHook<Job> = ({ doc, previousDoc, context, req }) => {
  if (!context.disableRevalidate) revalidateJobPages(req, doc.slug, previousDoc?.slug)
  return doc
}

export const revalidateDeletedJob: CollectionAfterDeleteHook<Job> = ({ doc, context, req }) => {
  if (!context.disableRevalidate) revalidateJobPages(req, doc.slug)
  return doc
}
