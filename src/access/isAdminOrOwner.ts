import type { Access } from 'payload'

import { checkRole } from './checkRole'

// Admins get everything; others only documents whose `owner` field is themselves.
export const isAdminOrOwner: Access = ({ req: { user } }) => {
  if (!user) return false
  if (checkRole(user, ['admin'])) return true
  return { owner: { equals: user.id } }
}
