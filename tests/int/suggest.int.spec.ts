/**
 * Live search suggestions: only public jobs, group limits, spelling-insensitive matching, speed.
 * Needs DATABASE_URI. Creates and deletes its own data.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { daysFromNow, deleteTestData, richText, testContext } from '../helpers/fixtures'
import { getSuggestions, LIMITS } from '@/lib/suggest'
import { seedTaxonomy } from '@/lib/taxonomy'

const DOMAIN = '@suggest-int.test'
// A word no real job contains, so only our test jobs match
const WORD = `Zorblax${Date.now()}`
let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
  await deleteTestData(payload, DOMAIN)
  await seedTaxonomy(payload)
  const owner = await payload.create({
    collection: 'users',
    data: { email: `emp${DOMAIN}`, name: 'Sug Emp', role: 'employer', password: 'Password123!' },
    context: { ...testContext, skipRoleProtection: true },
  })
  const company = await payload.create({ collection: 'companies', data: { name: `${WORD} Co`, owner: owner.id }, context: testContext })
  const job = (title: string, status: 'published' | 'draft' | 'closed', expiresAt = daysFromNow(30)) =>
    payload.create({
      collection: 'jobs',
      data: { title, company: company.id, description: richText('Suggestions test.'), status, expiresAt },
      context: testContext,
    })
  for (let i = 0; i < 7; i++) await job(`${WORD} Engineer ${i}`, 'published')
  await job(`${WORD} Draft role`, 'draft')
  await job(`${WORD} Closed role`, 'closed')
})

afterAll(async () => {
  if (payload) await deleteTestData(payload, DOMAIN)
})

describe('getSuggestions', () => {
  it('returns only published, non-expired jobs, at most 5', async () => {
    const { jobs } = await getSuggestions(payload, WORD.toLowerCase())
    expect(jobs).toHaveLength(LIMITS.jobs)
    expect(jobs.every((j) => j.title.includes('Engineer'))).toBe(true)
    expect(jobs[0].company).toBe(`${WORD} Co`)
  })

  it('finds the same city for "alger", "Alger" and "algiers"', async () => {
    const names = await Promise.all(['alger', 'Alger', 'algiers'].map(async (q) => (await getSuggestions(payload, q)).locations[0]?.name))
    expect(names).toEqual(['Algiers', 'Algiers', 'Algiers'])
  })

  it('finds a skill by its alias, with its category', async () => {
    const { skills } = await getSuggestions(payload, 'reactjs')
    expect(skills[0]).toMatchObject({ name: 'React', category: 'Frontend' })
  })

  it('returns popular suggestions for an empty query', async () => {
    const result = await getSuggestions(payload, '')
    expect(result.skills.length).toBeGreaterThan(0)
    expect(result.popular?.length).toBeGreaterThan(0)
  })

  it('answers quickly (generous budget for a remote database)', async () => {
    await getSuggestions(payload, 'dev') // warm up
    const start = performance.now()
    await getSuggestions(payload, 'dev')
    expect(performance.now() - start).toBeLessThan(3000)
  })
})
