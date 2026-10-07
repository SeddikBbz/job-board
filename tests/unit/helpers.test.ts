import { describe, expect, it } from 'vitest'

import { jobPostingJsonLd, serializeJsonLd } from '@/lib/jobPostingJsonLd'
import { rateLimit } from '@/lib/rateLimit'
import { richTextToText, textToRichText } from '@/lib/richText'
import { safeRedirectPath } from '@/lib/safeRedirectPath'
import type { Job } from '@/payload-types'

describe('safeRedirectPath', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirectPath('/jobs/abc?x=1')).toBe('/jobs/abc?x=1')
  })

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', '', null, 42])(
    'rejects %s',
    (value) => {
      expect(safeRedirectPath(value)).toBe('/dashboard')
    },
  )
})

describe('rich text helpers', () => {
  it('round-trips paragraphs separated by blank lines', () => {
    const text = 'First paragraph.\n\nSecond paragraph.'
    expect(richTextToText(textToRichText(text))).toBe(text)
  })

  it('ignores extra blank lines and whitespace', () => {
    expect(textToRichText('  A \n\n\n\n B  ').root.children).toHaveLength(2)
  })
})

describe('JSON-LD', () => {
  it('escapes "<" so text cannot close the script tag', () => {
    const out = serializeJsonLd({ title: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('<')
    expect(JSON.parse(out).title).toBe('</script><script>alert(1)</script>')
  })

  it('builds a JobPosting with employment type and salary', () => {
    const job = {
      id: 1,
      title: 'Go Developer',
      slug: 'go-developer',
      description: textToRichText('Write Go.'),
      jobType: 'contract',
      workMode: 'remote',
      salaryMin: 1000,
      salaryMax: 2000,
      salaryCurrency: 'EUR',
      publishedAt: '2030-01-01T00:00:00.000Z',
      createdAt: '2030-01-01T00:00:00.000Z',
      company: { name: 'Acme', website: 'https://acme.example' },
    } as unknown as Job
    const ld = jobPostingJsonLd(job, 'https://jobs.example')
    expect(ld).toMatchObject({
      '@type': 'JobPosting',
      employmentType: 'CONTRACTOR',
      jobLocationType: 'TELECOMMUTE',
      hiringOrganization: { name: 'Acme', sameAs: 'https://acme.example' },
      baseSalary: { currency: 'EUR', value: { minValue: 1000, maxValue: 2000 } },
      url: 'https://jobs.example/jobs/go-developer',
    })
  })
})

describe('rateLimit', () => {
  it('allows up to the limit, then blocks, per key', () => {
    const key = `test-${Math.random()}`
    const results = Array.from({ length: 11 }, () => rateLimit('login', key))
    expect(results.slice(0, 10).every(Boolean)).toBe(true)
    expect(results[10]).toBe(false)
    // Another key (another IP) is not affected
    expect(rateLimit('login', `${key}-other`)).toBe(true)
  })
})
