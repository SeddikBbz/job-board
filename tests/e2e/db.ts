import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'

// Direct database access from the test process, for setup steps that aren't what a test is
// about (the moderation test itself goes through the admin screens).
let instance: Promise<Payload> | null = null
const db = () => (instance ??= getPayload({ config }))

// Approves a job waiting for review, as a moderator would
export async function approveJob(title: string) {
  const payload = await db()
  const { docs } = await payload.find({ collection: 'jobs', where: { title: { equals: title } }, limit: 1, depth: 0 })
  if (!docs[0]) throw new Error(`No job "${title}"`)
  await payload.update({ collection: 'jobs', id: docs[0].id, data: { status: 'published' }, context: { skipModeration: true } })
}

// An admin account for the moderation test (an @e2e.test email, removed by the teardown)
export async function createAdmin(email: string, password: string) {
  const payload = await db()
  await payload.create({
    collection: 'users',
    data: { email, password, name: 'E2E Admin', role: 'admin', emailVerified: true },
    context: { skipRoleProtection: true },
  })
}

export async function getUserByEmail(email: string) {
  const payload = await db()
  const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0 })
  return docs[0]
}
