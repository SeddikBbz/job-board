import type { Payload } from 'payload'

import { normalizeText } from '@/lib/normalize'

export const SUGGEST_MIN = 2
export const SUGGEST_MAX = 60
export const LIMITS = { jobs: 5, skills: 5, locations: 5, companies: 3 } as const

// Shown when the box is focused and empty
const POPULAR_CITIES = ['algiers', 'oran', 'constantine', 'setif', 'remote']
export const POPULAR_SEARCHES = ['Developer', 'Data analyst', 'Designer', 'Accountant']

export type Suggestions = {
  jobs: { title: string; slug: string; company: string | null }[]
  skills: { name: string; slug: string; category: string | null }[]
  locations: { name: string; slug: string; country: string | null }[]
  companies: { name: string; slug: string }[]
  popular?: string[]
}

// "" means "show popular suggestions"; otherwise 2 to 60 characters after trimming.
export function parseSuggestQuery(raw: string | null): { q: string } | { error: string } {
  const q = (raw ?? '').trim()
  if (q.length > SUGGEST_MAX) return { error: `Use at most ${SUGGEST_MAX} characters.` }
  if (q.length > 0 && q.length < SUGGEST_MIN) return { error: `Type at least ${SUGGEST_MIN} characters.` }
  return { q }
}

const name = (value: unknown) => (value && typeof value === 'object' && 'name' in value ? String(value.name) : null)

// Public read rules apply (overrideAccess: false, no user): only published, non-expired jobs.
// Each group asks only for the fields it shows, and the four groups run in parallel.
export async function getSuggestions(payload: Payload, q: string): Promise<Suggestions> {
  const pub = { overrideAccess: false, pagination: false } as const

  if (!q) {
    const [skills, locations] = await Promise.all([
      payload.find({ collection: 'skills', where: { popular: { equals: true } }, sort: 'order', limit: 8, depth: 1, select: { name: true, slug: true, categories: true }, populate: { 'skill-categories': { name: true } }, ...pub }),
      payload.find({ collection: 'locations', where: { slug: { in: POPULAR_CITIES } }, sort: 'order', limit: 5, depth: 0, select: { name: true, slug: true, country: true }, ...pub }),
    ])
    return {
      jobs: [],
      skills: skills.docs.map((s) => ({ name: s.name, slug: s.slug ?? '', category: name(s.categories?.[0]) })),
      locations: locations.docs.map((l) => ({ name: l.name, slug: l.slug ?? '', country: l.country ?? null })),
      companies: [],
      popular: POPULAR_SEARCHES,
    }
  }

  const nq = normalizeText(q)
  const [jobs, skills, locations, companies] = await Promise.all([
    payload.find({
      collection: 'jobs',
      where: { searchText: { like: nq } },
      sort: '-publishedAt',
      limit: LIMITS.jobs,
      depth: 1,
      select: { title: true, slug: true, company: true },
      populate: { companies: { name: true } },
      ...pub,
    }),
    payload.find({
      collection: 'skills',
      where: { searchText: { like: nq } },
      sort: 'order',
      limit: LIMITS.skills,
      depth: 1,
      select: { name: true, slug: true, categories: true },
      populate: { 'skill-categories': { name: true } },
      ...pub,
    }),
    payload.find({
      collection: 'locations',
      where: { searchText: { like: nq } },
      sort: 'order',
      limit: LIMITS.locations,
      depth: 0,
      select: { name: true, slug: true, country: true },
      ...pub,
    }),
    payload.find({
      collection: 'companies',
      where: { name: { like: q } },
      limit: LIMITS.companies,
      depth: 0,
      select: { name: true, slug: true },
      ...pub,
    }),
  ])

  return {
    jobs: jobs.docs.map((j) => ({ title: j.title, slug: j.slug ?? '', company: name(j.company) })),
    skills: skills.docs.map((s) => ({ name: s.name, slug: s.slug ?? '', category: name(s.categories?.[0]) })),
    locations: locations.docs.map((l) => ({ name: l.name, slug: l.slug ?? '', country: l.country ?? null })),
    companies: companies.docs.map((c) => ({ name: c.name, slug: c.slug ?? '' })),
  }
}
