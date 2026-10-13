/**
 * Skills and cities: idempotent seed, access rules, and the backfill of old free-text job data.
 * Needs DATABASE_URI. Creates and deletes its own data.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { daysFromNow, deleteTestData, richText, testContext } from '../helpers/fixtures'
import { backfillJobTaxonomy } from '@/lib/backfillJobTaxonomy'
import { seedTaxonomy } from '@/lib/taxonomy'
import type { User } from '@/payload-types'

const DOMAIN = '@taxonomy-int.test'
let payload: Payload
let employer: User

beforeAll(async () => {
  payload = await getPayload({ config })
  await deleteTestData(payload, DOMAIN)
  employer = await payload.create({
    collection: 'users',
    data: { email: `emp${DOMAIN}`, name: 'Tax Emp', role: 'employer', password: 'Password123!', emailVerified: true },
    context: { ...testContext, skipRoleProtection: true },
  })
})

afterAll(async () => {
  if (payload) await deleteTestData(payload, DOMAIN)
})

const count = async (collection: 'skills' | 'locations' | 'skill-categories') =>
  (await payload.count({ collection })).totalDocs

describe('seed', () => {
  it('is idempotent: running it twice creates no duplicates', async () => {
    await seedTaxonomy(payload)
    const before = await Promise.all([count('skills'), count('locations'), count('skill-categories')])
    await seedTaxonomy(payload)
    const after = await Promise.all([count('skills'), count('locations'), count('skill-categories')])
    expect(after).toEqual(before)
    expect(before[0]).toBeGreaterThan(100)
  })
})

describe('access', () => {
  it('anyone can read skills and cities', async () => {
    const { totalDocs } = await payload.find({ collection: 'locations', overrideAccess: false, limit: 1 })
    expect(totalDocs).toBeGreaterThan(58)
  })

  it('non-admins cannot create, edit or delete them', async () => {
    const as = { user: employer, overrideAccess: false, context: testContext } as const
    await expect(payload.create({ collection: 'skills', data: { name: 'Hacking' }, ...as })).rejects.toThrow()
    const { docs } = await payload.find({ collection: 'skills', where: { slug: { equals: 'react' } }, limit: 1 })
    await expect(payload.update({ collection: 'skills', id: docs[0].id, data: { name: 'X' }, ...as })).rejects.toThrow()
    await expect(payload.delete({ collection: 'skills', id: docs[0].id, ...as })).rejects.toThrow()
  })
})

describe('backfill of old free-text data', () => {
  it('maps "ReactJS" and "reactjs" to React once, keeps unknown values, and matches the city', async () => {
    const company = await payload.create({ collection: 'companies', data: { name: 'Tax Co', owner: employer.id }, context: testContext })
    // A job as it looked before the migration: only free text
    const job = await payload.create({
      collection: 'jobs',
      data: {
        title: 'Old style job',
        company: company.id,
        description: richText('Posted before skills existed.'),
        legacySkills: ['ReactJS', 'reactjs', 'Cobol 85'],
        location: 'Alger',
        status: 'draft',
        expiresAt: daysFromNow(30),
      },
      context: testContext,
    })

    await backfillJobTaxonomy(payload.db.drizzle, payload)
    // Running it again changes nothing
    await backfillJobTaxonomy(payload.db.drizzle, payload)

    const updated = await payload.findByID({ collection: 'jobs', id: job.id, depth: 1 })
    const names = (updated.skills ?? []).map((s) => (typeof s === 'object' ? s.name : s))
    expect(names).toEqual(['React'])
    expect(updated.legacySkills).toEqual(['Cobol 85'])
    expect(typeof updated.city === 'object' && updated.city?.name).toBe('Algiers')
    expect(updated.location).toBe('Alger')
  })
})
