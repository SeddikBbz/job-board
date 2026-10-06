import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { isAdminOrSelf } from '@/access/isAdminOrSelf'
import { canReadUsers } from '@/access/users'
import { protectRole } from '@/hooks/protectRole'
import { resetPasswordEmail } from '@/lib/email/resetPassword'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
  },
  auth: {
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
    // Anyone can sign up; the role is restricted by a hook
    create: () => true,
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
