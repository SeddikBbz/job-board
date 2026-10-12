import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import { buildMatcher, matchAll } from '@/lib/taxonomy'

// Minimal shape of the Drizzle database/transaction handed to migrations
type Db = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: Record<string, unknown>[] }> }

/**
 * Links existing jobs to the skills and cities lists, from their old free text.
 * - legacySkills values that match a skill (name or alias) become `skills` links and are removed
 *   from legacySkills; anything unmatched stays there for an admin to review. Nothing is lost.
 * - `location` text that matches a city fills `city` (the text itself is kept).
 * Plain SQL on purpose: no hooks run (no emails, no cache revalidation). Safe to run twice.
 */
export async function backfillJobTaxonomy(db: Db, payload: Payload, req?: Partial<PayloadRequest>) {
  const find = (collection: 'skills' | 'locations') =>
    payload.find({ collection, limit: 0, pagination: false, depth: 0, req }).then((r) => r.docs)
  const matchSkill = buildMatcher(await find('skills'))
  const matchCity = buildMatcher(await find('locations'))

  // --- skills ---
  const { rows: texts } = await db.execute(
    sql`SELECT id, parent_id, text FROM jobs_texts WHERE path = 'legacySkills' ORDER BY parent_id, "order"`,
  )
  const byJob = new Map<number, { id: number; text: string }[]>()
  for (const row of texts) {
    const jobId = Number(row.parent_id)
    byJob.set(jobId, [...(byJob.get(jobId) ?? []), { id: Number(row.id), text: String(row.text ?? '') }])
  }

  let linked = 0
  for (const [jobId, values] of byJob) {
    const { rows: existing } = await db.execute(
      sql`SELECT skills_id FROM jobs_rels WHERE parent_id = ${jobId} AND path = 'skills'`,
    )
    const already = new Set(existing.map((r) => Number(r.skills_id)))
    const { ids } = matchAll(values.map((v) => v.text), matchSkill)
    let order = already.size + 1
    for (const skillId of ids) {
      if (already.has(skillId)) continue
      await db.execute(
        sql`INSERT INTO jobs_rels ("order", parent_id, path, skills_id) VALUES (${order++}, ${jobId}, 'skills', ${skillId})`,
      )
      linked++
    }
    // Matched values are now real links; drop them from the legacy list
    const matchedRowIds = values.filter((v) => matchSkill(v.text) !== undefined).map((v) => v.id)
    for (const id of matchedRowIds) await db.execute(sql`DELETE FROM jobs_texts WHERE id = ${id}`)
  }

  // --- cities ---
  const { rows: jobs } = await db.execute(sql`SELECT id, location FROM jobs WHERE city_id IS NULL AND location IS NOT NULL`)
  let cities = 0
  for (const job of jobs) {
    const cityId = matchCity(String(job.location))
    if (cityId === undefined) continue
    await db.execute(sql`UPDATE jobs SET city_id = ${cityId} WHERE id = ${Number(job.id)}`)
    cities++
  }

  payload.logger.info(`Taxonomy backfill: ${linked} skill links, ${cities} cities matched.`)
  return { linked, cities }
}
