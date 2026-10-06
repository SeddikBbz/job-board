import type { BooleanAccess } from './checkRole'

export const isLoggedIn: BooleanAccess = ({ req: { user } }) => Boolean(user)
