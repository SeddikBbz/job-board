import { unstable_cache } from 'next/cache'
import { cache } from 'react'

import { TAXONOMY_TAG } from '@/hooks/revalidateTaxonomy'

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

// Open jobs count for the auth pages. Cached for 10 minutes: an exact live number isn't needed there.
export const getOpenJobsCount = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const { totalDocs } = await payload.count({ collection: 'jobs', ...publicRead })
    return totalDocs
  },
  ['open-jobs-count'],
  { revalidate: 600 },
)

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

// Skills, categories and cities for pickers and filters. Cached until an admin edits them.
export const getTaxonomy = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const all = { limit: 0, pagination: false, depth: 0, overrideAccess: false } as const
    const [categories, skills, locations] = await Promise.all([
      payload.find({ collection: 'skill-categories', sort: 'order', select: { name: true, slug: true }, ...all }),
      payload.find({
        collection: 'skills',
        sort: 'order',
        select: { name: true, slug: true, categories: true, aliases: true, popular: true },
        ...all,
      }),
      payload.find({
        collection: 'locations',
        sort: 'order',
        select: { name: true, slug: true, country: true, region: true, isRemote: true },
        ...all,
      }),
    ])
    return {
      categories: categories.docs.map((c) => ({ id: c.id, name: c.name, slug: c.slug ?? '' })),
      skills: skills.docs.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug ?? '',
        categories: (s.categories ?? []).map((c) => (typeof c === 'object' ? c.id : c)),
        aliases: s.aliases ?? [],
        popular: Boolean(s.popular),
      })),
      locations: locations.docs.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug ?? '',
        country: l.country ?? '',
        isRemote: Boolean(l.isRemote),
      })),
    }
  },
  ['taxonomy'],
  { tags: [TAXONOMY_TAG], revalidate: 3600 },
)

export type Taxonomy = Awaited<ReturnType<typeof getTaxonomy>>
