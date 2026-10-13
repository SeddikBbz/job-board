# Job Board: Master Roadmap (your proposals + my earlier suggestions)

This is the **single ordered plan**. It merges:

- **Your proposals** (layout, images, auth redesign, skills, live search, BCOS, settings, pipeline), already detailed in `FEATURES.md` as **Classes 1-9**.
- **My earlier suggestions** for a professional platform (trust and safety, SEO, saved jobs and alerts, employer analytics, teams and payments, languages, operations). They are detailed below as **Classes 10-16**.

Keep `FEATURES.md` in the same folder. Class numbers 1-9 are unchanged, so nothing is renamed. Rules, test strategy and the test gate command are in `FEATURES.md` section 0 and apply to every class here. The Agent rules in `TASKS.md` section 0 also still apply.

---

## 1. Master order of work

| Order | Class | Priority | Effort | Depends on | Source |
|---|---|---|---|---|---|
| 1 | **1** Layout and design foundation | P0 | S-M | none | Yours |
| 2 | **2** Media upload and auto-resize | P0 | M | 1 | Yours |
| 3 | **3** Sign in and sign up redesign | P0 | M | 1 | Yours |
| 3b | **17** Installable mobile web app (PWA) | P0 | S | 1, 3 | Yours |
| 4 | **4** Skills and cities taxonomy | P0 | M | none | Yours |
| 5 | **5** Live search and suggestions | P0 | L | 4 | Yours |
| 6 | **10** Trust, safety and legal | P0 | L | 3 | Mine |
| 7 | **16** Operations baseline | P0 | M | none | Mine |
| 7b | **18** Home wilaya: local jobs first and local job alerts | P1 | M | 4, 5, 10, 16 | Yours |
| | **BETA LAUNCH CHECKPOINT** (see section 2) | | | | |
| 8 | **6** BCOS branding | P1 | S | 1 | Yours |
| 9 | **7** User settings | P1 | L | 2, 4 | Yours |
| 10 | **8** Candidate pipeline tracking | P1 | L | 7 | Yours |
| 11 | **11** SEO and growth | P1 | M | 4, 10 | Mine |
| 12 | **12** Candidate engagement (saved jobs, alerts) | P1 | L | 5, 7, 16 | Mine |
| 13 | **13** Employer tools (analytics, renewals) | P1 | M | 8, 16 | Mine |
| | **V2 RELEASE CHECKPOINT** (run Class 9) | | | | |
| 14 | **9** Hardening and release | P2 | M | all above | Yours |
| 15 | **15** Languages, RTL and dark mode | P1 if confirmed, else P2 | L | 1, 5 | Mine |
| 16 | **14** Teams and monetization | P2 | L | 8, 13 | Mine |

**Notes on the order**

- Class 6 (BCOS) is small. You can move it earlier, anywhere after Class 1, if you want the credit live sooner.
- Class 15: **decide now** whether you need Arabic, French and English. If yes, move it right after Class 5. Translating after most screens exist costs much more. Even if you delay it, follow the "RTL-ready" rule in section 3.
- Class 9 is a **checklist you re-run at every checkpoint**, not a one-time task.

---

## 2. Release checkpoints

### Beta launch (after order 7)

Do not invite real users before all of these are true:

- [ ] Classes 1-5, 10 and 16 are done and their test gates pass.
- [ ] Email verification and job moderation are active.
- [ ] Privacy policy and terms pages exist and are linked.
- [ ] Backups run and a **restore drill** succeeded at least once.
- [ ] Uptime monitoring and Sentry alerts reach your phone or email.
- [ ] Rate limiting and Turnstile protect login, register, apply and report.
- [ ] Smoke test on production passes.

### V2 release (after order 13)

- [ ] Everything above is still green.
- [ ] Run the **Class 9** checklist (performance, accessibility, security review, load test).
- [ ] Update `README.md` and `CHANGELOG.md`.

---

## 3. Cross-class changes (update earlier work to match)

When the agent builds a class, it must also adjust earlier classes where listed. These keep everything consistent and avoid refactors later.

