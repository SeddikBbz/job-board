import type { Sort, Where } from 'payload'
import { z } from 'zod'

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const
export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const
export const SORTS = ['newest', 'salary-desc', 'salary-asc'] as const
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

const schema = z.object({
  q: text,
  location: text,
  type: list.transform((v) => v.filter((t) => (JOB_TYPES as readonly string[]).includes(t))),
  mode: list.transform((v) => v.filter((m) => (WORK_MODES as readonly string[]).includes(m))),
  skills: list,
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
    salaryMin: first('salaryMin'),
    sort: first('sort'),
    page: first('page'),
  })
}

// Only the filters; "published and not expired" is added by the jobs read access control.
export const buildJobsWhere = (filters: JobFilters): Where => {
  const and: Where[] = []

  if (filters.q) {
    and.push({
      or: [
        { title: { like: filters.q } },
        { location: { like: filters.q } },
        { 'company.name': { like: filters.q } },
        { skills: { in: [filters.q.toLowerCase()] } },
      ],
    })
  }
  if (filters.type.length) and.push({ jobType: { in: filters.type } })
  if (filters.mode.length) and.push({ workMode: { in: filters.mode } })
  if (filters.location) and.push({ location: { like: filters.location } })
  // A job matches if it can pay at least the requested amount
  if (filters.salaryMin) and.push({ salaryMax: { greater_than_equal: filters.salaryMin } })
  if (filters.skills.length) and.push({ skills: { in: filters.skills } })

  return and.length ? { and } : {}
}

export const sortForPayload = (sort: JobFilters['sort']): Sort =>
  ({ newest: '-publishedAt', 'salary-desc': '-salaryMax', 'salary-asc': 'salaryMin' })[sort]

export const hasActiveFilters = (f: JobFilters) =>
  Boolean(f.q || f.location || f.type.length || f.mode.length || f.skills.length || f.salaryMin)
