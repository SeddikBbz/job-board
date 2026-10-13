import type { User } from '@/payload-types'

// Applying, posting jobs, uploading files and reporting need a confirmed email address.
// Admins are always trusted.
export const isVerified = (user: Pick<User, 'role' | 'emailVerified' | 'banned'> | null | undefined): boolean =>
  Boolean(user && !user.banned && (user.role === 'admin' || user.emailVerified === true))

export const VERIFY_FIRST = 'Please confirm your email address first: check your inbox for the link.'

// Access rules: role AND confirmed email (admins pass)
import { checkRole, type BooleanAccess } from './checkRole'

export const isVerifiedCandidate: BooleanAccess = ({ req: { user } }) => checkRole(user, ['candidate']) && isVerified(user)
export const isVerifiedEmployerOrAdmin: BooleanAccess = ({ req: { user } }) =>
  checkRole(user, ['admin', 'employer']) && isVerified(user)
export const isVerifiedUser: BooleanAccess = ({ req: { user } }) => isVerified(user)
