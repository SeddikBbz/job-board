'use server'

import { APIError } from 'payload'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit, TOO_MANY_REQUESTS } from '@/lib/rateLimit'
import { applySchema } from '@/lib/validation/application'
import type { FormState } from '@/lib/validation/auth'

const publicMessage = (error: unknown, fallback: string) =>
  error instanceof APIError && error.isPublic ? error.message : fallback

export async function applyToJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const coverLetter = String(formData.get('coverLetter') ?? '')

  // Never trust the client: re-check the session and role on the server
  const user = await getCurrentUser()
  if (!user) return { error: 'Please log in to apply.' }
  if (user.role !== 'candidate') return { error: 'Only candidate accounts can apply to jobs.' }
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
      error: publicMessage(error, 'Could not upload your resume. Make sure it is a valid PDF under 5 MB.'),
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
