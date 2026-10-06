import type { Access, Where } from 'payload'

import { checkRole } from './checkRole'

// Published and not expired (no expiry date, or expiry in the future).
export const publicJobsWhere = (): Where => ({
  and: [
    { status: { equals: 'published' } },
    {
      or: [
        { expiresAt: { exists: false } },
        { expiresAt: { greater_than: new Date().toISOString() } },
      ],
    },
  ],
})

// Public: published only. Employer: also all of their own jobs. Admin: all.
export const canReadJobs: Access = ({ req: { user } }) => {
  if (checkRole(user, ['admin'])) return true
  if (user && checkRole(user, ['employer'])) {
    return { or: [publicJobsWhere(), { 'company.owner': { equals: user.id } }] }
  }
  return publicJobsWhere()
}

// Admin, or the owner of the job's company.
export const isAdminOrCompanyOwner: Access = ({ req: { user } }) => {
  if (!user) return false
  if (checkRole(user, ['admin'])) return true
  return { 'company.owner': { equals: user.id } }
}
