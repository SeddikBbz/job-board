import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'candidate',
      options: [
        { label: 'Candidate', value: 'candidate' },
        { label: 'Employer', value: 'employer' },
        { label: 'Admin', value: 'admin' },
      ],
    },
  ],
}
