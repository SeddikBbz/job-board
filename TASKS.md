# Job Board: Project Plan and Task List

## 0. Agent rules (read first)

**Mode: learning project.** The owner is a developer learning Next.js and Payload.

1. Work on **one task at a time**. Stop after each task and summarize what changed.
2. **Explain before coding**: say in 2-4 sentences what you will do and why.
3. Prefer small, readable code over clever code. Add a short comment only where the reason is not obvious.
4. Never invent Payload APIs. If unsure, read the official docs (https://payloadcms.com/docs) before writing code.
5. After any change to collections or globals, run `pnpm payload generate:types`.
6. Never commit secrets. Keep them in `.env`, and keep `.env.example` up to date with names only.
7. After each milestone, run `pnpm lint`, `pnpm tsc --noEmit`, and `pnpm build`. Fix errors before moving on.
8. Use clear commit messages (`feat: add jobs collection`, `fix: ...`). Suggest a commit after each task.
9. Do not add libraries that are not listed in this plan without asking first.
10. **Local API gotcha:** Payload's Local API **bypasses access control by default**. Whenever a call is made on behalf of a user, pass `user` and `overrideAccess: false`.

---

## 1. Project summary

A job board where **employers post job offers** and **candidates search and apply**. Admins manage everything from the Payload admin panel.

### Roles

| Role | Can do |
|---|---|
| `candidate` | Browse jobs, apply with a resume, track own applications |
| `employer` | Manage own company, post and edit own jobs, review applicants, change application status |
| `admin` | Everything, including promoting users and moderating content |

### Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, latest stable) with TypeScript |
| CMS and backend | Payload 3.x inside the same Next.js app |
| Database | PostgreSQL on **Neon** |
| File storage | **Vercel Blob** (via Payload storage adapter) |
| Email (production) | **Resend** (free plan is enough for testing) |
| Email (local) | **Mailpit** (local SMTP inbox) |
| Styling | Tailwind CSS and shadcn/ui |
| Validation | Zod |
| Bot protection | Cloudflare Turnstile |
| Errors | Sentry |
| Tests | Vitest (unit and integration), Playwright (end to end) |
| CI | GitHub Actions |
| Hosting | Vercel |
| Package manager | pnpm |

### Architecture rules

- One codebase, one deployment. Payload lives inside the Next.js app.
- The frontend reads data with the **Local API** in Server Components, not by calling its own REST API.
- Each external service sits behind a Payload adapter or plugin, so switching a provider means editing one block in `payload.config.ts`.
- Public pages read only `published` jobs.

### Folder layout (target)

```
src/
  app/
    (frontend)/        public site and dashboards
    (payload)/         admin and API (generated, do not edit)
  collections/         Users, Companies, Jobs, Applications, Media, Resumes
  access/              reusable access functions
  hooks/               reusable hooks
  lib/                 helpers (payload client, validators, email templates)
  components/          UI components
  payload.config.ts
  payload-types.ts     generated
```

### Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URI` | Neon connection string |
| `PAYLOAD_SECRET` | Long random string |
| `NEXT_PUBLIC_SERVER_URL` | Base URL of the site |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `RESEND_API_KEY` | Resend API key (production and preview) |
| `EMAIL_FROM_ADDRESS` | Verified sender address |
| `SMTP_HOST`, `SMTP_PORT` | Mailpit for local development |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `SENTRY_DSN` | Sentry project |

---

## 2. Data model

### Collections

**users** (auth enabled)
- `name` text, required
- `role` select: `candidate` | `employer` | `admin`, default `candidate`

**companies**
- `name` text, required
- `slug` text, unique, generated from name
- `logo` upload to `media`
- `website` text
- `description` textarea
- `location` text
- `size` select: `1-10` | `11-50` | `51-200` | `201-1000` | `1000+`
- `owner` relationship to `users`, required

**jobs**
- `title` text, required
- `slug` text, unique, generated from title
- `company` relationship to `companies`, required
- `description` rich text, required
- `location` text
- `jobType` select: `full-time` | `part-time` | `contract` | `internship`
- `workMode` select: `onsite` | `hybrid` | `remote`
- `salaryMin`, `salaryMax` number, optional
- `salaryCurrency` select: `DZD` | `EUR` | `USD`
- `skills` text with `hasMany`
- `status` select: `draft` | `published` | `closed`, default `draft`
- `publishedAt` date, set automatically when first published
- `expiresAt` date

**applications**
- `job` relationship to `jobs`, required
- `candidate` relationship to `users`, required, set by the server (never by the client)
- `resume` relationship to `resumes`, required
- `coverLetter` textarea
- `status` select: `applied` | `reviewing` | `interview` | `rejected` | `hired`, default `applied`
- Rule: one application per candidate per job

**media** (upload, public): company logos only.

**resumes** (upload, **private**): PDF only, max 5 MB. Served through Payload so access control applies.

### Access matrix

| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| users | Own doc; admin all | Anyone (signup) | Own doc; admin all | Admin |
| companies | Public | Employer or admin | Owner or admin | Owner or admin |
| jobs | Public: `published` only. Employer: own jobs. Admin: all | Employer (for own company) | Owner of the company or admin | Owner of the company or admin |
| applications | Candidate: own. Employer: those for own jobs. Admin: all | Candidate | Employer of that job (status only) or admin | Admin |
| media | Public | Employer or admin | Owner or admin | Admin |
| resumes | Candidate: own. Employer: resumes attached to applications for own jobs. Admin: all | Candidate | Nobody | Admin |

Field-level rules:
- `users.role`: only admins can change it. Public signup may choose `candidate` or `employer`, never `admin`.
- `applications.candidate`: forced to the logged-in user in a `beforeChange` hook.
- `applications.status`: only employer of that job or admin can change it.

---

## 3. Milestones and tasks

### M0. Project setup

- [x] Create a Neon project and copy the connection string.
- [x] Run `npx create-payload-app@latest job-board` (template: `blank`, database: PostgreSQL, paste the Neon string).
- [x] Start the app with `pnpm dev` and create the first admin user at `/admin`.
- [x] Initialize Git, create `.gitignore` check (`.env` must be ignored), push to a GitHub repo.
- [x] Add `.env.example` with all variable names from the table above (no values).
- [x] Add scripts to `package.json`: `lint`, `typecheck` (`tsc --noEmit`), `test`.
- [x] Add a short `README.md` (what the project is, how to run it).

**Done when:** `/admin` opens, `pnpm build` passes, the repo is on GitHub with no secrets in it.

### M1. Users and roles

- [x] Add `name` and `role` fields to `Users` as defined above.
- [x] Create `src/access/` with helpers: `isAdmin`, `isEmployer`, `isCandidate`, `isLoggedIn`, `isAdminOrSelf`.
- [x] Block non-admins from changing `role` (field-level access) and from entering the admin panel (`access.admin` allows only `admin`).
- [x] Add a `beforeChange` hook on `users`: if there are **no users yet**, set `role = 'admin'` (first-user bootstrap). Otherwise, if the request user is not an admin, allow only `candidate` or `employer` on create and force `role` unchanged on update.
- [x] Run `pnpm payload generate:types`.

**Done when:** the first user is an admin; a new signup via API cannot become `admin`; a candidate cannot open `/admin`.

### M2. Media, resumes and storage

- [x] Create `media` collection (images only, public read).
- [x] Create `resumes` collection (PDF only, size limit 5 MB, private access as in the matrix).
- [x] Install and configure the Vercel Blob storage adapter for both collections. Use local disk in development if no token is set.
- [x] Configure `sharp` for image resizing.

**Done when:** a logo uploads and displays; a resume uploads and cannot be opened by a different candidate.

### M3. Companies

- [x] Create `companies` collection with fields above.
- [x] Auto-generate a unique `slug` from `name` (hook).
- [x] Default `owner` to the current user on create.
- [x] Apply access rules from the matrix.
- [x] Limit employers to one company each (validation), unless an admin.

**Done when:** an employer can create and edit only their own company; others get 403.

### M4. Jobs

- [x] Create `jobs` collection with fields above.
- [x] Auto-generate a unique `slug` from `title`.
- [x] Set `publishedAt` automatically the first time `status` becomes `published`.
- [x] Validate: `salaryMax >= salaryMin`; `expiresAt` must be in the future when publishing.
- [x] Employer can only attach jobs to a company they own.
- [x] Apply read access: public sees `published` and non-expired only.
- [x] Add DB indexes on `status`, `jobType`, `workMode`, `company`, `expiresAt`.
- [x] After change, call `revalidatePath('/jobs')` and the job's own path (skip when `context.disableRevalidate` is set).

**Done when:** a draft job is invisible to the public API; a published job appears; another employer cannot edit it.

### M5. Seed data

- [x] Write `src/seed.ts` (run with `pnpm payload run src/seed.ts`).
- [x] Create 1 admin, 3 employers, 10 candidates, 8 companies, 40 jobs with varied types, modes, locations and skills, and 30 applications.
- [x] Make the script idempotent or add a `--reset` option.

**Done when:** a fresh database has realistic data after one command.

### M6. Public frontend: jobs

- [x] Set up Tailwind and shadcn/ui; create layout, header, footer, and a theme.
- [x] `/` home page: search box, featured categories, latest jobs.
- [x] `/jobs` list page (Server Component) reading **filters from the URL**: `q`, `type`, `mode`, `location`, `salaryMin`, `skills`, `sort`, `page`.
- [x] Build the Payload `where` query from filters (`and`, `or`, `like`, `in`, `greater_than_equal`). Paginate with `limit` and `page`.
- [x] Filter UI that updates the URL (client component using `useRouter` and `useSearchParams`), with a "clear filters" button.
- [x] `/jobs/[slug]` detail page with `generateMetadata` and `notFound()`.
- [x] `/companies/[slug]` page listing the company and its open jobs.
- [x] Add `loading.tsx`, `error.tsx`, `not-found.tsx` for key routes.
- [x] Empty state when no jobs match.

**Done when:** filters work from a shared URL; page 2 works; nothing from a draft job appears anywhere.

### M7. Authentication pages

- [ ] `/register` with name, email, password, role choice (`candidate` or `employer`).
- [ ] `/login` and logout action using Payload's auth endpoints.
- [ ] Read the current user on the server with `payload.auth({ headers })` and expose it through a small helper (`getCurrentUser()`).
- [ ] Protect `/dashboard/**` (redirect to `/login` when logged out).
- [ ] Header shows login/register or the user menu.
- [ ] Add Cloudflare Turnstile to register and login forms; verify the token on the server.
- [ ] Add "forgot password" and "reset password" pages using Payload's flow, with the email sent through the email adapter.

**Done when:** register, login, logout and password reset all work; a logged-out visitor cannot see `/dashboard`.

### M8. Applications

- [ ] "Apply" form on the job page (logged-in candidates only) with cover letter and PDF resume.
- [ ] Server Action: validate with Zod, check session, check the job is `published` and not expired, upload the resume to `resumes`, then create the application with `overrideAccess: false` and `user`.
- [ ] Prevent duplicate applications (check in a `beforeValidate` hook).
- [ ] Show "Already applied" state on the job page.
- [ ] Friendly error and success messages.

**Done when:** a candidate can apply once per job; the second attempt is rejected; an employer cannot apply.

### M9. Dashboards

**Candidate** (`/dashboard/applications`)
- [ ] List own applications with job, company, date and status.
- [ ] Withdraw option only if the plan allows it (optional, ask the owner first).

**Employer** (`/dashboard/jobs`)
- [ ] Company profile edit page with logo upload.
- [ ] List own jobs with status, applicant count, expiry.
- [ ] Create and edit job forms (Server Actions with Zod).
- [ ] Publish, close and reopen actions.
- [ ] `/dashboard/jobs/[id]/applicants`: list applicants, download resume (through Payload access control), change status.

**Done when:** each role sees only its own data; an employer cannot open another employer's applicants page.

### M10. Emails and background work

- [ ] Configure the Payload email adapter: Mailpit (nodemailer) in development, Resend in production and preview.
- [ ] Create simple HTML email templates in `src/lib/email/`.
- [ ] `afterChange` hook on `applications`:
  - on create: email the employer ("New applicant") and the candidate ("Application received").
  - on update: if `status` changed, email the candidate.
- [ ] Use Payload's jobs queue for sending (so a failed email does not break the request) if time allows. Otherwise send inline and note it in the README.
- [ ] Scheduled task: close jobs whose `expiresAt` has passed (Payload job plus a Vercel Cron call to run the queue).

**Done when:** emails appear in Mailpit locally; expired jobs disappear from the public list without manual work.

### M11. Quality and security

- [ ] Rate-limit login, register and apply (simple IP-based limiter or Vercel firewall rules).
- [ ] Add security headers in `next.config` (CSP basics, `X-Content-Type-Options`, `Referrer-Policy`).
- [ ] Confirm every Server Action re-checks the user and role on the server.
- [ ] Search the codebase: every Local API call made for a user passes `user` and `overrideAccess: false`.
- [ ] Add Sentry (`@sentry/nextjs`) with source maps.
- [ ] Accessibility pass: labels, focus states, keyboard navigation, color contrast.
- [ ] SEO: `generateMetadata`, `sitemap.ts`, `robots.ts`, JSON-LD `JobPosting` on job pages.

**Done when:** a checklist review finds no route or action that trusts the client.

### M12. Testing

- [ ] Vitest: unit tests for slug generation, filter-to-`where` builder, validators.
- [ ] Vitest integration tests for access control (use the Local API with `overrideAccess: false` for each role).
- [ ] Playwright: register → login → apply; employer posts job → candidate sees it; status change sends email.
- [ ] Run tests in CI on every pull request.

**Done when:** `pnpm test` and the Playwright suite pass locally and in CI.

### M13. Deployment

- [ ] Replace dev schema push with migrations: `pnpm payload migrate:create`, commit the migration files.
- [ ] Create a GitHub Actions workflow: install, lint, typecheck, test, build.
- [ ] Create a Vercel project from the repo; add all environment variables.
- [ ] Create separate Neon branches for development, CI and production; keep `DATABASE_URI` per environment.
- [ ] Run `pnpm payload migrate` as part of the production build step.
- [ ] Verify a sender domain in Resend and set `EMAIL_FROM_ADDRESS`.
- [ ] Connect a custom domain (optional).
- [ ] Smoke test production: register, apply, status email.

**Done when:** a push to `main` deploys automatically and the production smoke test passes.

---

## 4. Optional extensions (after launch)

- [ ] Saved jobs and job alerts by email
- [ ] Company reviews with admin moderation
- [ ] Featured or paid job posts with Stripe (`plugin-stripe`)
- [ ] Better search with Meilisearch or Typesense
- [ ] Draft and version history for jobs (Payload versions)
- [ ] Multi-language support (Payload localization)
- [ ] Analytics (Vercel Analytics or Plausible)
- [ ] Company team accounts (several employers per company)

---

## 5. Definition of done (every task)

- Code compiles with no TypeScript errors and no lint errors.
- Types are regenerated if collections changed.
- Access rules for the new feature were tested with at least one allowed and one denied role.
- No secrets, no `console.log` left in committed code.
- The README or this file is updated if setup steps changed.
- Changes committed with a clear message.

---

## 6. Common gotchas (for the agent)

- Local API ignores access control unless `overrideAccess: false` is set.
- Payload 3.x supports compound unique indexes (`indexes: [{ fields, unique: true }]`); we use one for "one application per candidate per job", plus a hook for a friendly error.
- Field-level `access.create` runs for the first user too, so the first-user bootstrap must be handled in a hook.
- In development Payload may auto-sync the Postgres schema; in production always use migrations.
- Use the Neon **pooled** connection string for the running app. If migrations fail through the pooler, run them with the direct connection string.
- Revalidate cached pages in `afterChange` hooks, or the public lists will look stale.
- Do not expose resumes through public blob URLs; serve them through Payload so access control applies.
