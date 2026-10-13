import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

// Traceability records (who did what, when). Written only by server code; read-only for admins.
// Kept for the period set in Site settings, then removed by a scheduled task.
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: { useAsTitle: 'action', defaultColumns: ['action', 'summary', 'actor', 'createdAt'], group: 'Moderation' },
  access: { read: isAdmin, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'actor', type: 'relationship', relationTo: 'users', index: true },
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'collection', type: 'text', index: true },
    { name: 'documentId', type: 'text', index: true },
    { name: 'summary', type: 'text' },
  ],
}
