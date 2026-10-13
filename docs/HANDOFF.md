# Project handoff: status and how to continue safely

Last updated: 2026-10-13. Read this first, then `AGENTS.md` (rules), `ROADMAP.md` (order of work) and `FEATURES.md` (class details).

## 1. What this is

A job board for Algeria: candidates search and apply with a resume, employers post jobs and review applicants, admins moderate.

- **Live site:** https://job-board-psi-lyart.vercel.app (Vercel, auto-deploys from `main`)
- **Repo:** https://github.com/SeddikBbz/job-board (work on `develop`, deploy by merging to `main`)
- **Owner:** learning project. Explain before coding, small readable code, the owner commits or approves deploys.

### Stack

| Part | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack). Read `node_modules/next/dist/docs/` before using an API you are unsure of. |
| CMS / backend | Payload 3.90.2 (collections, hooks, access control, jobs queue), admin at `/admin` |
| Database | Neon Postgres (`@payloadcms/db-postgres`). Project `bleu-hill-48…`, separate branches for production, dev and CI. |
| Files | Vercel Blob in production (`BLOB_READ_WRITE_TOKEN`), local `media/` and `resumes/` folders in dev |
| Email | Resend in production, Mailpit locally and in CI (`SMTP_HOST=localhost`, `SMTP_PORT=1025`) |
| UI | Tailwind v4, shadcn/ui (radix), lucide icons, Zod validation |
| Security | Cloudflare Turnstile, in-memory rate limits, Sentry (optional DSN) |
| Tests | Vitest (unit, component, int), Playwright (e2e), axe accessibility |

## 2. Status by class (see ROADMAP.md)

| Order | Class | Status |
|---|---|---|
| 1 | Layout foundation (full width, fluid grids, dashboard drawer) | Done, live |
| 2 | Media upload and auto-resize (WebP, 6 sizes, limits) | Done, live. Optional: `pnpm media:reprocess` on production to regenerate old logos (needs prod secrets). |
| 3 | Sign in / sign up redesign | Done, live |
| 3b | Class 17: installable mobile app (PWA) | Done, live. Manual check on real phones still to do. |
| 4 | Skills and cities taxonomy (+ SkillPicker, backfill) | Done, live |
| 5 | Live search and suggestions | Done, live |
| 6 | Class 10: trust, safety and legal | Done, live (deployed 2026-10-13; existing users marked verified). |
| 7 | Class 16: operations baseline | Next |
| 7b | Class 18: home wilaya (local jobs first + local alerts) | Planned, after Class 16 (see ROADMAP.md) |
| then | BETA LAUNCH CHECKPOINT, Classes 6, 7, 8, 11, 12, 13, 9, 15, 14 | Not started |

### Owner decisions already made (don't re-ask)

- **Moderation:** every job from a company that isn't `trusted` waits for review. Admins tick `trusted` (also "Approve and trust company" in the review queue).
- **Legal operator:** BCOS online team. Legal pages are drafts with `[placeholders]`; a qualified person must review them under Algerian law 18-07 before launch.
- **Resumes:** candidates have total control and can delete any resume at any time (the file is removed). Only a traceability log entry is kept (who, when, file name, never the content), for `auditLogRetentionDays` in Site settings.
- **Existing accounts:** were marked verified (keep working). Every account gets a 6-digit emailed code when signing in from a new browser ("trust on first use": the first browser after the change is trusted).
- Commits: the owner commits themselves unless they ask the agent to. Deploys to production (merge to `main`) need the owner's OK when they change data.

## 3. How the code is organised

```
src/
  app/(frontend)/        public site and dashboard (Next.js App Router)
    (auth)/              login, register, forgot/reset password + actions.ts
    dashboard/           candidate, employer and admin pages (+ moderation/, reports/)
    jobs/                list (live search) and [slug] (apply, report)
    next/suggest/        GET suggestions endpoint (outside /api on purpose)
    verify-email/, offline/, privacy/, terms/, cookies/
  app/(payload)/         Payload admin and REST (generated, don't edit)
  collections/           Users, Media, Resumes, Companies, Jobs, Applications,
                         Taxonomy (skill-categories, skills, locations), Reports, Pages, AuditLogs
  globals/SiteSettings   spam phrases, free email domains, daily job limit, report threshold, log retention
  hooks/                 moderateJob, jobSearchText, revalidate*, applicationEmails, protectRole…
  access/                one file per rule (isVerified, jobs, applications, users…)
  lib/                   pure helpers (normalize, moderation, jobFilters, suggest, taxonomy,
                         accountSecurity, tokens, email/…) — most have unit tests
  data/                  starting taxonomy (skills, 58 wilayas) and legal page drafts
  migrations/            one per schema change, run automatically on Vercel builds
  jobs/tasks.ts          sendEmail, closeExpiredJobs (03:00), purgeAuditLogs (03:30)
public/                  sw.js + sw-rules.js (service worker), icons/
tests/                   unit/, component/, int/ (real DB), e2e/ (Playwright), helpers/
```

### Key flows

