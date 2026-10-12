import { describe, expect, it } from 'vitest'

import { buildJobsWhere, parseJobFilters, toSearchParams } from '@/lib/jobFilters'
import { parseSuggestQuery } from '@/lib/suggest'

describe('search URL builder and parser', () => {
  it('round-trips every filter', () => {
    const url = 'q=react&location=Oran&skills=react,node-js&type=full-time&mode=remote&exp=senior&lang=fr&posted=7d&salaryMin=100000&sort=salary-desc&page=2'
    const filters = parseJobFilters(Object.fromEntries(new URLSearchParams(url)))
    expect(parseJobFilters(Object.fromEntries(toSearchParams(filters)))).toEqual(filters)
  })

  it('leaves defaults out so URLs stay short', () => {
    expect(toSearchParams(parseJobFilters({})).toString()).toBe('')
    expect(toSearchParams(parseJobFilters({ q: 'go', sort: 'newest', page: '1' })).toString()).toBe('q=go')
  })

  it('drops unknown values instead of failing', () => {
    const f = parseJobFilters({ exp: 'senior,wizard', lang: 'xx', posted: '1y' })
    expect(f.exp).toEqual(['senior'])
    expect(f.lang).toEqual([])
    expect(f.posted).toBeUndefined()
  })
})

describe('new filters', () => {
  const now = new Date('2026-10-12T12:00:00.000Z')

  it('filters by experience, language and posting date', () => {
    const where = buildJobsWhere(parseJobFilters({ exp: 'senior', lang: 'fr', posted: '7d' }), now)
    expect(where).toEqual({
      and: [
        { experienceLevel: { in: ['senior'] } },
        { contentLanguage: { in: ['fr'] } },
        { publishedAt: { greater_than_equal: '2026-10-05T12:00:00.000Z' } },
      ],
    })
  })
})

describe('parseSuggestQuery', () => {
  it('accepts empty (popular suggestions) and 2 to 60 characters, trimmed', () => {
    expect(parseSuggestQuery(null)).toEqual({ q: '' })
    expect(parseSuggestQuery('  re ')).toEqual({ q: 're' })
    expect(parseSuggestQuery('x'.repeat(60))).toEqual({ q: 'x'.repeat(60) })
  })

  it('rejects 1 character and more than 60', () => {
    expect(parseSuggestQuery('r')).toHaveProperty('error')
    expect(parseSuggestQuery('x'.repeat(61))).toHaveProperty('error')
  })
})
