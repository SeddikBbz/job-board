'use server'

import { revalidatePath } from 'next/cache'
import { createLocalReq } from 'payload'
import { z } from 'zod'

import { checkRole } from '@/access/checkRole'
import { getCurrentUser } from '@/lib/auth'
import { queueEmail } from '@/lib/email/queue'
import { reportActionEmail } from '@/lib/email/templates'
import { getPayloadClient } from '@/lib/payload'
import { relationId } from '@/lib/relationId'
import type { FormState } from '@/lib/validation/auth'
import type { Company, User } from '@/payload-types'

const schema = z.object({
  jobId: z.coerce.number().int().positive(),
  decision: z.enum(['dismiss', 'unpublish', 'ban']),
  note: z.string().trim().max(1000).optional(),
})

// Handles every open report about one job at once (admins only)
export async function handleJobReports(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user || !checkRole(user, ['admin'])) return { error: 'Only admins can handle reports.' }
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid request.' }
  const { jobId, decision, note } = parsed.data

  const payload = await getPayloadClient()
  const asAdmin = { user, overrideAccess: false } as const
  const job = await payload.findByID({ collection: 'jobs', id: jobId, depth: 2, ...asAdmin })
  const company = typeof job.company === 'object' ? (job.company as Company) : null
  const owner = company && typeof company.owner === 'object' ? (company.owner as User) : null

  if (decision === 'unpublish' || decision === 'ban') {
    await payload.update({ collection: 'jobs', id: jobId, data: { status: 'closed' }, ...asAdmin })
  }
  if (decision === 'ban' && owner) {
    // Banned: can't sign in or create anything, and every live job of the company is closed
    await payload.update({ collection: 'users', id: owner.id, data: { banned: true }, ...asAdmin })
    await payload.update({
      collection: 'jobs',
      where: { company: { equals: relationId(job.company) }, status: { equals: 'published' } },
      data: { status: 'closed' },
      ...asAdmin,
    })
  }
  await payload.update({
    collection: 'reports',
    where: { 'target.value': { equals: jobId }, 'target.relationTo': { equals: 'jobs' }, status: { in: ['open', 'reviewing'] } },
    data: { status: decision === 'dismiss' ? 'dismissed' : 'actioned', handledBy: user.id, resolutionNote: note },
    ...asAdmin,
  })
  if (decision !== 'dismiss' && owner) {
    await queueEmail(await createLocalReq({}, payload), reportActionEmail({ to: owner.email, name: owner.name, jobTitle: job.title, banned: decision === 'ban', note }))
  }
  revalidatePath('/dashboard/reports')
  return { success: { dismiss: 'Reports dismissed.', unpublish: 'Job unpublished; the employer was emailed.', ban: 'Employer banned and jobs closed.' }[decision] }
}
