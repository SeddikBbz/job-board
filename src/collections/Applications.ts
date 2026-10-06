import { APIError, Forbidden, type CollectionBeforeValidateHook, type CollectionConfig } from 'payload'

import { canReadApplications, canUpdateApplications } from '@/access/applications'
import { checkRole } from '@/access/checkRole'
import { isAdmin } from '@/access/isAdmin'
import { isAdminOrEmployer } from '@/access/isAdminOrEmployer'
import { isCandidate } from '@/access/isCandidate'
import { relationId } from '@/lib/relationId'

// On create, the candidate is always the logged-in user and the status always starts at "applied".
const setCandidate: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== 'create' || !data || !req.user || checkRole(req.user, ['admin'])) return data
  return { ...data, candidate: req.user.id, status: 'applied' }
}

const validateApplication: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data?.job || !data.candidate) return data

  const jobId = relationId(data.job)
  const candidateId = relationId(data.candidate)

  // Friendly error first; the unique index below is the real guarantee.
  const { totalDocs } = await req.payload.count({
    collection: 'applications',
    where: { and: [{ job: { equals: jobId } }, { candidate: { equals: candidateId } }] },
    req,
  })
  if (totalDocs > 0) throw new APIError('You have already applied to this job.', 400, undefined, true)

  // Admins (and the seed) may create applications for any job
  if (!req.user || checkRole(req.user, ['admin'])) return data

  const job = await req.payload.findByID({
    collection: 'jobs',
    id: jobId,
    depth: 0,
    disableErrors: true,
    req,
  })
  const expired = job?.expiresAt && new Date(job.expiresAt) <= new Date()
  if (!job || job.status !== 'published' || expired) {
    throw new APIError('This job is not accepting applications.', 400, undefined, true)
  }

  if (data.resume) {
    const resume = await req.payload.findByID({
      collection: 'resumes',
      id: relationId(data.resume),
      depth: 0,
      disableErrors: true,
      req,
    })
    if (!resume || relationId(resume.owner) !== candidateId) throw new Forbidden(req.t)
  }
  return data
}

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    defaultColumns: ['job', 'candidate', 'status', 'createdAt'],
  },
  access: {
    read: canReadApplications,
    create: isCandidate,
    update: canUpdateApplications,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [setCandidate, validateApplication],
  },
  // One application per candidate per job, enforced by the database
  indexes: [{ fields: ['job', 'candidate'], unique: true }],
  fields: [
    {
      name: 'job',
      type: 'relationship',
      relationTo: 'jobs',
      required: true,
      index: true,
      access: { update: isAdmin },
    },
    {
      name: 'candidate',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: { update: isAdmin },
    },
    {
      name: 'resume',
      type: 'relationship',
      relationTo: 'resumes',
      required: true,
      access: { update: isAdmin },
    },
    {
      name: 'coverLetter',
      type: 'textarea',
      access: { update: isAdmin },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'applied',
      index: true,
      // Collection access already limits updates to the job's employer or an admin
      access: { update: isAdminOrEmployer },
      options: [
        { label: 'Applied', value: 'applied' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Interview', value: 'interview' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Hired', value: 'hired' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