| # | Change | Affects |
|---|---|---|
| 1 | **Job status values** become `draft`, `pending_review`, `published`, `closed`, `expired`, `rejected`. Only `published` (and not expired) is public. | Classes 4, 5, 11 (sitemap, suggestions, landing pages) |
| 2 | **RTL-ready and dark-ready from day one:** use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) and color tokens instead of hard-coded colors. | Class 1 and every later UI class |
| 3 | **Email verification is required** to apply, post jobs or upload; terms acceptance is stored at signup. | Class 3 (details in Class 10) |
| 4 | **One shared search parameter schema** (`q`, `skills`, `location`, `mode`, `type`, `exp`, `salaryMin`, `posted`, `lang`, `sort`, `page`) defined once with Zod. Used by live search, `/jobs` filters, saved searches, alerts and landing pages. | Classes 5, 11, 12 |
| 5 | **Notification preferences** also cover: job alert frequency, expiry reminders, moderation results, and `locale`. | Class 7, 8, 12, 13 |
| 6 | **Reuse the `notifications` collection** from Class 8 for moderation results, alerts and expiry reminders. | Classes 10, 12, 13 |
| 7 | **Company permission helper:** all access rules call `canManageCompany(user, companyId)` instead of comparing `company.owner` directly. Today it only checks the owner; Class 14 extends it to team members without rewriting every rule. | Classes 3-8 access functions |
| 8 | **Add `experienceLevel` and `contentLanguage` fields to jobs** (needed by filters, SEO and Class 15). | Class 4 migration |
| 9 | **Background jobs:** all emails and scheduled work go through the Payload jobs queue (see Class 16). | Classes 8, 10, 12, 13 |

---

## CLASS 17. Installable mobile web app (PWA) (P0, S)

**Goal:** on a phone, users can add the platform to the home screen and open it like an app (own icon, fullscreen, no browser bar), without an app store.

**Depends on:** Class 1 (layout) and Class 3 (auth pages look right on phones).

### 17.1 Installability

- [ ] `src/app/manifest.ts` (Next.js built-in, verify the current docs): `name`, `short_name`, `description`, `start_url: '/'`, `display: 'standalone'`, `theme_color` and `background_color` from the theme tokens, `orientation: 'portrait'`, `lang`, `dir`.
- [ ] App icons: 192 and 512 px PNG, plus a **maskable** 512 px icon (safe zone), `apple-touch-icon` 180 px, and favicon. Generated once from the logo with `sharp` (script), committed to `public/icons/`.
- [ ] `viewport` export: `themeColor`, and `viewport-fit=cover` with safe-area padding (`env(safe-area-inset-*)`) on the sticky header and bottom elements so notches don't hide content.
- [ ] iOS meta: `appleWebApp` metadata (`capable`, `title`, `statusBarStyle`).

### 17.2 Service worker and offline

- [ ] A small hand-written service worker in `public/sw.js` (no library), registered from a client component in production only.
- [ ] Cache strategy: static assets (`/_next/static/*`, icons, fonts) cache-first; pages network-first. **Never cache** `/api/*`, `/admin`, `/dashboard`, auth pages, resumes or anything per-user.
- [ ] Offline fallback page `/offline` ("You're offline, check your connection") shown when a page can't load.
- [ ] Versioned cache name; old caches deleted on `activate`. Update flow: when a new version is waiting, show a small "New version available, reload" toast.
- [ ] Security headers: serve `sw.js` with `Cache-Control: no-cache` and `Service-Worker-Allowed: /`; check the CSP allows the worker (`worker-src 'self'`).

### 17.3 Install experience

- [ ] "Install app" button in the mobile menu and the footer, shown only when the browser fires `beforeinstallprompt` (Android/Chrome) and hidden once installed (`display-mode: standalone`).
- [ ] iOS (no install prompt): a short hint in the mobile menu, "Tap Share, then Add to Home Screen", shown only on iOS Safari and dismissible (remembered on the device).
- [ ] Standalone mode polish: no layout jump under the status bar, back navigation works, external links open in the browser.

### 17.4 Tests

- [ ] **Unit:** cache routing rules (which URLs are cached, which are never cached, especially `/api`, `/dashboard`, `/admin`).
- [ ] **E2E:** `/manifest.webmanifest` returns valid JSON with the required fields and icons that load; the service worker registers in a production build; going offline on a visited page shows the cached page, and an unvisited page shows `/offline`; logged-in pages are never served from the cache after logout.
- [ ] **Manual (recorded):** Lighthouse "Installable" passes; install on a real Android phone and an iPhone, open from the home screen, log in, apply to a job.

**Test gate:** full gate command, plus the manual install check.
**Done when:** the site installs on Android and iOS, opens fullscreen with its own icon, shows a friendly offline page, and never caches private data.

---

## CLASS 18. Home wilaya: local jobs first and local job alerts (P1, M)

**Goal:** a candidate tells us where they live once. Jobs in their wilaya then show up first in search and suggestions, and they are told when a new job opens there, if they want to be.

