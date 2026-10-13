import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { getModerationSettings } from '@/globals/SiteSettings'
import { REPORT_REASONS } from '@/lib/reportReasons'

export { REPORT_REASONS }

// When enough different people report the same live job, it goes back to review on its own.
const flagReportedJob: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || doc.target?.relationTo !== 'jobs') return doc
  const jobId = typeof doc.target.value === 'object' ? doc.target.value.id : doc.target.value
  const { docs } = await req.payload.find({
    collection: 'reports',
    where: { 'target.value': { equals: jobId }, 'target.relationTo': { equals: 'jobs' }, status: { in: ['open', 'reviewing'] } },
    select: { reporterKey: true },
    limit: 0,
    pagination: false,
    depth: 0,
    req,
  })
  const distinct = new Set(docs.map((r) => r.reporterKey)).size
  const { reportThreshold } = await getModerationSettings(req.payload)
  if (distinct < reportThreshold) return doc

  const job = await req.payload.findByID({ collection: 'jobs', id: jobId, depth: 0, req })
  if (job.status !== 'published') return doc
  // System update (no user): the moderation hook doesn't re-decide, the job simply waits for review
  await req.payload.update({
    collection: 'jobs',
    id: jobId,
    data: { status: 'pending_review', moderationFlags: [...(job.moderationFlags ?? []), `Reported by ${distinct} people`] },
    req,
    overrideAccess: true,
    context: { skipModeration: true },
  })
  return doc
}

// Reports from visitors. Created only through our server action (Turnstile + rate limit),
// never directly through the API; only admins can read or handle them.
export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: { useAsTitle: 'reason', defaultColumns: ['reason', 'target', 'status', 'createdAt'], group: 'Moderation' },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { afterChange: [flagReportedJob] },
  fields: [
    { name: 'target', type: 'relationship', relationTo: ['jobs', 'companies', 'users'], required: true, index: true },
    { name: 'reason', type: 'select', required: true, options: REPORT_REASONS.map((r) => ({ ...r })) },
    { name: 'details', type: 'textarea', maxLength: 2000 },
    // Logged-in reporter, if any
    { name: 'reporter', type: 'relationship', relationTo: 'users' },
    // Hash identifying the reporter (account or browser), to count distinct people; never shown
    { name: 'reporterKey', type: 'text', index: true, admin: { hidden: true } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      index: true,
      options: ['open', 'reviewing', 'actioned', 'dismissed'],
      admin: { position: 'sidebar' },
    },
    { name: 'handledBy', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
    { name: 'resolutionNote', type: 'textarea', admin: { position: 'sidebar' } },
  ],
}
