import { checkRole, type BooleanAccess } from './checkRole'

export const isAdminOrEmployer: BooleanAccess = ({ req: { user } }) =>
  checkRole(user, ['admin', 'employer'])
