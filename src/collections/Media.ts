import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { isAdminOrEmployer } from '@/access/isAdminOrEmployer'
import { isAdminOrOwner } from '@/access/isAdminOrOwner'
import { ownerField } from '@/fields/owner'
import { setOwner } from '@/hooks/setOwner'

// Public images (company logos).
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: isAdminOrEmployer,
    update: isAdminOrOwner,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [setOwner],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    ownerField,
  ],
  upload: {
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
    // Resized with sharp (configured in payload.config.ts)
    imageSizes: [
      { name: 'thumbnail', width: 128, height: 128, position: 'centre' },
      { name: 'card', width: 400 },
    ],
  },
}
