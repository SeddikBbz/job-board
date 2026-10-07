import type { Access, CollectionConfig } from 'payload'

import { checkRole } from '@/access/checkRole'
import { isAdmin } from '@/access/isAdmin'
import { isAdminOrSelf } from '@/access/isAdminOrSelf'
import { canReadUsers } from '@/access/users'
import { protectRole } from '@/hooks/protectRole'
import { resetPasswordEmail } from '@/lib/email/resetPassword'

// Public signup must go through our /register server action (Zod + Turnstile + rate limit),
// which uses the Local API. A direct POST /api/users would skip those checks, so REST and
// GraphQL signups are only allowed for admins. (The admin panel's "create first user" screen
// uses overrideAccess and is not affected.) The protectRole hook still restricts the role.
const canCreateUser: Access = ({ req }) => req.payloadAPI === 'local' || checkRole(req.user, ['admin'])

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
  },
  auth: {
    // Brute-force protection for every login path (server action and REST):
    // 5 wrong passwords lock the account for 10 minutes.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    forgotPassword: {
      generateEmailSubject: () => 'Reset your JobBoard password',
      generateEmailHTML: ({ token, user } = {}) =>
        resetPasswordEmail({ token: token ?? '', name: user?.name }),
    },
  },
  access: {
    // Only admins can open the admin panel
    admin: isAdmin,
    read: canReadUsers,
    create: canCreateUser,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [protectRole],
  },
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'candidate',
      access: {
        update: isAdmin,
      },
      options: [
        { label: 'Candidate', value: 'candidate' },
        { label: 'Employer', value: 'employer' },
        { label: 'Admin', value: 'admin' },
      ],
    },
  ],
}
