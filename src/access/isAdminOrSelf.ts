import type { Access } from 'payload'

import { checkRole } from './checkRole'

// Admins get everything; other users get a query filter that matches only their own document.
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (checkRole(user, ['admin'])) return true
  return { id: { equals: user.id } }
}
