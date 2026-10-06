import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

// Boolean-only access functions can be used for both collection access and field access.
export type BooleanAccess = (args: { req: PayloadRequest }) => boolean

export const checkRole = (user: User | null | undefined, roles: User['role'][]): boolean =>
  Boolean(user && roles.includes(user.role))