**Depends on:** Class 4 (`locations` with the 58 wilayas), Class 5 (live search), Class 10 (verified emails), Class 16 (background jobs). Later merged into the Class 7 settings page (Profile tab) and the Class 12 alerts.

### 18.1 Data

- [ ] Add `homeWilaya` to `users`: relationship to `locations`, limited to Algerian wilayas (`country = Algeria` and `region = name`). Only the candidate (and admins) can read or change it; employers never see it.
- [ ] Add `localJobAlerts` to `users`: `off` | `instant` | `daily` (default `daily`), plus `localAlertsLastSentAt`.
- [ ] Add `wilaya` to `jobs` (relationship to `locations`), filled by a hook from `city`: the city itself when it is a wilaya, or the wilaya of the city (`region`) for cities like Bab Ezzouar → Algiers. Remote jobs have no wilaya. Migration backfills existing jobs.

### 18.2 Registration and profile

- [ ] Sign-up form (candidates only): "Wilaya of residence" select (58 wilayas, French and Arabic names searchable, optional with a short "why we ask" hint: "to show jobs near you first"). Saved by the register action, validated with Zod (must be a wilaya id).
- [ ] Candidates who signed up before can set it from a dashboard card ("Where do you live? Get local jobs first") and later in Settings (Class 7).
- [ ] Privacy policy: add the wilaya to "What we collect" and "Why we use it" (personal data under law 18-07, used only for ranking and alerts, editable and removable at any time).

### 18.3 Local jobs first

- [ ] Live suggestions (`/next/suggest`): when the visitor is a candidate with a home wilaya, jobs in that wilaya are listed first (then the others, as today), with a small "In your wilaya" label. Groups and limits stay the same; never show non-public jobs.
- [ ] `/jobs` results: same ordering for logged-in candidates when no explicit sort or location filter is chosen; a "Near you" chip shows the rule and can be turned off (adds `location` filter or `sort=newest`).
- [ ] Home page: a "Jobs in {wilaya}" section above "Latest jobs" when there are any.
- [ ] Ranking runs on the server (the wilaya is never put in the URL or exposed to other users); suggestion responses for logged-in candidates are not shared-cached (`Cache-Control: private`).

### 18.4 Local job alerts

- [ ] When a job becomes **published** (after moderation) with a `wilaya`, candidates whose `homeWilaya` matches and `localJobAlerts = instant` get a short email ("New job in {wilaya}: {title} at {company}") with a link and a one-click "stop these emails" link.
- [ ] `daily`: a scheduled task (`send-local-alerts`, jobs queue, idempotent) sends one digest per candidate with up to 10 new jobs in their wilaya since `localAlertsLastSentAt`; nothing is sent when there are none.
- [ ] Only verified, non-banned candidates; never more than one instant email per job per candidate; respects notification preferences (Class 7) once they exist.
- [ ] In-app: a dismissible banner on the candidate dashboard "3 new jobs in {wilaya} this week" linking to `/jobs?location={wilaya}` (later the Class 8 notification bell).
- [ ] Unsubscribe links are signed tokens (same helper as Class 12 alerts) and include the `List-Unsubscribe` header.

### 18.5 Tests

- [ ] **Unit:** city → wilaya mapping (wilaya itself, a city of a wilaya, Remote → none); ranking helper (home wilaya first, stable order otherwise); digest builder (limit 10, skips empty).
- [ ] **Integration:** `homeWilaya` is readable only by its owner and admins (never by an employer); a job published in Oran triggers one instant alert for an Oran candidate with `instant`, none for `off`, none for an unverified or banned candidate, none for a pending or rejected job; the daily task is safe to run twice; the migration backfill fills `wilaya` for existing jobs.
- [ ] **E2E:** register as a candidate choosing Oran; an employer's job in Oran is approved; the candidate sees it first in suggestions with "In your wilaya", and receives the email in Mailpit; the stop link works.
- [ ] **Accessibility:** the wilaya select has a label and works with the keyboard; the "In your wilaya" label is not color-only.

**Test gate:** full gate command.
**Done when:** a candidate who chose a wilaya at sign-up sees local jobs first and gets told about new ones there (or not, if they turn it off), and nobody else can see where they live.

---

## CLASS 10. Trust, safety and legal (P0, L)

**Goal:** protect candidates from scams, protect the platform from spam, and meet basic legal expectations before real users arrive.

**Depends on:** Class 3 (auth pages) and a working email adapter.

### 10.1 Email verification

