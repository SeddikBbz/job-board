/**
 * Access control, tested through the Local API exactly like the app calls it on behalf of a
 * user: `{ user, overrideAccess: false }`. Needs DATABASE_URI. Creates and deletes its own data.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { daysFromNow, deleteTestData, pdfFile, richText, testContext } from '../helpers/fixtures'
import type { Application, Company, Job, Resume, User } from '@/payload-types'

const DOMAIN = '@int.test'
let payload: Payload
const as = (user: User) => ({ user, overrideAccess: false, context: testContext }) as const

let empA: User, empB: User, candA: User, candB: User
let companyA: Company
let publishedJob: Job, draftJob: Job
let resumeA: Resume, resumeB: Resume
let application: Application

beforeAll(async () => {
  payload = await getPayload({ config })
  await deleteTestData(payload, DOMAIN)

  // Setup runs as trusted server code (no user); the tests below run as each role
  const makeUser = (name: string, role: User['role']) =>
    payload.create({
      collection: 'users',
      data: { email: `${name}${DOMAIN}`, name, role, password: 'Password123!' },
      context: { ...testContext, skipRoleProtection: true },
    })
  ;[empA, empB, candA, candB] = await Promise.all([
    makeUser('emp-a', 'employer'),
    makeUser('emp-b', 'employer'),
    makeUser('cand-a', 'candidate'),
    makeUser('cand-b', 'candidate'),
  ])

  companyA = await payload.create({ collection: 'companies', data: { name: 'Int Co A', owner: empA.id }, context: testContext })
  await payload.create({ collection: 'companies', data: { name: 'Int Co B', owner: empB.id }, context: testContext })

  const job = (title: string, status: Job['status']) =>
    payload.create({
      collection: 'jobs',
      data: { title, company: companyA.id, description: richText('Testing access control.'), status, expiresAt: daysFromNow(30) },
      context: testContext,
    })
  ;[publishedJob, draftJob] = await Promise.all([job('Int Published', 'published'), job('Int Draft', 'draft')])

  resumeA = await payload.create({ collection: 'resumes', data: {}, file: pdfFile(), ...as(candA) })
  resumeB = await payload.create({ collection: 'resumes', data: {}, file: pdfFile(), ...as(candB) })
  application = await payload.create({
    collection: 'applications',
    data: { job: publishedJob.id, resume: resumeA.id, candidate: candA.id, status: 'applied' },
    ...as(candA),
  })
})

afterAll(async () => {
  if (payload) await deleteTestData(payload, DOMAIN)
})

describe('users', () => {
  it('public signup can never create an admin', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `sneaky${DOMAIN}`, name: 'Sneaky', role: 'admin', password: 'Password123!' },
      overrideAccess: false,
      context: testContext,
    })
    expect(user.role).toBe('candidate')
  })

  it('a candidate cannot read another user', async () => {
    expect(await payload.findByID({ collection: 'users', id: candB.id, disableErrors: true, ...as(candA) })).toBeNull()
  })

  it('a candidate cannot promote themselves', async () => {
    const updated = await payload.update({ collection: 'users', id: candA.id, data: { role: 'admin' }, ...as(candA) })
    expect(updated.role).toBe('candidate')
  })

  it('an employer can read their applicants, but not other candidates', async () => {
    expect(await payload.findByID({ collection: 'users', id: candA.id, disableErrors: true, ...as(empA) })).not.toBeNull()
    expect(await payload.findByID({ collection: 'users', id: candA.id, disableErrors: true, ...as(empB) })).toBeNull()
  })
})

describe('companies', () => {
  it('the owner can update their company', async () => {
    const updated = await payload.update({ collection: 'companies', id: companyA.id, data: { location: 'Oran' }, ...as(empA) })
    expect(updated.location).toBe('Oran')
  })

  it("another employer cannot update or delete it", async () => {
    await expect(payload.update({ collection: 'companies', id: companyA.id, data: { name: 'Hacked' }, ...as(empB) })).rejects.toThrow()
    await expect(payload.delete({ collection: 'companies', id: companyA.id, ...as(empB) })).rejects.toThrow()
  })

  it('an employer cannot create a second company', async () => {
    await expect(payload.create({ collection: 'companies', data: { name: 'Second', owner: empA.id }, ...as(empA) })).rejects.toThrow(
      'already have a company',
    )
  })

  it('a candidate cannot create a company', async () => {
    await expect(payload.create({ collection: 'companies', data: { name: 'Nope', owner: candA.id }, ...as(candA) })).rejects.toThrow()
  })
})

describe('jobs', () => {
  const publicFind = (id: number) =>
    payload.find({ collection: 'jobs', where: { id: { equals: id } }, overrideAccess: false, depth: 0 })

  it('the public sees published jobs but not drafts', async () => {
    expect((await publicFind(publishedJob.id)).totalDocs).toBe(1)
    expect((await publicFind(draftJob.id)).totalDocs).toBe(0)
  })

  it('the owner sees their own draft; other employers do not', async () => {
    expect(await payload.findByID({ collection: 'jobs', id: draftJob.id, disableErrors: true, ...as(empA) })).not.toBeNull()
    expect(await payload.findByID({ collection: 'jobs', id: draftJob.id, disableErrors: true, ...as(empB) })).toBeNull()
  })

  it("another employer cannot edit the job or post under someone else's company", async () => {
    await expect(payload.update({ collection: 'jobs', id: publishedJob.id, data: { title: 'Hacked' }, ...as(empB) })).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'jobs',
        data: { title: 'Steal', company: companyA.id, description: richText('x'), status: 'draft' },
        ...as(empB),
      }),
    ).rejects.toThrow()
  })

  it('a candidate cannot post a job', async () => {
    await expect(
      payload.create({
        collection: 'jobs',
        data: { title: 'Nope', company: companyA.id, description: richText('x'), status: 'draft' },
        ...as(candA),
      }),
    ).rejects.toThrow()
  })
})

describe('applications and resumes', () => {
  const findApplications = (user: User) =>
    payload.find({ collection: 'applications', where: { job: { equals: publishedJob.id } }, depth: 0, ...as(user) })

  it('each role only sees the applications it should', async () => {
    expect((await findApplications(candA)).totalDocs).toBe(1)
    expect((await findApplications(candB)).totalDocs).toBe(0)
    expect((await findApplications(empA)).totalDocs).toBe(1)
    expect((await findApplications(empB)).totalDocs).toBe(0)
  })

  it('a candidate cannot apply twice or with someone else\'s resume', async () => {
    const data = { job: publishedJob.id, resume: resumeA.id, candidate: candA.id, status: 'applied' as const }
    await expect(payload.create({ collection: 'applications', data, ...as(candA) })).rejects.toThrow('already applied')
    await expect(
      payload.create({ collection: 'applications', data: { ...data, candidate: candB.id }, ...as(candB) }),
    ).rejects.toThrow()
  })

  it('a candidate cannot apply to a draft job', async () => {
    await expect(
      payload.create({
        collection: 'applications',
        data: { job: draftJob.id, resume: resumeB.id, candidate: candB.id, status: 'applied' },
        ...as(candB),
      }),
    ).rejects.toThrow()
  })

  it('resumes are private: only the owner and the employer of the job can read them', async () => {
    const read = (user: User) => payload.findByID({ collection: 'resumes', id: resumeA.id, disableErrors: true, ...as(user) })
    expect(await read(candA)).not.toBeNull()
    expect(await read(empA)).not.toBeNull()
    expect(await read(candB)).toBeNull()
    expect(await read(empB)).toBeNull()
  })

  it('status changes follow the rules for each role', async () => {
    const setStatus = (user: User, status: Application['status']) =>
      payload.update({ collection: 'applications', id: application.id, data: { status }, ...as(user) })

    await expect(setStatus(candA, 'hired')).rejects.toThrow()
    await expect(setStatus(empB, 'reviewing')).rejects.toThrow()
    await expect(setStatus(empA, 'withdrawn')).rejects.toThrow('Only the candidate')
    expect((await setStatus(empA, 'reviewing')).status).toBe('reviewing')
    expect((await setStatus(candA, 'withdrawn')).status).toBe('withdrawn')
    await expect(setStatus(empA, 'interview')).rejects.toThrow('withdrew')
  })

  it('a candidate cannot change other fields of their application', async () => {
    const updated = await payload.update({
      collection: 'applications',
      id: application.id,
      data: { coverLetter: 'changed' },
      ...as(candA),
    })
    expect(updated.coverLetter ?? null).toBeNull()
  })
})