- **Jobs status:** `draft → pending_review → published → closed`, or `rejected` (with `rejectionReason`). The `moderateJob` hook decides the real status on every save (`src/lib/moderation.ts` → `decideJobStatus`). Public reads only ever return `published` and not expired (`src/access/jobs.ts`).
- **Search:** one Zod schema in `src/lib/jobFilters.ts` (`q, skills, location, mode, type, exp, lang, posted, salaryMin, sort, page`) and `toSearchParams` to build URLs. Jobs have a `searchText` field (title, company, skills, city, all spellings normalized) used by suggestions.
- **Normalization:** `src/lib/normalize.ts` (accents, Arabic diacritics/alef/ya/hamza forms). Use it for any matching.
- **Verification and devices:** `src/lib/accountSecurity.ts`. Hidden user fields are read with `showHiddenFields: true` by server code only.
- **Emails:** always through `queueEmail` (Payload jobs queue + `after()`), never directly, so a failing email never breaks a user action.

## 4. Rules that prevent breaking things

1. **Local API on behalf of a user:** always `{ user, overrideAccess: false }`. Without it, Payload bypasses access control.
2. **Schema change → migration:** after editing a collection or global run `pnpm generate:types`, then `pnpm payload migrate:create <name>`. Commit both files in `src/migrations/`.
   - The command asks "created or renamed?" for columns when a migration both adds and removes columns. It needs a real keyboard; answer **create column** (first option). To avoid the questions, split it into two migrations (add first, remove in a second one).
   - Data changes go in the migration's `up()` as plain SQL (no hooks run). See `20261012_073543_taxonomy_skills_locations.ts`.
   - `pnpm dev` uses Payload "push" on the dev database and may ask the same questions in the terminal: answer **create column**, and **yes** to dropping columns that only hold regenerable data.
3. **Never rename a field that holds live data** without a migration that moves the data. Prefer adding a new field.
4. **React Compiler lint rules are on:** no `setState` directly inside `useEffect`, no refs read during render, no manual `useMemo` around functions that touch refs. Use effect cleanups for debouncing (see `components/search/search-box.tsx`).
5. **Client components must not import collection files** (they pull server code into the browser). Shared constants go in `src/lib/` (example: `lib/reportReasons.ts`).
6. **Accessibility is tested:** axe runs in e2e. Avoid `text-muted-foreground` on `bg-muted` (contrast fails); use `text-foreground/70` or darker.
7. **Logical CSS** (`ms-`, `pe-`, `start-`, `text-start`) and theme color tokens, never `left/right` or hard-coded colors (RTL and dark mode are planned).
8. **Secrets:** only in `.env` (local), Vercel env vars (prod) and GitHub secrets (CI). Never commit or paste them. Keep `.env.example` names in sync.
9. **No new libraries without asking the owner.** Already approved: `@axe-core/playwright`.

## 5. Daily workflow

```bash
git checkout develop
pnpm dev                      # http://localhost:3000 (admin at /admin)
# … make changes …
pnpm lint && pnpm typecheck   # fast checks
pnpm test:unit && pnpm test:component
git add -A && git commit -m "feat: …"
git push                      # CI runs everything (lint, unit, component, int, e2e, build)
```

- **CI:** `.github/workflows/ci.yml` runs on pushes to `develop` and `main` and on pull requests. It uses the GitHub secrets `DATABASE_URI` (Neon CI branch) and `PAYLOAD_SECRET`, plus a Mailpit service. If the secret's password changes in Neon, update the GitHub secret.
- **Reading CI failures without logging in:** Playwright reports failures as GitHub annotations, which are public:
  `curl -s https://api.github.com/repos/SeddikBbz/job-board/check-runs/<job-id>/annotations`
- **Slow tests locally** (optional; CI runs them): stop `pnpm dev`, start `mailpit`, then `pnpm test:int`, `pnpm test:e2e`, `pnpm build`. Screenshot baselines (`tests/e2e/layout.e2e.spec.ts-snapshots/`) are Windows-only and skipped in CI. The first run after a design change recreates them.
- **e2e needs Mailpit:** sign-up confirms the email and new-browser sign-in reads the 6-digit code from Mailpit (`tests/e2e/helpers.ts`).

### Deploying

1. CI green on `develop`.
2. If the change migrates production data: make a Neon backup branch first and get the owner's OK.
3. `git checkout main && git merge --ff-only develop && git push`. Vercel runs `pnpm payload migrate && pnpm build` (`vercel.json`).
4. Check the live site (pages return 200, `/next/suggest?q=alger` returns Algiers).

## 6. Next steps (in order)

1. **After the Class 10 deploy (done), the owner should:**
   - In Admin → Companies, tick **trusted** for companies you already know, otherwise their next jobs wait for review.
   - Check `/privacy`, `/terms`, `/cookies` and fill in the `[placeholders]` in Admin → Content → Pages.
   - Check Admin → Settings → Site settings (spam phrases, limits, log retention).
2. **Class 16, operations baseline** (ROADMAP.md): backups and a restore drill, `/next/health`, uptime monitor, Sentry alerts, audit log for role, moderation and trust changes, admin widget.
3. **Beta checkpoint** (ROADMAP.md section 2), then Classes 6 (BCOS branding), 7 (settings), 8 (pipeline)…

### Open questions for the owner

- Contact email, address and retention period for the legal pages, and who reviews them.
- Infrastructure for Class 16: allowed to add an uptime monitor (UptimeRobot/Better Stack), Redis for rate limiting, cookieless analytics?
- Languages (Arabic/French/English) and whether Class 15 moves earlier.

## 7. Known limitations

- Rate limits are in memory, per Vercel instance. Add Vercel Firewall rules or Redis (Class 16).
- The "posted within / experience / language" filters exist in the URL and query but have no UI yet (Class 12).
- Old logos on production use the original image until `pnpm media:reprocess` runs there.
- The admin panel's own forms bypass our sign-up page; admins creating users there are auto-verified.
