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
