import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
} from 'payload'

import { checkRole } from '@/access/checkRole'
import { isAdmin } from '@/access/isAdmin'
import { isAdminOrEmployer } from '@/access/isAdminOrEmployer'
import { isAdminOrOwner } from '@/access/isAdminOrOwner'
import { setOwner } from '@/hooks/setOwner'
import { uniqueSlug } from '@/hooks/uniqueSlug'

// Employers may own only one company; admins are not limited.
const oneCompanyPerEmployer: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !req.user || checkRole(req.user, ['admin'])) return data

  const { totalDocs } = await req.payload.count({
    collection: 'companies',
    where: { owner: { equals: req.user.id } },
    req,
  })
  if (totalDocs > 0) {
    throw new APIError('You already have a company. Edit it instead of creating a new one.', 400, undefined, true)
  }
  return data
}

// jobs.company is required, so a company with jobs cannot be deleted (the DB would reject it).
const preventDeleteWithJobs: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: 'jobs',
    where: { company: { equals: id } },
    req,
  })
  if (totalDocs > 0) {
    throw new APIError('This company still has jobs. Delete its jobs first.', 400, undefined, true)
  }
}

export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'size', 'owner'],
  },
  access: {
    read: () => true,
    create: isAdminOrEmployer,
    update: isAdminOrOwner,
    delete: isAdminOrOwner,
  },
  hooks: {
    // Order matters: owner must be set before the one-company check and validation
    beforeValidate: [setOwner, oneCompanyPerEmployer, uniqueSlug('name')],
    beforeDelete: [preventDeleteWithJobs],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Generated from the name if left empty.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'size',
      type: 'select',
      options: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      // Only employers can own a company
      filterOptions: { role: { equals: 'employer' } },
      access: {
        // Only admins can move a company to another owner
        update: isAdmin,
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
