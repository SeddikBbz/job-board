import type { Sort, Where } from 'payload'
import { z } from 'zod'

import { normalizeText } from '@/lib/normalize'

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const
export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const
export const SORTS = ['newest', 'salary-desc', 'salary-asc'] as const
export const EXPERIENCE = ['junior', 'mid', 'senior', 'lead'] as const
export const LANGUAGES = ['en', 'fr', 'ar'] as const
// "posted within": 24 hours, 7 days, 30 days
export const POSTED = { '24h': 1, '7d': 7, '30d': 30 } as const
export const PAGE_SIZE = 10

type SearchParams = Record<string, string | string[] | undefined>

// "a,b" or ["a", "b"] -> ["a", "b"]
const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) =>
    (Array.isArray(value) ? value : (value ?? '').split(','))
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  )

const text = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined)

// The one search parameter schema (q, skills, location, mode, type, exp, salaryMin, posted, lang,
// sort, page), shared by live search, the /jobs filters, and later saved searches and alerts.
const schema = z.object({
  q: text.transform((v) => v?.slice(0, 100)),
  location: text,
  type: list.transform((v) => v.filter((t) => (JOB_TYPES as readonly string[]).includes(t))),
  mode: list.transform((v) => v.filter((m) => (WORK_MODES as readonly string[]).includes(m))),
  skills: list,
  exp: list.transform((v) => v.filter((e) => (EXPERIENCE as readonly string[]).includes(e))),
  lang: list.transform((v) => v.filter((l) => (LANGUAGES as readonly string[]).includes(l))),
  posted: z.enum(Object.keys(POSTED) as [keyof typeof POSTED]).optional().catch(undefined),
  salaryMin: z.coerce.number().int().positive().optional().catch(undefined),
  sort: z.enum(SORTS).catch('newest'),
  page: z.coerce.number().int().min(1).catch(1),
})

export type JobFilters = z.infer<typeof schema>

// Invalid values are dropped instead of throwing, so a hand-edited URL never breaks the page.
export const parseJobFilters = (searchParams: SearchParams): JobFilters => {
  const first = (key: string) => {
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }
  return schema.parse({
    q: first('q'),
    location: first('location'),
    type: searchParams.type,
    mode: searchParams.mode,
    skills: searchParams.skills,
    exp: searchParams.exp,
    lang: searchParams.lang,
    posted: first('posted'),
    salaryMin: first('salaryMin'),
    sort: first('sort'),
    page: first('page'),
  })
}

// Only the filters; "published and not expired" is added by the jobs read access control.
// `now` is a parameter so tests are deterministic
export const buildJobsWhere = (filters: JobFilters, now = new Date()): Where => {
  const and: Where[] = []

  if (filters.q) {
    and.push({
      or: [
        { title: { like: filters.q } },
        { location: { like: filters.q } },
        { 'company.name': { like: filters.q } },
        // searchText holds every spelling (aliases, accents and Arabic forms removed)
        { 'skills.searchText': { like: normalizeText(filters.q) } },
        { 'city.searchText': { like: normalizeText(filters.q) } },
      ],
    })
  }
  if (filters.type.length) and.push({ jobType: { in: filters.type } })
  if (filters.mode.length) and.push({ workMode: { in: filters.mode } })
  if (filters.location) {
    and.push({
      or: [{ 'city.searchText': { like: normalizeText(filters.location) } }, { location: { like: filters.location } }],
    })
  }
  // A job matches if it can pay at least the requested amount
  if (filters.salaryMin) and.push({ salaryMax: { greater_than_equal: filters.salaryMin } })
  if (filters.exp.length) and.push({ experienceLevel: { in: filters.exp } })
  if (filters.lang.length) and.push({ contentLanguage: { in: filters.lang } })
  if (filters.posted) {
    const since = new Date(now.getTime() - POSTED[filters.posted] * 86_400_000).toISOString()
    and.push({ publishedAt: { greater_than_equal: since } })
  }
  // ?skills= takes slugs from links ("node-js") or words people type ("node"): any one matches
  if (filters.skills.length) {
    and.push({
      or: filters.skills.flatMap((skill): Where[] => [
        { 'skills.slug': { equals: skill } },
        { 'skills.searchText': { like: normalizeText(skill) } },
      ]),
    })
  }

  return and.length ? { and } : {}
}

export const sortForPayload = (sort: JobFilters['sort']): Sort =>
  ({ newest: '-publishedAt', 'salary-desc': '-salaryMax', 'salary-asc': 'salaryMin' })[sort]

export const hasActiveFilters = (f: JobFilters) =>
  Boolean(
    f.q || f.location || f.type.length || f.mode.length || f.skills.length || f.exp.length || f.lang.length || f.posted || f.salaryMin,
  )

// The reverse of parseJobFilters: filters -> "q=react&skills=node-js". Defaults are left out,
// so URLs stay short and two equal searches give the same URL.
export function toSearchParams(f: Partial<JobFilters>): URLSearchParams {
  const params = new URLSearchParams()
  const set = (key: string, value: string | number | undefined) => value && params.set(key, String(value))
  set('q', f.q)
  set('location', f.location)
  for (const key of ['skills', 'type', 'mode', 'exp', 'lang'] as const) set(key, f[key]?.join(','))
  set('salaryMin', f.salaryMin)
  set('posted', f.posted)
  if (f.sort && f.sort !== 'newest') set('sort', f.sort)
  if (f.page && f.page > 1) set('page', f.page)
  return params
}
