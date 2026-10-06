import type { Field } from 'payload'

// Set by the `setOwner` hook. Not required at DB level so existing rows stay valid.
export const ownerField: Field = {
  name: 'owner',
  type: 'relationship',
  relationTo: 'users',
  admin: {
    position: 'sidebar',
    readOnly: true,
  },
}
