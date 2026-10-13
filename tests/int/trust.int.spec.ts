/**
 * Trust and safety: email verification, moderation, reports and the new-device sign-in check.
 * Runs as real users through the Local API ({ user, overrideAccess: false }). Needs DATABASE_URI.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { daysFromNow, deleteTestData, pdfFile, richText, testContext } from '../helpers/fixtures'
import { checkDevice, confirmEmail, sendVerificationEmail } from '@/lib/accountSecurity'
import { sha256 } from '@/lib/tokens'
import type { Company, User } from '@/payload-types'

const DOMAIN = '@trust-int.test'
let payload: Payload
let admin: User, employer: User, trustedEmployer: User, verifiedCandidate: User, unverifiedCandidate: User, unverifiedEmployer: User
let company: Company, trustedCompany: Company
const as = (user: User) => ({ user, overrideAccess: false, context: testContext }) as const
const DESCRIPTION = richText('Build and run our platform with a friendly team. Hybrid work in Algiers, good salary and training.')

beforeAll(async () => {
  payload = await getPayload({ config })
  await deleteTestData(payload, DOMAIN)
  const makeUser = (name: string, role: User['role'], emailVerified: boolean) =>
    payload.create({
      collection: 'users',
      data: { email: `${name}${DOMAIN}`, name, role, password: 'Password123!', emailVerified },
      context: { ...testContext, skipRoleProtection: true },
    })
  ;[admin, employer, trustedEmployer, verifiedCandidate, unverifiedCandidate, unverifiedEmployer] = await Promise.all([
    makeUser('admin', 'admin', true),
    makeUser('emp', 'employer', true),
    makeUser('trusted-emp', 'employer', true),
    makeUser('cand', 'candidate', true),
    makeUser('cand-unverified', 'candidate', false),
    makeUser('emp-unverified', 'employer', false),
  ])
  company = await payload.create({ collection: 'companies', data: { name: 'Trust Int Co', owner: employer.id }, context: testContext })
  trustedCompany = await payload.create({ collection: 'companies', data: { name: 'Trusted Int Co', owner: trustedEmployer.id, trusted: true }, context: testContext })
  await payload.create({ collection: 'companies', data: { name: 'Unverified Int Co', owner: unverifiedEmployer.id }, context: testContext })
})

afterAll(async () => {
  if (!payload) return
  // Reports aren't owned by a test user, so remove the ones about this file's jobs first
  const { docs: jobs } = await payload.find({ collection: 'jobs', where: { 'company.owner.email': { like: DOMAIN } }, depth: 0, limit: 0, pagination: false })
  if (jobs.length) {
    await payload.delete({ collection: 'reports', where: { 'target.value': { in: jobs.map((j) => j.id) } }, context: testContext })
  }
  await deleteTestData(payload, DOMAIN)
})

const postAs = (user: User, companyId: number, title: string) =>
  payload.create({
    collection: 'jobs',
    data: { title, company: companyId, description: DESCRIPTION, status: 'published', expiresAt: daysFromNow(30) },
    ...as(user),
  })

describe('email verification gates', () => {
  it('an unverified employer cannot post; a verified one can', async () => {
    await expect(postAs(unverifiedEmployer, company.id, 'Nope')).rejects.toThrow()
    await expect(postAs(employer, company.id, `Allowed ${Date.now()}`)).resolves.toBeTruthy()
  })

  it('an unverified candidate cannot upload a resume or apply', async () => {
    await expect(payload.create({ collection: 'resumes', data: {}, file: pdfFile(), ...as(unverifiedCandidate) })).rejects.toThrow()
    await expect(payload.create({ collection: 'resumes', data: {}, file: pdfFile(), ...as(verifiedCandidate) })).resolves.toBeTruthy()
  })

  it('the email link verifies the account once, then stops working', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `link${DOMAIN}`, name: 'Link', role: 'candidate', password: 'Password123!' },
      context: testContext,
    })
    expect(user.emailVerified).toBe(false)
    await sendVerificationEmail(payload, user.id)
    // The real token only exists in the email; store a known one the same way the server does
    await payload.update({ collection: 'users', id: user.id, data: { verificationTokenHash: sha256('known-token') }, overrideAccess: true })
    expect((await confirmEmail(payload, 'known-token'))?.emailVerified).toBe(true)
    expect(await confirmEmail(payload, 'known-token')).toBeNull()
    expect(await confirmEmail(payload, 'wrong')).toBeNull()
  })
})

describe('moderation', () => {
  it('an untrusted company goes to review; a trusted one publishes directly', async () => {
    const pending = await postAs(employer, company.id, `Review me ${Date.now()}`)
    expect(pending.status).toBe('pending_review')
    const live = await postAs(trustedEmployer, trustedCompany.id, `Live ${Date.now()}`)
    expect(live.status).toBe('published')
  })

  it('a spam phrase sends even a trusted company to review, with the reason', async () => {
    const job = await payload.create({
      collection: 'jobs',
      data: { title: `Easy money ${Date.now()}`, company: trustedCompany.id, description: richText('Great job, just pay to apply and send money by western union first.'), status: 'published', expiresAt: daysFromNow(30) },
      ...as(trustedEmployer),
    })
    expect(job.status).toBe('pending_review')
    expect(job.moderationFlags?.join(' ')).toMatch(/pay to apply/)
  })

  it('employers cannot approve their own job or set trusted', async () => {
    const job = await postAs(employer, company.id, `Self approve ${Date.now()}`)
    const after = await payload.update({ collection: 'jobs', id: job.id, data: { status: 'rejected' }, ...as(employer) })
    expect(after.status).toBe('pending_review')
    const co = await payload.update({ collection: 'companies', id: company.id, data: { trusted: true }, ...as(employer) })
    expect(co.trusted).toBe(false)
  })

  it('public reads never return draft, review or rejected jobs', async () => {
    const job = await postAs(employer, company.id, `Hidden ${Date.now()}`)
    const pub = await payload.find({ collection: 'jobs', where: { id: { equals: job.id } }, overrideAccess: false })
    expect(pub.totalDocs).toBe(0)
  })

  it('an admin approves (publishedAt set) or rejects (reason kept)', async () => {
    const a = await postAs(employer, company.id, `Approve ${Date.now()}`)
    const approved = await payload.update({ collection: 'jobs', id: a.id, data: { status: 'published' }, ...as(admin) })
    expect(approved.status).toBe('published')
    expect(approved.publishedAt).toBeTruthy()

    const b = await postAs(employer, company.id, `Reject ${Date.now()}`)
    const rejected = await payload.update({ collection: 'jobs', id: b.id, data: { status: 'rejected', rejectionReason: 'Missing salary' }, ...as(admin) })
    expect(rejected.status).toBe('rejected')
    expect(rejected.rejectionReason).toBe('Missing salary')
  })
})

describe('reports', () => {
  it('non-admins cannot read reports', async () => {
    await expect(payload.find({ collection: 'reports', ...as(employer) })).rejects.toThrow()
  })

  it('3 distinct reports send a live job back to review', async () => {
    const job = await postAs(trustedEmployer, trustedCompany.id, `Reported ${Date.now()}`)
    expect(job.status).toBe('published')
    for (const key of ['a', 'b', 'c']) {
      await payload.create({
        collection: 'reports',
        data: { target: { relationTo: 'jobs', value: job.id }, reason: 'scam', reporterKey: `${key}-${job.id}` },
        context: testContext,
      })
    }
    const after = await payload.findByID({ collection: 'jobs', id: job.id })
    expect(after.status).toBe('pending_review')
    expect(after.moderationFlags?.join(' ')).toMatch(/Reported by 3 people/)
  })
})

describe('new-device sign-in check', () => {
  it('trusts the first browser, then asks for a code on another one', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `device${DOMAIN}`, name: 'Device', role: 'candidate', password: 'Password123!', emailVerified: true },
      context: testContext,
    })
    expect(await checkDevice(payload, user.id, 'browser-1')).toEqual({ ok: true })
    expect(await checkDevice(payload, user.id, 'browser-1')).toEqual({ ok: true })
    expect(await checkDevice(payload, user.id, 'browser-2')).toEqual({ ok: false, reason: 'code-sent' })
    expect(await checkDevice(payload, user.id, 'browser-2', '000000')).toMatchObject({ ok: false })

    // Set a known code the same way the server stores it, then use it
    await payload.update({ collection: 'users', id: user.id, data: { loginCodeHash: sha256(`${user.id}:123456`), loginCodeAttempts: 0 }, overrideAccess: true })
    expect(await checkDevice(payload, user.id, 'browser-2', '123456')).toEqual({ ok: true })
    expect(await checkDevice(payload, user.id, 'browser-2')).toEqual({ ok: true })
  })
})
