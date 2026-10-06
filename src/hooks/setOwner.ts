import type { CollectionBeforeChangeHook } from 'payload'

import { checkRole } from '@/access/checkRole'

// On create, the owner is always the logged-in user (never trusted from the client).
// Admins may set another owner explicitly from the admin panel.
export const setOwner: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== 'create' || !req.user) return data
  if (checkRole(req.user, ['admin']) && data.owner) return data
  return { ...data, owner: req.user.id }
}
