import { checkRole, type BooleanAccess } from './checkRole'

export const isCandidate: BooleanAccess = ({ req: { user } }) => checkRole(user, ['candidate'])
