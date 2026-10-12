import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, Payload, PayloadRequest } from 'payload'

import { relationId } from '@/lib/relationId'
import { buildSearchText } from '@/lib/normalize'
import type { Job } from '@/payload-types'

type JobLike = Pick<Job, 'title' | 'location' | 'company' | 'skills' | 'city'>

// Every word a job can be found by: title, company, skills and city (with their aliases),
// normalized. Used by the live search suggestions and the keyword filter.
export async function computeJobSearchText(job: JobLike, payload: Payload, req?: Partial<PayloadRequest>) {
  const ids = (values: unknown[] | null | undefined) => (values ?? []).map((v) => relationId(v as number)).filter(Boolean)
  const companyId = job.company ? relationId(job.company) : null
  const cityId = job.city ? relationId(job.city) : null
  const skillIds = ids(job.skills)

  const [company, city, skills] = await Promise.all([
    companyId ? payload.findByID({ collection: 'companies', id: companyId, depth: 0, select: { name: true }, disableErrors: true, req }) : null,
    cityId ? payload.findByID({ collection: 'locations', id: cityId, depth: 0, select: { name: true, aliases: true }, disableErrors: true, req }) : null,
    skillIds.length
      ? payload
          .find({ collection: 'skills', where: { id: { in: skillIds } }, depth: 0, limit: 0, pagination: false, select: { name: true, aliases: true }, req })
          .then((r) => r.docs)
      : [],
  ])

  return buildSearchText(
    job.title,
    company?.name,
    job.location,
    city?.name,
    ...(city?.aliases ?? []),
    ...skills.flatMap((s) => [s.name, ...(s.aliases ?? [])]),
  )
}

export const fillJobSearchText: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const merged = { ...originalDoc, ...data } as JobLike
  return { ...data, searchText: await computeJobSearchText(merged, req.payload, req) }
}

// A renamed company must stay findable by its new name on all its jobs
export const refreshCompanyJobsSearchText: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || doc.name === previousDoc?.name) return doc
  const { docs } = await req.payload.find({ collection: 'jobs', where: { company: { equals: doc.id } }, depth: 0, limit: 0, pagination: false, req })
  for (const job of docs) {
    // The beforeChange hook recomputes searchText; skip cache revalidation for this background update
    await req.payload.update({ collection: 'jobs', id: job.id, data: {}, req, context: { disableRevalidate: true } })
  }
  return doc
}
