import { checkRole, type BooleanAccess } from './checkRole'

export const isAdmin: BooleanAccess = ({ req: { user } }) => checkRole(user, ['admin'])
