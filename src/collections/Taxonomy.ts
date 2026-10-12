import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { revalidateTaxonomy } from '@/hooks/revalidateTaxonomy'
import { uniqueSlug } from '@/hooks/uniqueSlug'
import { buildSearchText } from '@/lib/normalize'

// Skills, categories and cities: anyone can read them, only admins edit them.
const access = { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin }

const slugField: Field = { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar' } }
const orderField: Field = { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } }
const aliasesField: Field = {
  name: 'aliases',
  type: 'text',
  hasMany: true,
  admin: { description: 'Other spellings people type, e.g. "reactjs" for React, "Alger" for Algiers.' },
}
// Filled by a hook; searched by filters and suggestions
const searchTextField: Field = { name: 'searchText', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar' } }

const fillSearchText: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const name = data.name ?? originalDoc?.name
  const aliases: string[] = data.aliases ?? originalDoc?.aliases ?? []
  return { ...data, searchText: buildSearchText(name, ...aliases) }
}

export const SkillCategories: CollectionConfig = {
  slug: 'skill-categories',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'order'], group: 'Taxonomy' },
  access,
  defaultSort: 'order',
  hooks: { beforeValidate: [uniqueSlug('name')], afterChange: [revalidateTaxonomy] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    { name: 'icon', type: 'text', admin: { description: 'Lucide icon name, e.g. "code-2".' } },
    orderField,
  ],
}

export const Skills: CollectionConfig = {
  slug: 'skills',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'categories', 'popular'], group: 'Taxonomy' },
  access,
  defaultSort: 'order',
  hooks: { beforeValidate: [uniqueSlug('name')], beforeChange: [fillSearchText], afterChange: [revalidateTaxonomy] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    // Many-to-many: Python or SQL belong to several fields
    { name: 'categories', type: 'relationship', relationTo: 'skill-categories', hasMany: true, index: true },
    aliasesField,
    { name: 'popular', type: 'checkbox', defaultValue: false, index: true },
    orderField,
    searchTextField,
  ],
}

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'region', 'country'], group: 'Taxonomy' },
  access,
  defaultSort: 'order',
  hooks: { beforeValidate: [uniqueSlug('name')], beforeChange: [fillSearchText], afterChange: [revalidateTaxonomy] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    { name: 'country', type: 'text', defaultValue: 'Algeria', index: true },
    // For Algeria: the wilaya
    { name: 'region', type: 'text' },
    aliasesField,
    { name: 'isRemote', type: 'checkbox', defaultValue: false, admin: { description: 'The "Remote" entry.' } },
    orderField,
    searchTextField,
  ],
}
