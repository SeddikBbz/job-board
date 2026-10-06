import type { CollectionBeforeChangeHook } from 'payload'

import { checkRole } from '@/access/checkRole'
import type { User } from '@/payload-types'

export const protectRole: CollectionBeforeChangeHook<User> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  // First-user bootstrap: the very first account becomes the admin.
  // Done in a hook because field-level access also runs for the first user.
  if (operation === 'create') {
    const { totalDocs } = await req.payload.count({ collection: 'users', req })
    if (totalDocs === 0) return { ...data, role: 'admin' }
  }

  if (checkRole(req.user, ['admin'])) return data

  // Public signup may only pick candidate or employer, never admin
  if (operation === 'create') {
    return { ...data, role: data.role === 'employer' ? 'employer' : 'candidate' }
  }

  // Non-admins can never change their role
  return { ...data, role: originalDoc?.role }
}
