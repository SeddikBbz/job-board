import type { Access, Where } from 'payload'

import { checkRole } from './checkRole'

// Own user doc; employers also see candidates who applied to their jobs (name/email on the
// applicants page); admins see all. Payload itself hides auth internals such as `sessions`.
export const canReadUsers: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false
  if (checkRole(user, ['admin'])) return true

  const self: Where = { id: { equals: user.id } }
  if (!checkRole(user, ['employer'])) return self

  const { docs } = await req.payload.find({
    collection: 'applications',
    where: { 'job.company.owner': { equals: user.id } },
    depth: 0,
    pagination: false,
    select: { candidate: true },
    req,
  })
  const applicantIds = [...new Set(docs.map((a) => a.candidate as number))]
  const selfOrApplicants: Where = { or: [self, { id: { in: applicantIds } }] }
  return selfOrApplicants
}
