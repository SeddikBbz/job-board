import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { computeJobSearchText } from '../hooks/jobSearchText'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jobs" ADD COLUMN "search_text" varchar;
  CREATE INDEX "jobs_search_text_idx" ON "jobs" USING btree ("search_text");`)

  // Fill searchText for existing jobs (SQL update: no hooks, no emails, no cache work)
  const { docs } = await payload.find({ collection: 'jobs', depth: 0, limit: 0, pagination: false, req })
  for (const job of docs) {
    const searchText = await computeJobSearchText(job, payload, req)
    await db.execute(sql`UPDATE "jobs" SET "search_text" = ${searchText} WHERE "id" = ${job.id}`)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "jobs_search_text_idx";
  ALTER TABLE "jobs" DROP COLUMN "search_text";`)
}
