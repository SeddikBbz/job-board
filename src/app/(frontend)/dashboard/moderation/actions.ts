'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { checkRole } from '@/access/checkRole'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { relationId } from '@/lib/relationId'
import type { FormState } from '@/lib/validation/auth'

const decisionSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  decision: z.enum(['approve', 'approve-trust', 'reject']),
  reason: z.string().trim().max(1000).optional(),
})

// Approve or reject a job waiting for review (admins only). The jobs hooks send the emails,
// set publishedAt and refresh the public pages.
export async function moderateJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user || !checkRole(user, ['admin'])) return { error: 'Only admins can review jobs.' }
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid request.' }
  const { jobId, decision, reason } = parsed.data
  if (decision === 'reject' && !reason) {
    return { error: 'Explain to the employer why the job was rejected.', fieldErrors: { reason: ['A reason is required.'] } }
  }

  const payload = await getPayloadClient()
  const asAdmin = { user, overrideAccess: false } as const
  const job = await payload.update({
    collection: 'jobs',
    id: jobId,
    data: decision === 'reject' ? { status: 'rejected', rejectionReason: reason } : { status: 'published', rejectionReason: null },
    ...asAdmin,
  })
  if (decision === 'approve-trust') {
    await payload.update({ collection: 'companies', id: relationId(job.company), data: { trusted: true }, ...asAdmin })
  }
  revalidatePath('/dashboard/moderation')
  return { success: decision === 'reject' ? 'Job rejected; the employer was emailed.' : 'Job approved and published.' }
}