- [ ] Enable Payload's auth email verification for `users` (verify the option names in the auth docs). Provide custom, branded HTML for the verification email.
- [ ] Add a helper `isVerified(user)` and use it in access rules: unverified users cannot apply, create jobs, upload media or report.
- [ ] "Verify your email" banner in the dashboard, with a resend button and a cooldown (for example 60 seconds).
- [ ] Admin-created users are verified automatically.

### 10.2 Job and company moderation

- [ ] Add `pending_review` and `rejected` to `jobs.status` (see cross-class change 1), with `rejectionReason` (text).
- [ ] Add `companies.trusted` (checkbox, admin only) and `companies.verified` (checkbox, admin only, shown as a badge).
- [ ] Workflow: when an employer publishes, a job from a **trusted** company becomes `published`; any other job becomes `pending_review`.
- [ ] Material edits (title, description, company) to a published job by a non-trusted company send it back to `pending_review`. Define "material" in one place.
- [ ] Admin review queue: a saved filter or custom admin view for `pending_review`, with approve and reject actions. Rejecting requires a reason and emails the employer.
- [ ] Approve sets `publishedAt`, revalidates public pages and notifies the employer.
- [ ] Access: the public and search suggestions **never** return `pending_review`, `rejected` or `draft`.

### 10.3 Automatic spam checks

- [ ] In a `beforeValidate` hook, flag (do not silently delete) jobs that match admin-managed rules: suspicious phrases ("pay to apply", "send money"), too many links, very short descriptions, free-email employers, repeated identical jobs.
- [ ] Duplicate detection: same company and similar title within 7 days.
- [ ] Per-employer limit on job creation per day (configurable).
- [ ] Store flags on the job so moderators see **why** it was flagged.

### 10.4 Reports

- [ ] Create `reports` collection: `targetType` (job, company, user), `target`, `reason` (scam, misleading, discriminatory, duplicate, offensive, other), `details`, `reporter` (optional), `status` (open, reviewing, actioned, dismissed), `handledBy`, `resolutionNote`.
- [ ] "Report this job" button and dialog on job pages (logged in or anonymous with Turnstile).
- [ ] Auto-flag a job for review when it has at least N distinct reports (default 3, configurable in `site-settings`).
- [ ] Admin actions: unpublish, ban employer, dismiss. Notify the employer when action is taken.
- [ ] Reports are visible only to admins.

### 10.5 Legal and privacy

- [ ] Pages: `/privacy`, `/terms`, `/cookies` (editable from admin through a `pages` collection or global). Link them in the footer and the sign up form.
- [ ] Store `termsAcceptedAt` and `termsVersion` on signup.
- [ ] Cookie consent banner only if you use non-essential cookies. A cookieless analytics tool may remove the need (verify requirements for your target countries).
- [ ] Data retention rules for resumes (for example delete on account deletion, and optionally after a retention period), written in the privacy policy.
- [ ] Have a qualified person review the legal pages. The agent can draft structure, but it is not legal advice.

### 10.6 Abuse control

