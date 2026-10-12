import type { Payload, PayloadRequest } from 'payload'

import { CATEGORIES, LOCATIONS, POPULAR_SKILLS, SKILL_ALIASES } from '@/data/taxonomy'
import { matchKey } from '@/lib/normalize'
import { slugify } from '@/lib/slugify'

type Named = { id: number; name: string; aliases?: string[] | null }

// Builds a lookup from every spelling (name and aliases) to the record's id.
export function buildMatcher(records: Named[]) {
  const byKey = new Map<string, number>()
  for (const r of records) {
    for (const spelling of [r.name, ...(r.aliases ?? [])]) {
      const key = matchKey(spelling)
      if (key && !byKey.has(key)) byKey.set(key, r.id)
    }
  }
  return (text: string): number | undefined => byKey.get(matchKey(text))
}

// Splits free-text values into matched ids (no duplicates) and the values nothing matched.
export function matchAll(values: string[], match: (text: string) => number | undefined) {
  const ids: number[] = []
  const unmatched: string[] = []
  for (const value of values) {
    const id = match(value)
    if (id === undefined) unmatched.push(value)
    else if (!ids.includes(id)) ids.push(id)
  }
  return { ids, unmatched }
}

// Creates the starting categories, skills and cities. Idempotent: existing slugs are left alone,
// so running it twice (or after an admin edit) never duplicates or overwrites anything.
export async function seedTaxonomy(payload: Payload, req?: Partial<PayloadRequest>) {
  const context = { disableRevalidate: true }
  const existing = async (collection: 'skill-categories' | 'skills' | 'locations') => {
    const { docs } = await payload.find({ collection, limit: 0, pagination: false, depth: 0, req, context })
    return new Map(docs.map((d) => [d.slug as string, d.id]))
  }

  const categories = await existing('skill-categories')
  for (const [i, c] of CATEGORIES.entries()) {
    if (categories.has(slugify(c.name))) continue
    const doc = await payload.create({ collection: 'skill-categories', data: { name: c.name, icon: c.icon, order: i }, req, context })
    categories.set(doc.slug!, doc.id)
  }

  // A skill listed under several categories is one record linked to all of them
  const skillCategories = new Map<string, number[]>()
  for (const c of CATEGORIES) {
    for (const s of c.skills) skillCategories.set(s, [...(skillCategories.get(s) ?? []), categories.get(slugify(c.name))!])
  }
  const skills = await existing('skills')
  for (const [name, categoryIds] of skillCategories) {
    if (skills.has(slugify(name))) continue
    const popularIndex = POPULAR_SKILLS.indexOf(name)
    await payload.create({
      collection: 'skills',
      data: {
        name,
        categories: categoryIds,
        aliases: SKILL_ALIASES[name] ?? [],
        popular: popularIndex >= 0,
        order: popularIndex >= 0 ? popularIndex : 100,
      },
      req,
      context,
    })
  }

  const locations = await existing('locations')
  for (const l of LOCATIONS) {
    if (locations.has(slugify(l.name))) continue
    await payload.create({ collection: 'locations', data: l, req, context })
  }
}
