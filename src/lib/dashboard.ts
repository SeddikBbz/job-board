import { notFound, redirect } from 'next/navigation'

import { requireUser } from './auth'
import { getPayloadClient } from './payload'
import { relationId } from './relationId'
import type { User } from '@/payload-types'

// Page guard: logged in AND one of the given roles (admins are always allowed).
export async function requireRole(roles: User['role'][], returnTo: string) {
  const user = await requireUser(returnTo)
  if (user.role !== 'admin' && !roles.includes(user.role)) redirect('/dashboard')
  return user
}

// Every query here runs as the user with access control on.
const as = (user: User) => ({ user, overrideAccess: false }) as const

export async function getMyApplications(user: User) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'applications',
    where: { candidate: { equals: user.id } },
    sort: '-createdAt',
    depth: 2,
    pagination: false,
    ...as(user),
  })
  return docs
}

export async function getMyCompany(user: User) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'companies',
    where: { owner: { equals: user.id } },
    limit: 1,
    depth: 1,
    ...as(user),
  })
  return docs[0] ?? null
}

// The employer's own jobs (any status) with how many people applied to each
export async function getMyJobs(user: User) {
  const payload = await getPayloadClient()
  const { docs: jobs } = await payload.find({
    collection: 'jobs',
    where: { 'company.owner': { equals: user.id } },
    sort: '-updatedAt',
    depth: 0,
    pagination: false,
    ...as(user),
  })
  const { docs: applications } = await payload.find({
    collection: 'applications',
    where: { job: { in: jobs.map((j) => j.id) } },
    depth: 0,
    pagination: false,
    select: { job: true },
    ...as(user),
  })
  const counts = new Map<number, number>()
  for (const a of applications) counts.set(relationId(a.job), (counts.get(relationId(a.job)) ?? 0) + 1)
  return jobs.map((job) => ({ job, applicants: counts.get(job.id) ?? 0 }))
}

// A job the user may manage: their own company's job (or any job for admins). 404 otherwise.
export async function getManagedJobOr404(user: User, id: string) {
  const jobId = Number(id)
  if (!Number.isInteger(jobId)) notFound()
  const payload = await getPayloadClient()
  const job = await payload.findByID({ collection: 'jobs', id: jobId, depth: 1, disableErrors: true, ...as(user) })
  // Employers can also *read* other companies' published jobs, so check ownership explicitly
  const ownerId = job && typeof job.company === 'object' ? relationId(job.company.owner) : null
  if (!job || (user.role !== 'admin' && ownerId !== user.id)) notFound()
  return job
}

export async function getApplicants(user: User, jobId: number) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'applications',
    where: { job: { equals: jobId } },
    sort: '-createdAt',
    depth: 1,
    pagination: false,
    ...as(user),
  })
  return docs
}