- [ ] Enable login attempt limits and lockout (verify Payload's `maxLoginAttempts` and `lockTime` options).
- [ ] Rate limit register, login, apply, report and the suggestion endpoint.
- [ ] Turnstile on register, login, report and password reset.

### 10.7 Tests

- [ ] **Unit:** spam rules (each rule triggers and clean text passes), duplicate detection, "material edit" detector, report threshold logic.
- [ ] **Integration (access):** unverified user cannot apply or post; verified can; public API never returns pending, rejected or draft jobs; non-admin cannot read reports; non-admin cannot set `trusted` or `verified`.
- [ ] **Integration:** trusted company publishes directly; untrusted goes to `pending_review`; approve and reject send the right emails and set the right fields; N reports flag the job.
- [ ] **E2E:** register, receive verification email (Mailpit), verify, post a job, admin approves, job appears in `/jobs` and in suggestions; report flow end to end; legal pages are reachable from footer and signup; terms version stored.
- [ ] **Accessibility:** report dialog traps focus and closes with Escape.

**Test gate:** full gate command from `FEATURES.md`.
**Done when:** a scam-like job cannot reach the public without review, anyone can report it in two clicks, and legal pages are in place.

---

## CLASS 16. Operations baseline (P0, M)

**Goal:** you know when something breaks, you can recover from disaster, and background work is reliable.

### 16.1 Backups and recovery

- [ ] Check the point-in-time restore window of your Neon plan and write it down in `docs/runbooks/restore.md`.
- [ ] Add a scheduled GitHub Action that makes a logical database backup (`pg_dump`) and stores it encrypted in a private bucket.
- [ ] Plan for **files** (resumes are critical): copy blob contents periodically to a second storage location, or enable versioning if your provider offers it.
- [ ] **Restore drill:** restore the latest backup into a Neon test branch, run the app against it, compare record counts. Record the date and result in `docs/ops-log.md`.

### 16.2 Monitoring

- [ ] Add a health endpoint (for example `/next/health`) that checks the database quickly and returns 200 or 503. No secrets or versions in the response.
- [ ] Add an uptime monitor (UptimeRobot or Better Stack) for `/`, `/jobs` and the health endpoint, with alerts to your phone or email.
- [ ] Sentry: release tags, source maps, alert rules for new and frequent errors.
- [ ] Analytics: privacy-friendly (Plausible or Vercel Analytics). Track events without personal data: `search_used`, `job_viewed`, `apply_started`, `apply_submitted`, `signup_completed`.

### 16.3 Background work

- [ ] Confirm Payload's jobs queue is configured (verify the current jobs docs) and run by a protected cron endpoint (secret header check).
- [ ] Tasks: `send-email`, `expire-jobs`, and later `send-alerts` (Class 12) and `expiry-reminders` (Class 13).
- [ ] Retries with backoff, idempotency (a job can run twice safely), and a way to see failed tasks in the admin.
- [ ] Check your hosting plan's cron frequency limits (verify) and choose schedules accordingly.

### 16.4 Audit log and admin visibility

- [ ] Create `audit-logs` (read-only in admin): `actor`, `action`, `collection`, `documentId`, `summary`, `createdAt`. Write entries from `afterChange` and `afterDelete` hooks for sensitive changes: role changes, moderation decisions, company trust flags, report actions, account deletion.
- [ ] Admin dashboard widget: pending moderation, open reports, new users today, applications today, failed background tasks.

### 16.5 Resilience and hygiene

- [ ] Wrap non-essential page sections (similar jobs, stats, suggestions) in `Suspense` and error boundaries so one failure does not break the page.
- [ ] A failed email must never fail the user action (queue it and retry).
- [ ] CI check: fail the build if code reads an environment variable that is not listed in `.env.example`.
- [ ] Keep separate Neon branches for dev, test, preview and production. Write a secrets rotation checklist in the runbook.
- [ ] Verify security headers from `TASKS.md` M11 are active.

### 16.6 Tests

- [ ] **Integration:** health endpoint returns 200 normally and 503 when the database is unreachable (simulated); cron endpoint rejects requests without the secret; a failing task retries and ends up visible as failed; an audit entry is created when a role changes; rate limit returns 429 after the configured number of requests.
- [ ] **Unit:** env-var documentation check script; idempotency key helper.
- [ ] **E2E:** simulate an email provider outage (mock) and confirm that applying still succeeds and the email is retried later.
- [ ] **Manual, recorded:** restore drill done and logged; test alert received on your phone.

**Test gate:** full gate command, plus the manual items checked.
**Done when:** you receive an alert within minutes of an outage, you have restored a backup at least once, and emails and scheduled tasks are reliable.

---

## CLASS 11. SEO and growth (P1, M)

**Goal:** Google can find, understand and show your jobs, and every page is shareable.

### 11.1 Structured data

- [ ] Add `JobPosting` JSON-LD to job pages with: title, description, `datePosted`, `validThrough` (from `expiresAt`), `employmentType` (map `full-time` to `FULL_TIME`, and so on), `hiringOrganization` (name, website, logo), `jobLocation` (city, country), `baseSalary` only when salary exists, `identifier`, `directApply`.
- [ ] Remote jobs use the remote location markup instead of a fake address (verify current Google guidelines for remote jobs).
- [ ] Output JSON-LD **only** for published, non-expired jobs. Never for drafts, pending or closed.

### 11.2 Metadata and sharing

- [ ] `generateMetadata` for every public page: title (about 60 characters), description, canonical URL, Open Graph and Twitter card.
- [ ] Dynamic share image per job (`opengraph-image`, 1200x630) with title, company and logo.
- [ ] Share buttons: Web Share API on mobile, with copy link, WhatsApp and LinkedIn as fallback.

### 11.3 Crawling

- [ ] `sitemap.ts`: published non-expired jobs, companies, landing pages. Use `generateSitemaps` if the list grows large. Include `lastModified`.
- [ ] `robots.ts`: allow public pages, disallow `/dashboard`, `/admin`, `/next` and API routes, and point to the sitemap.

### 11.4 Landing pages

- [ ] `/jobs/skill/[slug]`, `/jobs/city/[slug]`, `/jobs/category/[slug]`, `/jobs/remote`, built from the shared search parameter schema.
- [ ] Each has a unique title, a short introduction and internal links. Mark `noindex` when fewer than N jobs (default 3) to avoid thin pages.
- [ ] Footer links to popular skills and cities for internal linking.

### 11.5 Lifecycle and URLs

- [ ] Keep `slugHistory` on jobs and companies and redirect old slugs permanently.
- [ ] When a job expires or closes: keep the page for a period with a clear "no longer available" message and similar jobs, remove JSON-LD, then `noindex`.
- [ ] Revalidate affected pages and sitemap when a job is published or closed.

### 11.6 Manual setup (checklist for you)

- [ ] Add the site to Google Search Console and Bing Webmaster Tools, submit the sitemap, and check the Rich Results Test on a few job pages.

### 11.7 Tests

- [ ] **Unit:** JSON-LD builder (all employment types, remote job, with and without salary, `validThrough`), slug history redirect logic, landing page indexability rule.
- [ ] **Integration or E2E:** sitemap contains published jobs only (not draft, pending, rejected, expired); robots blocks dashboard and admin; each job page has one canonical URL and valid JSON-LD that parses; closed job has no JSON-LD; old slug returns a permanent redirect; OG image route returns a 1200x630 image.
- [ ] **Accessibility:** share menu works by keyboard.

**Test gate:** full gate command.
**Done when:** the Rich Results Test accepts your job pages and the sitemap never leaks private or unpublished content.

---

## CLASS 12. Candidate engagement (P1, L)

**Goal:** give candidates reasons to come back: saved jobs, alerts, better discovery.

**Depends on:** Class 5 (search), Class 7 (preferences), Class 16 (queue and cron).

### 12.1 Saved jobs

- [ ] `saved-jobs` collection: `user`, `job`, `createdAt`, unique per user and job (enforce in a hook).
- [ ] Heart button on cards and job pages with optimistic update and rollback.
- [ ] `/dashboard/saved` page: list, remove, and a "closed" or "expired" badge when the job is no longer open.

### 12.2 Saved searches and email alerts

- [ ] `saved-searches` collection: `user`, `name`, `filters` (validated by the shared Zod schema), `frequency` (`off` | `daily` | `weekly`), `lastSentAt`. Limit of 5 per user.
- [ ] "Save this search and get alerts" button on `/jobs` when filters are active.
- [ ] Scheduled task `send-alerts`: for each saved search, find jobs published since `lastSentAt` using the **same** query builder as live search; send one digest email (maximum 10 jobs); skip if none; update `lastSentAt`.
- [ ] Digest emails include a signed one-click unsubscribe link and the `List-Unsubscribe` header.
- [ ] Respect notification preferences and verified email only. The task must be idempotent and process in batches.

### 12.3 Discovery

- [ ] **Similar jobs** on the job page (shared skills and same city or category, excluding itself, maximum 6), streamed with `Suspense`.
- [ ] **Advanced filters** on `/jobs`: salary minimum and currency, experience level, posted within (24 hours, 7 days, 30 days), company size, remote only, language of the posting, and sort (newest, salary, relevance).
- [ ] Recently viewed jobs (stored on the device) shown on the home page.
- [ ] **Quick apply** from the profile and default resume (Class 7): confirm dialog with optional cover letter.

### 12.4 Tests

- [ ] **Unit:** filters to `where` conversion for every new filter, digest builder (limits, ordering), unsubscribe token sign and verify (tampered or expired tokens rejected).
- [ ] **Integration:** saved job is unique and visible only to its owner; alert task sends once per period, is safe to run twice, ignores closed or unpublished jobs, respects preferences and frequency `off`, sends nothing when there are no matches; the five-searches limit is enforced.
- [ ] **E2E:** save a job and find it in the saved page; create an alert from filters; run the task manually and read the digest in Mailpit; the unsubscribe link works; similar jobs never include the current job or unpublished jobs; quick apply creates an application with the default resume.
- [ ] **Accessibility:** heart button has an accessible name and pressed state.

**Test gate:** full gate command.
**Done when:** a candidate can save a search once and receive relevant new jobs without visiting the site, and can stop alerts with one click.

---

## CLASS 13. Employer tools (P1, M)

**Goal:** employers see how their jobs perform and manage them with less effort.

**Depends on:** Class 8 (pipeline), Class 16 (queue and cron).

### 13.1 Job analytics

- [ ] Track job views with a small endpoint called by the job page (use `sendBeacon`). Ignore bots, ignore views by the job's own employer team and admins, and rate limit it.
- [ ] Store daily counters in `job-stats-daily`: `job`, `date`, `views`, `applications`. Do **not** store personal data. Update the privacy policy if tracking changes.
- [ ] Employer dashboard overview: active jobs, new applicants this week, applicants per stage, average time to first response.
- [ ] Per-job table (sortable): views, applications, conversion rate, days left. A simple line chart of applications per day.

### 13.2 Job management

- [ ] **Duplicate job** action: creates a draft copy with a new slug.
- [ ] **Preview before publishing** and a checklist (salary set, skills added, description long enough, expiry date set).
- [ ] **Expiry reminders:** scheduled task emails the employer 3 days before `expiresAt`, with a one-click **Renew for 30 days** action (idempotent).
- [ ] Draft autosave in the job form (debounced).
- [ ] Rich text safety: sanitize or serialize safely when rendering descriptions, and restrict the editor to the formatting you support. No raw HTML injection.

### 13.3 Applicant management extras (P2)

- [ ] Export applicants to CSV (own jobs only).
- [ ] Saved reply templates for common messages.
- [ ] Show candidates "Usually responds within X days" from real data.

### 13.4 Tests

- [ ] **Unit:** stats aggregation and conversion rate (including zero views), expiry reminder date calculation, "material" checklist rules.
- [ ] **Integration:** employer sees stats only for their own jobs; tracking endpoint ignores bot user agents, ignores the employer's own views, and is rate limited; reminder task sends once per job; renew extends the date and a second click does not extend again; duplicate creates a draft.
- [ ] **E2E:** a candidate views and applies; the employer dashboard shows the new view and application counts; renew from the email link works; sanitized description cannot run script (XSS test with a malicious payload).
- [ ] **Accessibility:** the chart has a text alternative or data table.

**Test gate:** full gate command.
**Done when:** employers see real numbers per job, never miss an expiry, and the XSS test passes.

---

## CLASS 15. Languages, RTL and dark mode (P1 if confirmed, else P2)

**Goal:** the platform works naturally in Arabic, French and English, in right-to-left layout, and in light and dark themes.

> **Decide now:** if you need multiple languages, schedule this class right after Class 5. If not, still follow cross-class change 2 so you can add it later cheaply.

### 15.1 Strategy

- [ ] Decide which languages launch (suggested: `ar`, `fr`, `en`) and the default.
- [ ] **UI text** is translated. **Employer-written job content is not translated automatically.** Add `contentLanguage` to jobs (already in cross-class change 8) and allow filtering by it.
- [ ] Taxonomy (skills, categories, cities) and site pages use Payload localization (verify the localization docs) so names exist in each language.

### 15.2 Implementation

- [ ] Locale routing (for example `/ar/jobs`) with a library such as `next-intl` (ask the owner before adding it). Set `<html lang>` and `dir` per locale.
- [ ] Message files `messages/ar.json`, `fr.json`, `en.json`. No hard-coded user-facing strings; add a script that fails CI when keys differ between files.
- [ ] RTL: logical CSS everywhere, mirror direction-sensitive icons (arrows, chevrons), stepper and pagination direction, and test the dropdowns and the pipeline board.
- [ ] Arabic-capable web font loaded with `next/font`. Use Western digits consistently unless the owner decides otherwise.
- [ ] Dates, numbers and currency through `Intl` per locale (including DZD).
- [ ] Emails are sent in the user's `locale`.
- [ ] Language switcher in header and footer; remember the choice in a cookie and in user settings.
- [ ] SEO: `hreflang` alternates, per-locale canonical URLs and sitemap entries.
- [ ] Extend the search normalizer for Arabic: remove diacritics and tatweel, unify alef and ya forms.

### 15.3 Dark mode

- [ ] Theme tokens for light and dark, a toggle with system default, saved in user settings, and **no flash of the wrong theme** on load.
- [ ] Logo variants (light and dark), chart colors, and image treatment checked in dark mode.

### 15.4 Tests

- [ ] **Unit:** Arabic normalizer cases, message key parity across locales, date, number and currency formatters.
- [ ] **E2E:** switching language changes URL, `lang` and `dir`; search suggestions work with Arabic and French input; emails arrive in the user's language; theme choice persists after reload with no flash.
- [ ] **Visual:** screenshots of `/`, `/jobs`, `/login` and the dashboard in Arabic (RTL) at 360 and 1280 px, and in dark mode.
- [ ] **Accessibility:** axe passes in RTL and dark mode (contrast).

**Test gate:** full gate command.
**Done when:** every screen can be used in Arabic with correct mirroring, and the language and theme choice persist.

---

## CLASS 14. Teams and monetization (P2, L)

**Goal:** companies can have several recruiters, and the platform can earn revenue.

**Depends on:** Class 8 and Class 13. Uses the `canManageCompany` helper from cross-class change 7.

### 14.1 Team accounts

- [ ] `company-members` collection: `company`, `user`, `role` (`owner` | `recruiter` | `viewer`), `status` (`invited` | `active`).
- [ ] Invitations by email with a signed token (expires in 7 days). Accept flow for existing users and new signups.
- [ ] Extend `canManageCompany` and the applicant access rules to use membership roles: owner manages everything and billing, recruiter manages jobs and applicants, viewer reads only.
- [ ] Remove a member (access ends immediately), and transfer ownership.
- [ ] Show who wrote each internal note and who moved each application. Record team actions in the audit log.

### 14.2 Payments for featured jobs

> **Verify first:** Stripe may not support merchant accounts for businesses based in Algeria. Check availability before building. Local options to evaluate include Chargily Pay or SATIM-based payment (CIB and Edahabia), or manual bank transfer with admin approval.

- [ ] Build a small `PaymentProvider` interface (`createCheckout`, `handleWebhook`) so the provider can be swapped without touching the rest of the code.
- [ ] `orders` collection: `company`, `job`, `provider`, `providerReference`, `status` (pending, paid, failed, refunded), `amount`, `currency`, `paidAt`.
- [ ] "Feature this job (30 days)" action leading to checkout. Webhook route verifies the signature, is idempotent by event id, and on payment sets `job.featured` and `featuredUntil`.
- [ ] Featured jobs appear first in lists with a clear **"Featured"** label (never disguised as normal results). A scheduled task removes the feature when time ends.
- [ ] Fallback: admin can mark an order as paid manually (bank transfer).
- [ ] Pricing page and billing section in employer settings (orders and receipts).

### 14.3 Tests

- [ ] **Unit:** permission matrix (owner, recruiter, viewer against every action), invitation token expiry and tampering.
- [ ] **Integration:** a viewer cannot edit jobs; a removed member loses access immediately; an invalid webhook signature returns 400; the same event delivered twice is processed once; a paid order sets featured fields; the expiry task unfeatures at the right time; provider swap test using a fake provider.
- [ ] **E2E:** owner invites a recruiter, who accepts and posts a job; checkout in the provider's **test mode**; the featured label and ordering appear; manual mark-as-paid works.

**Test gate:** full gate command.
**Done when:** permissions are proven by tests for all three roles and a paid order reliably features a job, exactly once.

---

## CLASS 9. Hardening and release (re-run at every checkpoint)

Full checklist is in `FEATURES.md` (Class 9). Run it at the Beta, V2 and final releases. Extra items from the new classes:

- [ ] Search every Local API call made for a user: `user` and `overrideAccess: false` are passed.
- [ ] Confirm no public query can return `pending_review`, `rejected`, `draft`, `closed` or expired jobs, including suggestions, sitemap, landing pages, alerts and similar jobs.
- [ ] Re-run the restore drill if the schema changed a lot.
- [ ] Check email deliverability for the sending domain (SPF, DKIM, DMARC configured and passing).
- [ ] Run a load test that includes search suggestions, alerts running in the background, and applying.

---

## 4. Global Definition of Done (every task)

- Code compiles, lint passes, no TypeScript errors.
- Types regenerated and a **migration committed** for every schema change.
- Each new access rule has one allowed and one denied test.
- No secrets, no leftover `console.log`.
- Works on a 360 px phone and a 2560 px monitor, in light and dark, and keeps RTL-ready CSS.
- Clear commit message, and documentation updated if behavior changed.

## 5. Questions to confirm with the owner

1. **Languages:** which of Arabic, French and English at launch, and should Class 15 move up?
2. **Moderation policy:** review every new employer's jobs, or trust employers after the first approved job?
3. **Payments:** which provider works for your business country (see Class 14), or manual transfer first?
4. **Legal:** who reviews privacy policy and terms before beta?
5. **Infrastructure additions:** allowed to add Redis for rate limiting (for example Upstash), a cookieless analytics tool, and an uptime monitoring service?
6. **Hosting limits:** check cron frequency and function limits of your hosting plan, since alerts and reminders depend on them.
7. **Libraries:** `next-intl`, `next-themes`, `@dnd-kit`, `react-hook-form`, a chart library, and an image cropper. Approve or reject each.
8. **BCOS details:** name spelling, URL, logo files, tagline, contact link (from `FEATURES.md` Class 6).
