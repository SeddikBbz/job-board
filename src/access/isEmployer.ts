import { checkRole, type BooleanAccess } from './checkRole'

export const isEmployer: BooleanAccess = ({ req: { user } }) => checkRole(user, ['employer'])
