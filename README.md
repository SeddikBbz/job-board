# Job Board

A job board where **employers post job offers** and **candidates search and apply**. Admins manage everything from the Payload admin panel.

Built as a learning project with Next.js (App Router) and Payload 3, running in a single app.

## Tech stack

- Next.js + TypeScript
- Payload CMS 3 (admin panel and backend, inside the Next.js app)
- PostgreSQL on Neon
- pnpm

See [TASKS.md](TASKS.md) for the full plan and roadmap.

## Getting started

Requirements: Node.js 20.18.1 or newer (22 recommended) and pnpm.

```bash
git clone https://github.com/SeddikBbz/job-board.git
cd job-board
pnpm install
cp .env.example .env   # then fill in DATABASE_URI and PAYLOAD_SECRET
pnpm dev
```

Open http://localhost:3000/admin and create the first user (the admin).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm test` | Run integration (Vitest) and end-to-end (Playwright) tests |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after changing collections |

## File storage

- `media` (company logos) is public. `resumes` (PDF, max 5 MB) is private and always served through Payload (`/api/resumes/file/...`) so access control applies.
- With `BLOB_READ_WRITE_TOKEN` set, files go to Vercel Blob. Without it (local dev), files are stored on disk in `media/` and `resumes/` (both git-ignored).

## Seed data

```bash
pnpm seed         # adds demo data (skips if already seeded)
pnpm seed:reset   # deletes all seed data, then seeds again
```

Creates 1 admin, 3 employers, 10 candidates, 8 companies (with logos), 40 jobs and 30 applications.
All seed users use `@seed.local` emails (e.g. `admin@seed.local`, `employer1@seed.local`, `candidate1@seed.local`)
and the password from `SEED_PASSWORD` (default `password123`). The seed refuses to run in production.

## Authentication

- `/register`, `/login`, `/forgot-password`, `/reset-password` use Server Actions with Zod validation and Payload's auth (`@payloadcms/next/auth`).
- Public signup can only choose `candidate` or `employer`; the first user ever created becomes `admin`.
- `/dashboard/**` requires a logged-in user.
- **Cloudflare Turnstile** protects register and login. Outside production, if `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` are not set, Cloudflare's official test keys are used (the check always passes). In production, real keys are required, or login and register will refuse requests.
- Until email is configured (M10), password reset emails are only logged to the server console (recipient and subject).

## Email and background jobs

- **Local:** install [Mailpit](https://mailpit.axllent.org) (`winget install axllent.mailpit`), run `mailpit`, and set `SMTP_HOST=localhost` and `SMTP_PORT=1025` in `.env`. Emails appear at http://localhost:8025.
- **Production / preview:** set `RESEND_API_KEY` and a verified `EMAIL_FROM_ADDRESS`.
- With neither set, Payload only logs the recipient and subject to the console.
- Emails (new applicant, application received, status changed, withdrawn, password reset) are queued as `sendEmail` jobs, then sent right after the response, so a failing email never breaks the request. Failed sends are retried up to 3 times.
- `vercel.json` schedules a daily Vercel Cron call to `/api/payload-jobs/run` (protected by `CRON_SECRET`, sent by Vercel as a Bearer token). It runs anything still queued and the daily `closeExpiredJobs` task. Expired jobs are hidden from public pages immediately by access control; the task only updates their status.

## Tests

| Command | What it runs | Needs |
|---|---|---|
| `pnpm test:unit` | Vitest unit tests (`tests/unit`): slugs, URL filters → Payload `where`, Zod validators, helpers | nothing |
| `pnpm test:int` | Vitest integration tests (`tests/int`): access control for every role through the Local API with `overrideAccess: false` | `DATABASE_URI` |
| `pnpm test` | unit + integration | `DATABASE_URI` |
| `pnpm test:e2e` | Playwright (`tests/e2e`): employer posts a job → candidate registers, logs in and applies → status change email | `DATABASE_URI`; run `mailpit` for the email check; first time: `pnpm exec playwright install chromium` |

Integration and e2e tests create their own data (`@int.test` / `@e2e.test` emails) and delete it afterwards.
They use the database in `DATABASE_URI`, so point it at a separate Neon branch for CI.

**CI** (`.github/workflows/ci.yml`) runs on every pull request and push to `main`: lint, typecheck and unit tests always;
integration, e2e and build once the `DATABASE_URI` and `PAYLOAD_SECRET` repository secrets are set.

## Database migrations

- **Local development** uses Payload's schema *push*: changes to collections are applied to your dev database automatically when `pnpm dev` starts. Never run `pnpm payload migrate` against that database.
- **Production and preview** use migrations in `src/migrations`. After changing collections, run `pnpm payload migrate:create <name>` and commit the new files.
- `vercel.json` runs `pnpm payload migrate && pnpm build`, so every deployment applies pending migrations first.
- If migrations fail through Neon's pooled connection, run them with the direct (non-pooled) connection string.

## Deployment (Vercel + Neon)

1. **Neon branches**: keep one branch per environment, each with its own connection string:
   - `development`: your local `.env` (schema push).
   - `ci`: GitHub secret `DATABASE_URI` for the CI workflow.
   - `preview` (optional) and `production`: migration-managed, used by Vercel.
2. **Vercel project**: import the GitHub repo (framework: Next.js; the build command comes from `vercel.json`).
3. **Vercel Blob**: create a Blob store in the project; Vercel adds `BLOB_READ_WRITE_TOKEN`.
4. **Environment variables** (Production, and Preview with its own database):

   | Name | Value |
   |---|---|
   | `DATABASE_URI` | Neon pooled connection string for that environment |
   | `PAYLOAD_SECRET` | a long random string (different per environment) |
   | `NEXT_PUBLIC_SERVER_URL` | e.g. `https://jobs.example.com` |
   | `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` | from Resend, with a verified sender domain |
   | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | from Cloudflare Turnstile (required in production) |
   | `CRON_SECRET` | a long random string (Vercel Cron sends it to `/api/payload-jobs/run`) |
   | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | from Sentry (optional) |
   | `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | to upload source maps (optional) |

5. **First admin**: after the first deploy, open `/admin` and create the first user (it becomes the admin).
6. **Firewall**: add Vercel Firewall rate-limit rules for `/login`, `/register` and `/jobs/*` (the in-app limiter is per instance).
7. **Smoke test**: register, apply to a job, change the status as the employer, and check the email arrives.
