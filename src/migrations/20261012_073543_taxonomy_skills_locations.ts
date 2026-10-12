import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { backfillJobTaxonomy } from '../lib/backfillJobTaxonomy'
import { seedTaxonomy } from '../lib/taxonomy'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_jobs_experience_level" AS ENUM('junior', 'mid', 'senior', 'lead');
  CREATE TYPE "public"."enum_jobs_content_language" AS ENUM('en', 'fr', 'ar');
  CREATE TABLE "jobs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"skills_id" integer
  );
  
  CREATE TABLE "skill_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"icon" varchar,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "skills" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"popular" boolean DEFAULT false,
  	"order" numeric DEFAULT 100,
  	"search_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "skills_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "skills_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"skill_categories_id" integer
  );
  
  CREATE TABLE "locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"country" varchar DEFAULT 'Algeria',
  	"region" varchar,
  	"is_remote" boolean DEFAULT false,
  	"order" numeric DEFAULT 100,
  	"search_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "locations_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "jobs" ADD COLUMN "city_id" integer;
  ALTER TABLE "jobs" ADD COLUMN "experience_level" "enum_jobs_experience_level";
  ALTER TABLE "jobs" ADD COLUMN "content_language" "enum_jobs_content_language" DEFAULT 'en';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "skill_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "skills_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "jobs_rels" ADD CONSTRAINT "jobs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_rels" ADD CONSTRAINT "jobs_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skills_texts" ADD CONSTRAINT "skills_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skills_rels" ADD CONSTRAINT "skills_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skills_rels" ADD CONSTRAINT "skills_rels_skill_categories_fk" FOREIGN KEY ("skill_categories_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_texts" ADD CONSTRAINT "locations_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "jobs_rels_order_idx" ON "jobs_rels" USING btree ("order");
  CREATE INDEX "jobs_rels_parent_idx" ON "jobs_rels" USING btree ("parent_id");
  CREATE INDEX "jobs_rels_path_idx" ON "jobs_rels" USING btree ("path");
  CREATE INDEX "jobs_rels_skills_id_idx" ON "jobs_rels" USING btree ("skills_id");
  CREATE UNIQUE INDEX "skill_categories_slug_idx" ON "skill_categories" USING btree ("slug");
  CREATE INDEX "skill_categories_updated_at_idx" ON "skill_categories" USING btree ("updated_at");
  CREATE INDEX "skill_categories_created_at_idx" ON "skill_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "skills_slug_idx" ON "skills" USING btree ("slug");
  CREATE INDEX "skills_popular_idx" ON "skills" USING btree ("popular");
  CREATE INDEX "skills_search_text_idx" ON "skills" USING btree ("search_text");
  CREATE INDEX "skills_updated_at_idx" ON "skills" USING btree ("updated_at");
  CREATE INDEX "skills_created_at_idx" ON "skills" USING btree ("created_at");
  CREATE INDEX "skills_texts_order_parent" ON "skills_texts" USING btree ("order","parent_id");
  CREATE INDEX "skills_rels_order_idx" ON "skills_rels" USING btree ("order");
  CREATE INDEX "skills_rels_parent_idx" ON "skills_rels" USING btree ("parent_id");
  CREATE INDEX "skills_rels_path_idx" ON "skills_rels" USING btree ("path");
  CREATE INDEX "skills_rels_skill_categories_id_idx" ON "skills_rels" USING btree ("skill_categories_id");
  CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");
  CREATE INDEX "locations_country_idx" ON "locations" USING btree ("country");
  CREATE INDEX "locations_search_text_idx" ON "locations" USING btree ("search_text");
  CREATE INDEX "locations_updated_at_idx" ON "locations" USING btree ("updated_at");
  CREATE INDEX "locations_created_at_idx" ON "locations" USING btree ("created_at");
  CREATE INDEX "locations_texts_order_parent" ON "locations_texts" USING btree ("order","parent_id");
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_city_id_locations_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skill_categories_fk" FOREIGN KEY ("skill_categories_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skills_fk" FOREIGN KEY ("skills_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "jobs_city_idx" ON "jobs" USING btree ("city_id");
  CREATE INDEX "jobs_experience_level_idx" ON "jobs" USING btree ("experience_level");
  CREATE INDEX "jobs_content_language_idx" ON "jobs" USING btree ("content_language");
  CREATE INDEX "payload_locked_documents_rels_skill_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("skill_categories_id");
  CREATE INDEX "payload_locked_documents_rels_skills_id_idx" ON "payload_locked_documents_rels" USING btree ("skills_id");
  CREATE INDEX "payload_locked_documents_rels_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("locations_id");`)

  // Data steps (same transaction as the schema change above: all or nothing)
  // 1. The old free-text skills keep their values under the new name `legacySkills`
  await db.execute(sql`UPDATE "jobs_texts" SET "path" = 'legacySkills' WHERE "path" = 'skills';`)
  // 2. Starting skills, categories and cities (idempotent)
  await seedTaxonomy(payload, req)
  // 3. Link existing jobs to them; unmatched values stay in legacySkills
  await backfillJobTaxonomy(db, payload, req)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Linked skills are lost on rollback; the free-text values that were never matched come back
  await db.execute(sql`UPDATE "jobs_texts" SET "path" = 'skills' WHERE "path" = 'legacySkills';`)
  await db.execute(sql`
   ALTER TABLE "jobs_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "skill_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "skills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "skills_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "skills_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "locations_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "jobs_rels" CASCADE;
  DROP TABLE "skill_categories" CASCADE;
  DROP TABLE "skills" CASCADE;
  DROP TABLE "skills_texts" CASCADE;
  DROP TABLE "skills_rels" CASCADE;
  DROP TABLE "locations" CASCADE;
  DROP TABLE "locations_texts" CASCADE;
  ALTER TABLE "jobs" DROP CONSTRAINT "jobs_city_id_locations_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_skill_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_skills_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_locations_fk";
  
  DROP INDEX "jobs_city_idx";
  DROP INDEX "jobs_experience_level_idx";
  DROP INDEX "jobs_content_language_idx";
  DROP INDEX "payload_locked_documents_rels_skill_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_skills_id_idx";
  DROP INDEX "payload_locked_documents_rels_locations_id_idx";
  ALTER TABLE "jobs" DROP COLUMN "city_id";
  ALTER TABLE "jobs" DROP COLUMN "experience_level";
  ALTER TABLE "jobs" DROP COLUMN "content_language";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "skill_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "skills_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "locations_id";
  DROP TYPE "public"."enum_jobs_experience_level";
  DROP TYPE "public"."enum_jobs_content_language";`)
}
