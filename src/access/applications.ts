import type { Access, Where } from 'payload'

import { checkRole } from './checkRole'

const forMyJobs = (userId: number): Where => ({ 'job.company.owner': { equals: userId } })

// Candidate: own applications. Employer: applications to their own jobs. Admin: all.
export const canReadApplications: Access = ({ req: { user } }) => {
  if (!user) return false
  if (checkRole(user, ['admin'])) return true
  if (checkRole(user, ['employer'])) return forMyJobs(user.id)
  const ownApplications: Where = { candidate: { equals: user.id } }
  return ownApplications
}

// Only the employer who owns the job (or an admin) can update an application.
export const canUpdateApplications: Access = ({ req: { user } }) => {
  if (!user) return false
  if (checkRole(user, ['admin'])) return true
  if (checkRole(user, ['employer'])) return forMyJobs(user.id)
  return false
}

// Candidate: own resumes. Employer: resumes attached to applications for their jobs. Admin: all.
export const canReadResumes: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false
  if (checkRole(user, ['admin'])) return true
  if (checkRole(user, ['employer'])) {
    const { docs } = await req.payload.find({
      collection: 'applications',
      where: forMyJobs(user.id),
      depth: 0,
      pagination: false,
      select: { resume: true },
      req,
    })
    const attachedToMyJobs: Where = { id: { in: docs.map((a) => a.resume as number) } }
    return attachedToMyJobs
  }
  const ownResumes: Where = { owner: { equals: user.id } }
  return ownResumes
}
