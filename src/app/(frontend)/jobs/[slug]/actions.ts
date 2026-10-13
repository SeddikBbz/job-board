'use server'

import { APIError } from 'payload'
import { z } from 'zod'

import { REPORT_REASONS } from '@/lib/reportReasons'
import { getDeviceId } from '@/lib/device'
import { sha256 } from '@/lib/tokens'
import { verifyTurnstile } from '@/lib/turnstile'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { clientIp, rateLimit, TOO_MANY_REQUESTS } from '@/lib/rateLimit'
import { reportUnexpectedError } from '@/lib/reportError'
import { applySchema, MAX_RESUME_MB } from '@/lib/validation/application'
import type { FormState } from '@/lib/validation/auth'
import { isVerified, VERIFY_FIRST } from '@/access/isVerified'

// Known errors (validation, duplicates…) are shown as-is; anything else is logged and replaced by a friendly message
const publicMessage = (error: unknown, fallback: string) => {
  if (error instanceof APIError && error.isPublic) return error.message
  reportUnexpectedError(error, 'applyToJob')
  return fallback
}

export async function applyToJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const coverLetter = String(formData.get('coverLetter') ?? '')

  // Never trust the client: re-check the session and role on the server
  const user = await getCurrentUser()
  if (!user) return { error: 'Please log in to apply.' }
  if (user.role !== 'candidate') return { error: 'Only candidate accounts can apply to jobs.' }
  if (!isVerified(user)) return { error: VERIFY_FIRST }
  if (!rateLimit('apply', String(user.id))) return { error: TOO_MANY_REQUESTS, values: { coverLetter } }

  const parsed = applySchema.safeParse({
    jobId: formData.get('jobId'),
    coverLetter,
    resume: formData.get('resume'),
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: { coverLetter } }
  }
  const { jobId, resume: file } = parsed.data

  const payload = await getPayloadClient()
  // Every Local API call below runs as this user with access control on
  const asUser = { user, overrideAccess: false } as const

  const job = await payload.findByID({ collection: 'jobs', id: jobId, depth: 0, disableErrors: true, ...asUser })
  const expired = job?.expiresAt && new Date(job.expiresAt) <= new Date()
  if (!job || job.status !== 'published' || expired) {
    return { error: 'This job is no longer accepting applications.' }
  }

  const { totalDocs } = await payload.count({
    collection: 'applications',
    where: { and: [{ job: { equals: job.id } }, { candidate: { equals: user.id } }] },
    ...asUser,
  })
  if (totalDocs > 0) return { error: 'You have already applied to this job.' }

  let resumeId: number
  try {
    const resume = await payload.create({
      collection: 'resumes',
      data: {},
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: 'application/pdf',
        name: file.name,
        size: file.size,
      },
      ...asUser,
    })
    resumeId = resume.id
  } catch (error) {
    return {
      error: publicMessage(error, `Could not upload your resume. Make sure it is a valid PDF under ${MAX_RESUME_MB} MB.`),
      values: { coverLetter },
    }
  }

  try {
    await payload.create({
      collection: 'applications',
      // candidate and status are forced by a hook (logged-in user, "applied"); sent here only to satisfy the types
      data: {
        job: job.id,
        resume: resumeId,
        candidate: user.id,
        status: 'applied',
        coverLetter: parsed.data.coverLetter,
      },
      ...asUser,
    })
  } catch (error) {
    // Don't leave an orphan file behind. Candidates can't delete resumes, so this cleanup runs as the system.
    await payload.delete({ collection: 'resumes', id: resumeId, overrideAccess: true }).catch(() => {})
    return {
      error: publicMessage(error, 'Could not send your application. Please try again.'),
      values: { coverLetter },
    }
  }

  return { success: 'Your application was sent! The employer will review it soon.' }
}

const reportSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  reason: z.enum(REPORT_REASONS.map((r) => r.value) as [string, ...string[]], { message: 'Choose a reason.' }),
  details: z.string().trim().max(2000).optional(),
})

// "Report this job": anyone can report (logged-in users need a confirmed email). One open
// report per person per job; the human check and a rate limit stop scripted abuse.
export async function reportJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData)
  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const ip = await clientIp()
  if (!rateLimit('report', ip)) return { error: TOO_MANY_REQUESTS }
  if (!(await verifyTurnstile(raw.turnstileToken, ip))) return { error: 'Please complete the "I am human" check and try again.' }

  const user = await getCurrentUser()
  if (user && !isVerified(user)) return { error: VERIFY_FIRST }

  const payload = await getPayloadClient()
  // Only public jobs can be reported (public read rules)
  const job = await payload.findByID({ collection: 'jobs', id: parsed.data.jobId, depth: 0, overrideAccess: false, disableErrors: true })
  if (!job) return { error: 'This job is no longer available.' }

  const reporterKey = sha256(user ? `user:${user.id}` : `device:${await getDeviceId()}`)
  const { totalDocs } = await payload.count({
    collection: 'reports',
    where: { reporterKey: { equals: reporterKey }, 'target.value': { equals: job.id }, status: { in: ['open', 'reviewing'] } },
  })
  if (totalDocs === 0) {
    // Trusted server code: the reports collection itself can't be written through the API
    await payload.create({
      collection: 'reports',
      data: {
        target: { relationTo: 'jobs', value: job.id },
        reason: parsed.data.reason as (typeof REPORT_REASONS)[number]['value'],
        details: parsed.data.details,
        reporter: user?.id,
        reporterKey,
      },
      overrideAccess: true,
    })
  }
  return { success: 'Thanks. A moderator will look at this job.' }
}
