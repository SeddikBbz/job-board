import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

// Editable content pages: privacy policy, terms of use, cookie policy (more later, e.g. /about)
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'updatedAt'], group: 'Content' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' } },
    { name: 'content', type: 'richText', required: true },
  ],
}
