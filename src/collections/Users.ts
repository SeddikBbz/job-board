import type { Access, CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'

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

// Accounts created by an admin (admin panel or REST) are trusted: no verification email needed
const verifyAdminCreated: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === 'create' && checkRole(req.user, ['admin'])) {
    return { ...data, emailVerified: true, emailVerifiedAt: new Date().toISOString() }
  }
  return data
}

// Only trusted server code (overrideAccess) and admins may change these
const adminOnly = { create: isAdmin, update: isAdmin }
// Secrets and device data: never returned by any API, only read by our server code
const secret = (name: string, type: 'text' | 'date' | 'number' = 'text', extra: Partial<Field> = {}): Field =>
  ({ name, type, hidden: true, ...extra }) as Field

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
    beforeChange: [protectRole, verifyAdminCreated],
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
    // --- email verification (own flag: unverified users can sign in, but not apply/post/upload/report)
    { name: 'emailVerified', type: 'checkbox', defaultValue: false, access: adminOnly, admin: { position: 'sidebar' } },
    { name: 'emailVerifiedAt', type: 'date', access: adminOnly, admin: { position: 'sidebar', readOnly: true } },
    secret('verificationTokenHash', 'text', { index: true }),
    secret('verificationExpires', 'date'),
    secret('verificationSentAt', 'date'),
    // --- new-device sign-in check: hashes of this user's trusted browsers, and the pending code
    secret('knownDevices', 'text', { hasMany: true } as Partial<Field>),
    secret('loginCodeHash'),
    secret('loginCodeDevice'),
    secret('loginCodeExpires', 'date'),
    secret('loginCodeSentAt', 'date'),
    secret('loginCodeAttempts', 'number'),
    // Set by an admin (from a report): the account can't sign in or create anything
    { name: 'banned', type: 'checkbox', defaultValue: false, access: adminOnly, admin: { position: 'sidebar' } },
    // --- terms accepted at sign-up (which version, and when)
    { name: 'termsAcceptedAt', type: 'date', access: adminOnly, admin: { position: 'sidebar', readOnly: true } },
    { name: 'termsVersion', type: 'text', access: adminOnly, admin: { position: 'sidebar', readOnly: true } },
  ],
}
