import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from 'payload'

import { checkRole } from '@/access/checkRole'
import { getModerationSettings } from '@/globals/SiteSettings'
import { queueEmail } from '@/lib/email/queue'
import { jobApprovedEmail, jobRejectedEmail, jobToReviewEmail } from '@/lib/email/templates'
import {
  decideJobStatus,
  DUPLICATE_WINDOW_DAYS,
  isMaterialEdit,
  sameTitle,
  spamFlags,
  type JobStatus,
} from '@/lib/moderation'
import { relationId } from '@/lib/relationId'
import { richTextToText } from '@/lib/richText'
import type { Company, Job, User } from '@/payload-types'

/**
 * Decides the real status of a job on every save (so it can't be skipped through the API):
 * spam checks, duplicate detection, the daily limit, and review for untrusted companies.
 * System code without a user (seed, scheduled tasks, report threshold) is trusted.
 */
export const moderateJob: CollectionBeforeChangeHook<Job> = async ({ context, data, originalDoc, operation, req }) => {
  if (!req.user || context.skipModeration) return data
  const isAdmin = checkRole(req.user, ['admin'])
  const merged = { ...originalDoc, ...data } as Job
  const companyId = relationId(merged.company)
  const company = (await req.payload.findByID({ collection: 'companies', id: companyId, depth: 1, req })) as Company
  const owner = typeof company.owner === 'object' ? (company.owner as User) : null
  const settings = await getModerationSettings(req.payload)

  const materialEdit = isMaterialEdit(originalDoc as Record<string, unknown> | undefined, data as Record<string, unknown>)
  const recheck = operation === 'create' || materialEdit

  if (operation === 'create' && !isAdmin) {
    const since = new Date(Date.now() - 86_400_000).toISOString()
    const { totalDocs } = await req.payload.count({
      collection: 'jobs',
      where: { company: { equals: companyId }, createdAt: { greater_than: since } },
      req,
    })
    if (totalDocs >= settings.dailyJobLimit) {
      throw new APIError(`You can post at most ${settings.dailyJobLimit} jobs per day. Please try again tomorrow.`, 429, undefined, true)
    }
  }

  let flags = merged.moderationFlags ?? []
  if (recheck) {
    flags = spamFlags({
      title: merged.title ?? '',
      description: richTextToText(merged.description),
      employerEmail: owner?.email,
      phrases: settings.spamPhrases,
      freeEmailDomains: settings.freeEmailDomains,
    })
    // Same company, same title, within a week: probably posted twice
    const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 86_400_000).toISOString()
    const { docs: recent } = await req.payload.find({
      collection: 'jobs',
      where: { company: { equals: companyId }, createdAt: { greater_than: since }, ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}) },
      select: { title: true },
      limit: 50,
      depth: 0,
      req,
    })
    if (recent.some((j) => sameTitle(j.title, merged.title ?? ''))) flags.push('Possible duplicate: same title posted in the last 7 days')
  }

  const status = decideJobStatus({
    requested: data.status as JobStatus | undefined,
    previous: originalDoc?.status as JobStatus | undefined,
    isAdmin,
    trusted: Boolean(company.trusted),
    flagged: flags.length > 0,
    materialEdit,
  })
  return { ...data, status, moderationFlags: flags, ...(status !== 'rejected' && !isAdmin ? { rejectionReason: null } : {}) }
}

// Emails about moderation: admins when a job waits, the employer when it is approved or rejected
export const moderationEmails: CollectionAfterChangeHook<Job> = async ({ doc, previousDoc, context, req }) => {
  if (context.disableEmails || doc.status === previousDoc?.status) return doc
  const company = await req.payload.findByID({ collection: 'companies', id: relationId(doc.company), depth: 1, req })
  const owner = typeof company.owner === 'object' ? (company.owner as User) : null

  if (doc.status === 'pending_review') {
    const { docs: admins } = await req.payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 20, depth: 0, req })
    for (const admin of admins) {
      await queueEmail(req, jobToReviewEmail({ to: admin.email, jobTitle: doc.title, companyName: company.name, flags: doc.moderationFlags ?? [] }))
    }
  }
  if (owner && previousDoc?.status === 'pending_review' && doc.status === 'published') {
    await queueEmail(req, jobApprovedEmail({ to: owner.email, name: owner.name, jobTitle: doc.title, slug: doc.slug ?? '' }))
  }
  if (owner && doc.status === 'rejected') {
    await queueEmail(req, jobRejectedEmail({ to: owner.email, name: owner.name, jobTitle: doc.title, reason: doc.rejectionReason ?? '' }))
  }
  return doc
}
