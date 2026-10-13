import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reports_reason" AS ENUM('scam', 'misleading', 'discriminatory', 'duplicate', 'offensive', 'other');
  CREATE TYPE "public"."enum_reports_status" AS ENUM('open', 'reviewing', 'actioned', 'dismissed');
  ALTER TYPE "public"."enum_jobs_status" ADD VALUE 'pending_review' BEFORE 'published';
  ALTER TYPE "public"."enum_jobs_status" ADD VALUE 'rejected';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'purgeAuditLogs';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'purgeAuditLogs';
  CREATE TABLE "users_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reason" "enum_reports_reason" NOT NULL,
  	"details" varchar,
  	"reporter_id" integer,
  	"reporter_key" varchar,
  	"status" "enum_reports_status" DEFAULT 'open',
  	"handled_by_id" integer,
  	"resolution_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reports_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"jobs_id" integer,
  	"companies_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_id" integer,
  	"action" varchar NOT NULL,
  	"collection" varchar,
  	"document_id" varchar,
  	"summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"moderation_daily_job_limit" numeric DEFAULT 10,
  	"moderation_report_threshold" numeric DEFAULT 3,
  	"privacy_audit_log_retention_days" numeric DEFAULT 1095,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "verification_token_hash" varchar;
  ALTER TABLE "users" ADD COLUMN "verification_expires" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "verification_sent_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "login_code_hash" varchar;
  ALTER TABLE "users" ADD COLUMN "login_code_device" varchar;
  ALTER TABLE "users" ADD COLUMN "login_code_expires" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "login_code_sent_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "login_code_attempts" numeric;
  ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "terms_version" varchar;
  ALTER TABLE "companies" ADD COLUMN "trusted" boolean DEFAULT false;
  ALTER TABLE "companies" ADD COLUMN "verified" boolean DEFAULT false;
  ALTER TABLE "jobs" ADD COLUMN "rejection_reason" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reports_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_logs_id" integer;
  ALTER TABLE "users_texts" ADD CONSTRAINT "users_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_companies_fk" FOREIGN KEY ("companies_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_texts" ADD CONSTRAINT "site_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_texts_order_parent" ON "users_texts" USING btree ("order","parent_id");
  CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_id");
  CREATE INDEX "reports_reporter_key_idx" ON "reports" USING btree ("reporter_key");
  CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");
  CREATE INDEX "reports_handled_by_idx" ON "reports" USING btree ("handled_by_id");
  CREATE INDEX "reports_updated_at_idx" ON "reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");
  CREATE INDEX "reports_rels_order_idx" ON "reports_rels" USING btree ("order");
  CREATE INDEX "reports_rels_parent_idx" ON "reports_rels" USING btree ("parent_id");
  CREATE INDEX "reports_rels_path_idx" ON "reports_rels" USING btree ("path");
  CREATE INDEX "reports_rels_jobs_id_idx" ON "reports_rels" USING btree ("jobs_id");
  CREATE INDEX "reports_rels_companies_id_idx" ON "reports_rels" USING btree ("companies_id");
  CREATE INDEX "reports_rels_users_id_idx" ON "reports_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_collection_idx" ON "audit_logs" USING btree ("collection");
  CREATE INDEX "audit_logs_document_id_idx" ON "audit_logs" USING btree ("document_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "site_settings_texts_order_parent" ON "site_settings_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_verification_token_hash_idx" ON "users" USING btree ("verification_token_hash");
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("reports_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");`)

  // Accounts that existed before email verification keep working: mark them verified.
  // (New-device codes still protect them: their next sign-in browser becomes the trusted one.)
  await db.execute(sql`UPDATE "users" SET "email_verified" = true, "email_verified_at" = now() WHERE "email_verified" IS NOT TRUE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reports_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_texts" CASCADE;
  DROP TABLE "reports" CASCADE;
  DROP TABLE "reports_rels" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reports_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_logs_fk";
  
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_jobs_status";
  CREATE TYPE "public"."enum_jobs_status" AS ENUM('draft', 'published', 'closed');
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_jobs_status";
  ALTER TABLE "jobs" ALTER COLUMN "status" SET DATA TYPE "public"."enum_jobs_status" USING "status"::"public"."enum_jobs_status";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'sendEmail', 'closeExpiredJobs');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'sendEmail', 'closeExpiredJobs');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "users_verification_token_hash_idx";
  DROP INDEX "payload_locked_documents_rels_reports_id_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_logs_id_idx";
  ALTER TABLE "users" DROP COLUMN "email_verified";
  ALTER TABLE "users" DROP COLUMN "email_verified_at";
  ALTER TABLE "users" DROP COLUMN "verification_token_hash";
  ALTER TABLE "users" DROP COLUMN "verification_expires";
  ALTER TABLE "users" DROP COLUMN "verification_sent_at";
  ALTER TABLE "users" DROP COLUMN "login_code_hash";
  ALTER TABLE "users" DROP COLUMN "login_code_device";
  ALTER TABLE "users" DROP COLUMN "login_code_expires";
  ALTER TABLE "users" DROP COLUMN "login_code_sent_at";
  ALTER TABLE "users" DROP COLUMN "login_code_attempts";
  ALTER TABLE "users" DROP COLUMN "banned";
  ALTER TABLE "users" DROP COLUMN "terms_accepted_at";
  ALTER TABLE "users" DROP COLUMN "terms_version";
  ALTER TABLE "companies" DROP COLUMN "trusted";
  ALTER TABLE "companies" DROP COLUMN "verified";
  ALTER TABLE "jobs" DROP COLUMN "rejection_reason";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reports_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_logs_id";
  DROP TYPE "public"."enum_reports_reason";
  DROP TYPE "public"."enum_reports_status";`)
}
