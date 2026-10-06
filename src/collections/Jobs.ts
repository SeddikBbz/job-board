import {
  APIError,
  Forbidden,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
} from 'payload'

import { checkRole } from '@/access/checkRole'
import { isAdminOrEmployer } from '@/access/isAdminOrEmployer'
import { canReadJobs, isAdminOrCompanyOwner } from '@/access/jobs'
import { revalidateDeletedJob, revalidateJob } from '@/hooks/revalidateJob'
import { uniqueSlug } from '@/hooks/uniqueSlug'
import { relationId } from '@/lib/relationId'

// Employers can only attach jobs to a company they own. If none is sent on create, use theirs.
const checkCompanyOwnership: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (!data || !req.user || checkRole(req.user, ['admin'])) return data

  if (operation === 'create' && !data.company) {
    const { docs } = await req.payload.find({
      collection: 'companies',
      where: { owner: { equals: req.user.id } },
      limit: 1,
      depth: 0,
      req,
    })
    if (!docs[0]) {
      throw new APIError('Create your company before posting a job.', 400, undefined, true)
    }
    return { ...data, company: docs[0].id }
  }

  if (data.company) {
    const company = await req.payload.findByID({
      collection: 'companies',
      id: relationId(data.company),
      depth: 0,
      disableErrors: true,
      req,
    })
    if (!company || relationId(company.owner) !== req.user.id) throw new Forbidden(req.t)
  }
  return data
}

const validateJob: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const salaryMin = data.salaryMin ?? originalDoc?.salaryMin
  const salaryMax = data.salaryMax ?? originalDoc?.salaryMax
  if (salaryMin != null && salaryMax != null && salaryMax < salaryMin) {
    throw new APIError(
      'Maximum salary must be greater than or equal to minimum salary.',
      400,
      undefined,
      true,
    )
  }

  const status = data.status ?? originalDoc?.status
  const expiresAt = data.expiresAt ?? originalDoc?.expiresAt
  if (status === 'published' && expiresAt && new Date(expiresAt) <= new Date()) {
    throw new APIError('Expiry date must be in the future to publish.', 400, undefined, true)
  }
  return data
}

// Set once, the first time the job becomes published.
const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data.status === 'published' && !originalDoc?.publishedAt && !data.publishedAt) {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  return data
}

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'status', 'jobType', 'workMode', 'expiresAt'],
  },
  access: {
    read: canReadJobs,
    create: isAdminOrEmployer,
    update: isAdminOrCompanyOwner,
    delete: isAdminOrCompanyOwner,
  },
  hooks: {
    beforeValidate: [checkCompanyOwnership, uniqueSlug('title')],
    beforeChange: [validateJob, setPublishedAt],
    afterChange: [revalidateJob],
    afterDelete: [revalidateDeletedJob],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Generated from the title if left empty.' },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      index: true,
      // Employers can only pick their own company. Payload also enforces this on save.
      // No user means trusted server code (e.g. the seed), so no filter.
      filterOptions: ({ user }) =>
        !user || checkRole(user, ['admin']) ? true : { owner: { equals: user.id } },
    },
    { name: 'description', type: 'richText', required: true },
    { name: 'location', type: 'text' },
    {
      name: 'jobType',
      type: 'select',
      index: true,
      options: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'internship' },
      ],
    },
    {
      name: 'workMode',
      type: 'select',
      index: true,
      options: [
        { label: 'On-site', value: 'onsite' },
        { label: 'Hybrid', value: 'hybrid' },
        { label: 'Remote', value: 'remote' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'salaryMin', type: 'number', min: 0 },
        { name: 'salaryMax', type: 'number', min: 0 },
        { name: 'salaryCurrency', type: 'select', options: ['DZD', 'EUR', 'USD'] },
      ],
    },
    { name: 'skills', type: 'text', hasMany: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'expiresAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar' },
    },
  ],
}
