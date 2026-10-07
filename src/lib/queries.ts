import { cache } from 'react'

import { buildJobsWhere, PAGE_SIZE, sortForPayload, type JobFilters } from './jobFilters'
import { getPayloadClient } from './payload'

// Public reads: `overrideAccess: false` with no user applies the public access rules,
// so only published, non-expired jobs can ever be returned here.
const publicRead = { overrideAccess: false } as const

export const getJobs = async (filters: JobFilters) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'jobs',
    where: buildJobsWhere(filters),
    sort: sortForPayload(filters.sort),
    page: filters.page,
    limit: PAGE_SIZE,
    depth: 2,
    ...publicRead,
  })
}

export const getLatestJobs = async (limit = 6) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'jobs',
    sort: '-publishedAt',
    limit,
    depth: 2,
    ...publicRead,
  })
  return docs
}

// `cache` dedupes the call between generateMetadata and the page
export const getJobBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'jobs',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    ...publicRead,
  })
  return docs[0] ?? null
})

export const getCompanyBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'companies',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    ...publicRead,
  })
  return docs[0] ?? null
})

export const getCompanyJobs = async (companyId: number) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'jobs',
    where: { company: { equals: companyId } },
    sort: '-publishedAt',
    pagination: false,
    depth: 2,
    ...publicRead,
  })
  return docs
}

// Numbers for the home page hero (public read rules apply)
export const getStats = async () => {
  const payload = await getPayloadClient()
  const [jobs, companies] = await Promise.all([
    payload.count({ collection: 'jobs', ...publicRead }),
    payload.count({ collection: 'companies', ...publicRead }),
  ])
  return { jobs: jobs.totalDocs, companies: companies.totalDocs }
}

export const getFeaturedCompanies = async (limit = 6) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'companies',
    where: { logo: { exists: true } },
    sort: '-updatedAt',
    limit,
    depth: 1,
    ...publicRead,
  })
  return docs
}
