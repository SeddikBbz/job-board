import type { CollectionAfterChangeHook } from 'payload'

import { queueEmail } from '@/lib/email/queue'
import {
  applicationReceivedEmail,
  applicationWithdrawnEmail,
  newApplicantEmail,
  statusChangedEmail,
} from '@/lib/email/templates'
import { relationId } from '@/lib/relationId'
import type { Application } from '@/payload-types'

// Emails on new applications and status changes. Scripts (the seed) set context.disableEmails.
export const applicationEmails: CollectionAfterChangeHook<Application> = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context.disableEmails) return doc
  const statusChanged = operation === 'update' && previousDoc?.status !== doc.status
  if (operation !== 'create' && !statusChanged) return doc

  // System lookups (default overrideAccess) so we can address both sides of the application
  const [candidate, job] = await Promise.all([
    req.payload.findByID({ collection: 'users', id: relationId(doc.candidate), depth: 0, req }),
    req.payload.findByID({ collection: 'jobs', id: relationId(doc.job), depth: 2, req }),
  ])
  const company = typeof job.company === 'object' ? job.company : null
  const employer = company && typeof company.owner === 'object' ? company.owner : null
  const companyName = company?.name ?? 'the company'

  if (operation === 'create') {
    await queueEmail(
      req,
      applicationReceivedEmail({ to: candidate.email, candidateName: candidate.name, jobTitle: job.title, companyName }),
    )
    if (employer) {
      await queueEmail(
        req,
        newApplicantEmail({
          to: employer.email,
          employerName: employer.name,
          candidateName: candidate.name,
          jobTitle: job.title,
          jobId: job.id,
        }),
      )
    }
    return doc
  }

  if (doc.status === 'withdrawn') {
    if (employer) {
      await queueEmail(
        req,
        applicationWithdrawnEmail({
          to: employer.email,
          employerName: employer.name,
          candidateName: candidate.name,
          jobTitle: job.title,
          jobId: job.id,
        }),
      )
    }
    return doc
  }

  await queueEmail(
    req,
    statusChangedEmail({
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title,
      companyName,
      status: doc.status,
    }),
  )
  return doc
}
