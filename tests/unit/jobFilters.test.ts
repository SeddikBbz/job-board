import { describe, expect, it } from 'vitest'

import { buildJobsWhere, hasActiveFilters, parseJobFilters, sortForPayload } from '@/lib/jobFilters'

describe('parseJobFilters', () => {
  it('gives sensible defaults for an empty URL', () => {
    expect(parseJobFilters({})).toEqual({
      q: undefined,
      location: undefined,
      type: [],
      mode: [],
      skills: [],
      salaryMin: undefined,
      sort: 'newest',
      page: 1,
    })
  })

  it('reads comma lists and repeated params', () => {
    const f = parseJobFilters({ type: 'full-time,contract', mode: ['remote', 'hybrid'], skills: ' React , Node ' })
    expect(f.type).toEqual(['full-time', 'contract'])
    expect(f.mode).toEqual(['remote', 'hybrid'])
    expect(f.skills).toEqual(['react', 'node'])
  })

  it('drops invalid values instead of throwing', () => {
    const f = parseJobFilters({ type: 'full-time,bogus', mode: 'moon', salaryMin: '-5', sort: 'nope', page: 'abc' })
    expect(f.type).toEqual(['full-time'])
    expect(f.mode).toEqual([])
    expect(f.salaryMin).toBeUndefined()
    expect(f.sort).toBe('newest')
    expect(f.page).toBe(1)
  })

  it('trims text and treats blank as missing', () => {
    expect(parseJobFilters({ q: '  developer ', location: '   ' })).toMatchObject({ q: 'developer', location: undefined })
  })

  it('uses the first value when a single-value param is repeated', () => {
    expect(parseJobFilters({ page: ['3', '9'] }).page).toBe(3)
  })
})

describe('buildJobsWhere', () => {
  it('returns an empty where without filters', () => {
    expect(buildJobsWhere(parseJobFilters({}))).toEqual({})
  })

  it('combines every filter with AND', () => {
    const where = buildJobsWhere(
      parseJobFilters({ type: 'full-time', mode: 'remote', location: 'Oran', salaryMin: '1000', skills: 'go' }),
    )
    expect(where).toEqual({
      and: [
        { jobType: { in: ['full-time'] } },
        { workMode: { in: ['remote'] } },
        { location: { like: 'Oran' } },
        { salaryMax: { greater_than_equal: 1000 } },
        { skills: { in: ['go'] } },
      ],
    })
  })

  it('searches keywords across title, location, company name and skills with OR', () => {
    expect(buildJobsWhere(parseJobFilters({ q: 'React' }))).toEqual({
      and: [
        {
          or: [
            { title: { like: 'React' } },
            { location: { like: 'React' } },
            { 'company.name': { like: 'React' } },
            { skills: { in: ['react'] } },
          ],
        },
      ],
    })
  })

  it('never adds a status filter (published-only comes from access control)', () => {
    expect(JSON.stringify(buildJobsWhere(parseJobFilters({ q: 'x', type: 'contract' })))).not.toContain('status')
  })
})

describe('sortForPayload / hasActiveFilters', () => {
  it('maps sort options to Payload sort strings', () => {
    expect(sortForPayload('newest')).toBe('-publishedAt')
    expect(sortForPayload('salary-desc')).toBe('-salaryMax')
    expect(sortForPayload('salary-asc')).toBe('salaryMin')
  })

  it('ignores sort and page when deciding if filters are active', () => {
    expect(hasActiveFilters(parseJobFilters({ sort: 'salary-asc', page: '2' }))).toBe(false)
    expect(hasActiveFilters(parseJobFilters({ mode: 'remote' }))).toBe(true)
  })
})
