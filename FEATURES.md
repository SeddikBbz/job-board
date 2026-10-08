# Job Board: Feature Roadmap v2 (Priorities, Classes, Tasks, Tests)

The platform already runs. This file adds improvements on top of it.
Give it to your coding agent together with `TASKS.md`. The **Agent rules** in `TASKS.md` section 0 still apply.

---

## 0. How to use this file

### Priority legend

| Tag | Meaning |
|---|---|
| **P0** | Do first. Users feel it immediately, or other features depend on it |
| **P1** | Important. Do after P0 |
| **P2** | Polish and hardening. Do last |

Effort: **S** (under 1 day), **M** (1-3 days), **L** (3-7 days). These are rough estimates for one developer.

### Order of work

| # | Class | Priority | Effort | Depends on |
|---|---|---|---|---|
| 1 | Layout and design foundation | P0 | S-M | none |
| 2 | Media upload and auto-resize | P0 | M | 1 |
| 3 | Sign in and sign up redesign | P0 | M | 1 |
| 4 | Skills and cities taxonomy | P0 | M | none |
| 5 | Live search and suggestions | P0 | L | 4 |
| 6 | BCOS branding and marketing placements | P1 | S | 1 |
| 7 | User settings (candidate and employer) | P1 | L | 2, 4 |
| 8 | Candidate application pipeline tracking | P1 | L | 7 (notification preferences) |
| 9 | Hardening and release | P2 | M | all |

### Rules for every class

1. Work **one task at a time**, then run the tests listed for it. Do not start the next feature while tests fail.
2. The platform is live, so **every schema change needs a migration** (`pnpm payload migrate:create`). Test it on a Neon `test` branch first, and back up (or branch) before touching production data.
3. After changing collections or globals, run `pnpm payload generate:types`.
4. Each class ends with a **Test gate**. A class is finished only when the gate passes and its "Done when" is true.
5. Use `data-testid` attributes on important UI elements so end-to-end tests stay stable.
6. Never invent Payload or Next.js APIs. Check the official docs for the exact option names when this file says "verify".

### Test strategy (used by every class)

| Level | Tool | What it covers |
|---|---|---|
| Unit | Vitest | Pure functions: normalizers, query builders, validators, state machines |
| Component | Vitest and Testing Library | Interactive components: search box, skill picker, forms |
| Integration | Vitest and Payload Local API on a **test database** | Collections, hooks, access control by role (`overrideAccess: false`) |
| End to end | Playwright | Real user flows in a browser |
| Accessibility | `@axe-core/playwright` | No serious or critical violations on key pages |
| Visual | Playwright screenshots | Layout at several screen widths |

**Test database:** use a dedicated Neon `test` branch (or a local Postgres). Reset it with Payload's migrate commands before integration runs. Never run tests against dev or production data.

**Test gate command (run at the end of every class):**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

Add these scripts to `package.json` if missing: `test` (Vitest), `test:e2e` (Playwright).

---

## CLASS 1. Layout and design foundation (P0, S-M)

**Goal:** the site uses the full browser space on every screen size, with no horizontal scroll and a footer that always sits at the bottom.

### 1.1 Page frame

- [ ] Make the root layout a full-height column: `min-h-dvh` on `body`, `flex flex-col`, and `flex-1` on `main`. Use `dvh` (not `vh`) so mobile browsers do not cut the page.
- [ ] Remove fixed pixel widths from page containers. Check the root layout, header, footer and dashboard layouts.
- [ ] Create one `Container` component: `w-full` with fluid side padding, for example `padding-inline: clamp(1rem, 3vw, 4rem)`. No narrow `max-w-*` on page-level containers.
- [ ] Keep **text blocks** readable: cap long text (job description, about page) at about `70ch` inside the full-width layout. Everything else (grids, tables, filters) uses the full width.
- [ ] Add `overflow-x: clip` on `html` and `body` as a safety net, but fix the real cause of any overflow.
- [ ] Confirm the viewport meta tag exists (Next.js adds it by default; verify).

### 1.2 Fluid grids

- [ ] Job and company lists use `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))` so the number of columns adapts to the screen (1 on phone, 4 or more on large monitors).
- [ ] Dashboard layout: sidebar plus content fills the full height (`min-h-dvh`); the sidebar collapses to a drawer on small screens.
- [ ] Tables scroll inside their own container (`overflow-x-auto`), never the page.
- [ ] Define spacing and font-size tokens once (Tailwind theme), so the layout does not drift.

### 1.3 Tests

- [ ] **Playwright visual and layout test** at widths 360, 768, 1280, 1920 and 2560. For each key page (`/`, `/jobs`, `/jobs/[slug]`, `/login`, `/dashboard`) assert:
  - `document.documentElement.scrollWidth <= clientWidth` (no horizontal scroll)
  - the main content width is at least 90 percent of the viewport width minus gutters (full-width check)
  - on a page with very little content, the footer's bottom edge touches the viewport bottom (sticky footer)
- [ ] Component test for `Container` (renders children, applies fluid padding).
- [ ] Screenshot baselines saved for the five widths.

**Test gate:** run the gate command.
**Done when:** on a 2560 px monitor and on a 360 px phone, the site fills the screen, nothing scrolls sideways, and the footer never floats mid-page.

---

## CLASS 2. Media upload and automatic resizing (P0, M)

**Goal:** users can upload a picture of **any size or shape**. The platform stores a sensible original and generates the dimensions it needs.

### 2.1 Upload pipeline (backend)

- [ ] Make sure `sharp` is configured in `payload.config.ts`.
- [ ] Update the `media` collection `upload` settings. Verify exact option names in the Payload upload docs (`imageSizes`, `resizeOptions`, `formatOptions`, `focalPoint`, `crop`, `adminThumbnail`, `mimeTypes`):
  - accepted types: JPEG, PNG, WebP, AVIF, static GIF
  - resize the **original** so the longest side is at most 2400 px, never enlarging smaller images (`fit: inside`, `withoutEnlargement: true`)
  - convert to WebP (quality about 80) to save bandwidth; keep transparency for logos
  - auto-rotate using EXIF orientation, then strip EXIF metadata (privacy, smaller files)
- [ ] Define generated sizes:

| Size name | Dimensions | Fit | Used for |
|---|---|---|---|
| `thumb` | 160 x 160 | cover (center or focal point) | avatars in lists, admin thumbnails |
| `avatar` | 400 x 400 | cover | profile pages |
| `logo` | 400 x 200 | **inside** (no cropping, keeps transparent background) | company logos |
| `card` | 640 wide | inside | company and job cards |
| `hero` | 1600 wide | inside | cover banners |
| `og` | 1200 x 630 | cover | social media previews |

- [ ] Add a `kind` field (`avatar` | `logo` | `cover` | `other`) and `uploadedBy` (relationship to `users`, set by hook). Add required `alt` text (default it from the company or user name).
- [ ] Limits: maximum file size 8 MB (check Payload's upload limit setting), and reject images with an extreme pixel count (decompression-bomb protection, for example above 50 megapixels).
- [ ] Access: public read; any logged-in user can create; only the uploader or an admin can update or delete.
- [ ] Handle phone formats: if HEIC/HEIF is not supported by the server's image library, return a clear error message ("Please upload JPG, PNG or WebP").
- [ ] Migration: existing logos are re-processed so old uploads also get the new sizes (script using the Local API, run once).

### 2.2 Frontend usage

- [ ] Create a reusable `ImageUpload` component: file picker and drag and drop, instant preview, client-side check of type and size (friendly errors), upload progress, remove button.
- [ ] Optional for avatars: crop and zoom before upload (a small cropper library, ask the owner before adding a dependency).
- [ ] Create `Avatar` and `CompanyLogo` components that use `next/image` with the right generated size, `sizes` set, and a **fallback** (initials for people, first letter on a colored tile for companies).
- [ ] Configure `images.remotePatterns` in `next.config` for the storage domain.
- [ ] Use `object-cover` (avatars, covers) and `object-contain` (logos) so any aspect ratio looks correct in fixed frames.

### 2.3 Tests

- [ ] **Integration tests** (Local API, using fixture images in `tests/fixtures/`): upload a tiny 50x50, a normal 1000x800, a huge 6000x4000, a very wide 4000x300, a very tall 300x4000, a transparent PNG, an EXIF-rotated photo. Assert:
  - the original longest side is at most 2400 px, and small images are not enlarged
  - every size in the table exists with the expected dimensions (logo keeps its aspect ratio)
  - the stored file is WebP, and EXIF is gone
  - a `.pdf` renamed to `.png`, an `.svg`, and a 20 MB file are rejected with a clear error
- [ ] Access tests: another user cannot update or delete my image; an anonymous user cannot upload.
- [ ] **Component tests** for `ImageUpload` (rejects wrong type and size before upload, shows preview) and the `Avatar` fallback.
- [ ] **E2E:** a candidate uploads an avatar and sees it in the header; an employer uploads a logo and sees it on a job card and on the company page.

**Test gate:** run the gate command.
**Done when:** uploading a 12 MP phone photo, a 40 px icon and a wide banner all produce good looking, correctly sized images with no layout breakage.

---

## CLASS 3. Sign in and sign up redesign (P0, M)

**Goal:** a professional, fast auth experience. The right-side blue card is useful and clean instead of crowded.

### 3.1 Layout

- [ ] Two columns from the `lg` breakpoint: **left** = form (centered, about 420 px wide), **right** = brand panel. Below `lg`, the panel is hidden or reduced to a slim brand strip above the form.
- [ ] Both columns fill the full viewport height (`min-h-dvh`).
- [ ] Same shell for login, register, forgot password and reset password.

### 3.2 Right panel (the blue card)

Keep only what helps the user decide or trust the platform:

- [ ] One short headline (maximum 8 words) and one supporting line.
- [ ] **Three** short benefits with icons. Content changes with the selected role:
  - Candidate: "Find jobs that fit your skills", "Track every application", "Apply in one click"
  - Employer: "Post a job in minutes", "Manage applicants in one place", "Reach qualified candidates"
- [ ] Optionally one **real** statistic from the database (for example open jobs count), cached, and **hidden if the number is small or zero**.
- [ ] Remove: filler text, fake testimonials, fake numbers, repeated navigation links, long paragraphs, decorative clutter.
- [ ] Style: consistent brand blue gradient from the theme tokens, good contrast (text and icons must pass WCAG AA), one light illustration at most.

### 3.3 Form quality

- [ ] Sign up: name, email, password, **role selector** (segmented control: Candidate | Employer), terms checkbox with links.
- [ ] Show or hide password, password rules shown only when relevant, inline validation (Zod shared by client and server).
- [ ] Correct `autocomplete` attributes (`email`, `current-password`, `new-password`, `name`).
- [ ] Loading state on the submit button, disabled while submitting, clear error messages (wrong password, email in use, rate limited).
- [ ] Turnstile integrated without extra clutter.
- [ ] After login, redirect to the page the user wanted via a `next` parameter. **Validate that `next` is a relative path** (prevent open redirect).
- [ ] After sign up: "Check your email" screen with a resend button if email verification is enabled.
- [ ] Keyboard friendly: logical tab order, Enter submits, focus goes to the first error.

### 3.4 Tests

- [ ] **Unit:** `next` URL sanitizer (accepts `/dashboard`, rejects `https://evil.com`, `//evil.com`, `javascript:`); password rule helper; Zod schemas.
- [ ] **Component:** role toggle changes the panel text; show or hide password works.
- [ ] **E2E:** register as candidate, register as employer, login, wrong password error, duplicate email error, redirect back via `next`, logout.
- [ ] **Accessibility:** axe finds no serious violations on `/login` and `/register`; all inputs have labels.
- [ ] **Visual:** screenshots at 360, 768, 1280 and 1920 (panel hidden on small screens).

**Test gate:** run the gate command.
**Done when:** auth pages look consistent on every screen, the panel contains only meaningful content, and all flows pass in Playwright.

---

## CLASS 4. Skills and cities taxonomy (P0, M)

**Goal:** structured skills (grouped by field) and cities, ready to power filters, profiles and search suggestions.

### 4.1 Skills

- [ ] Create `skill-categories` collection: `name`, `slug`, `icon`, `order`.
- [ ] Create `skills` collection: `name`, `slug`, `categories` (relationship, `hasMany`, because skills like Python or SQL belong to several fields), `aliases` (text, `hasMany`, for example "js" for JavaScript, "reactjs" for React), `popular` (checkbox), `order`.
- [ ] Add a normalized `searchText` field (lowercase, no accents) filled by a hook from name and aliases.
- [ ] Public read, admin-only write. Add DB indexes on `slug` and `searchText`.
- [ ] Seed script (idempotent) with the starting set below. The admin can add or edit skills later.

**Starter taxonomy** (skills may repeat across categories):

| Category | Skills |
|---|---|
| **Frontend** | HTML, CSS, JavaScript, TypeScript, React, Next.js, Vue.js, Nuxt, Angular, Svelte, Tailwind CSS, Sass, Redux, Vite, Webpack, Web Accessibility, Web Performance |
| **Backend** | Node.js, Express, NestJS, Python, Django, FastAPI, Flask, Java, Spring Boot, PHP, Laravel, C# and .NET, Go, Ruby on Rails, REST APIs, GraphQL, Microservices, Authentication (OAuth, JWT), WebSockets |
| **Mobile** | React Native, Flutter, Swift, SwiftUI, Kotlin, Android, iOS, Ionic |
| **Databases** | PostgreSQL, MySQL, MongoDB, Redis, SQLite, SQL, Elasticsearch, Prisma, Database Design |
| **DevOps and Cloud** | Docker, Kubernetes, AWS, Azure, Google Cloud, CI/CD, GitHub Actions, Terraform, Linux, Nginx, Ansible, Monitoring |
| **Data and AI** | Python, SQL, Pandas, Data Analysis, Machine Learning, Deep Learning, TensorFlow, PyTorch, NLP, LLMs, Power BI, Tableau, Apache Spark |
| **QA and Testing** | Manual Testing, Test Automation, Jest, Vitest, Playwright, Cypress, Selenium, Postman |
| **UI/UX Design** | Figma, Wireframing, Prototyping, User Research, Design Systems, Adobe XD, Photoshop, Illustrator |
| **Cybersecurity** | Network Security, Penetration Testing, OWASP, Cryptography, SIEM, Incident Response |
| **Product and Management** | Agile and Scrum, Jira, Product Management, Project Management, Business Analysis |
| **Soft skills** | Communication, Teamwork, Problem Solving, Leadership, Time Management |
| **Languages** | Arabic, French, English, Spanish, German |

### 4.2 Cities

- [ ] Create `locations` collection: `name`, `slug`, `country`, `region` (for Algeria: the wilaya), `aliases` (for example "Alger", "Algiers", the Arabic name), `searchText`, `isRemote` flag for a "Remote" entry.
- [ ] Seed all Algerian wilayas and main cities with English, French and Arabic names as aliases, plus a few international cities and a "Remote" entry. Admin can add more.
- [ ] Normalization helper shared by seed, hooks and search: lowercase, remove accents (é, è, ç), normalize Arabic letter variants (for example alef forms) and trim spaces.

### 4.3 Connect to existing data (migration on live data)

- [ ] Change `jobs.skills` from free text to a relationship to `skills` (`hasMany`). Plan: add the new field, backfill by matching old text against `name` and `aliases`, keep unmatched values in a temporary `legacySkills` text field for review, then remove the old field in a later migration.
- [ ] Change `jobs.location` to a relationship to `locations`, keeping a `locationText` fallback for unmatched values.
- [ ] Update seed data and forms accordingly.

### 4.4 Skill picker component

- [ ] `SkillPicker`: grouped by category (collapsible sections), searchable, multi-select with chips, maximum number of selected skills (15), keyboard accessible. Shows "popular" skills first.
- [ ] Used in: job creation form, candidate profile, search filters.

### 4.5 Tests

- [ ] **Unit:** normalizer (accents, Arabic variants, aliases) and alias matching.
- [ ] **Integration:** seed is idempotent (running twice creates no duplicates); public can read, non-admins cannot write; the backfill migration maps "ReactJS" and "reactjs" to React and puts unknown values into `legacySkills`.
- [ ] **Component:** `SkillPicker` search, select, remove, and max limit.
- [ ] **E2E:** an employer creates a job choosing skills from several categories; the job page shows them grouped or as chips.

**Test gate:** run the gate command.
**Done when:** every job and profile uses structured skills and cities, and no old free-text value is lost.

---

## CLASS 5. Live search and suggestions (P0, L)

**Goal:** the first page search works while the user types. No "Search" button is needed. The user sees job, skill, city and company suggestions instantly.

### 5.1 Backend: suggestion endpoint

- [ ] Create a route handler at `src/app/(frontend)/next/suggest/route.ts` (outside Payload's `/api` space to avoid conflicts).
- [ ] Input: `q` (trim, maximum 60 characters, normalize). Minimum 2 characters.
- [ ] Output (JSON), small and fast:
  - `jobs` (top 5: title, company, slug) from **published, non-expired** jobs only
  - `skills` (top 5, includes category)
  - `locations` (top 5)
  - `companies` (top 3)
- [ ] Use `select` with only the needed fields, `depth: 0` or `1`, `limit` per group, and run the groups in parallel with `Promise.all`.
- [ ] Search against the normalized `searchText` fields. Add `searchText` to jobs (title, company name, skill names) via hook.
- [ ] Add database indexes. Optionally add `pg_trgm` GIN indexes in a migration for fast `like` and fuzzy matching (verify the extension is available on Neon).
- [ ] Rate limit the endpoint and add a short cache header for repeated prefixes.
- [ ] Empty `q` returns **popular** suggestions (popular skills, top cities, curated popular searches).

### 5.2 Frontend: search box

- [ ] `SearchBox` client component on the home page hero and at the top of `/jobs`:
  - fires automatically after **250-300 ms** without typing (debounce)
  - cancels the previous request when typing continues (`AbortController`)
  - on focus with empty text, shows recent searches (stored locally on the device) and popular suggestions
  - suggestions are **grouped** (Jobs, Skills, Cities, Companies) with the matched text highlighted
  - clicking a **job** opens it; clicking a **skill** or **city** adds it as a filter chip and updates the URL; pressing Enter searches the typed text
- [ ] Follow the accessible **combobox** pattern: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, arrow keys move, Enter selects, Escape closes.
- [ ] The results list under the box **updates automatically** while typing: update the URL with `router.replace` (not `push`, to avoid filling browser history), and use `useTransition` so the UI stays responsive.
- [ ] Loading and empty states: skeleton while loading, and for no results show a helpful message with suggestions (remove a filter, try a nearby city, popular skills).
- [ ] Filters on `/jobs` reuse the same URL parameters (`q`, `skills`, `location`, `mode`, `type`), and show active filters as removable chips.
- [ ] Mobile: full-width box, suggestions in a scrollable panel, large touch targets.

### 5.3 Tests

- [ ] **Unit:** query normalizer; URL parameter builder and parser; debounce helper.
- [ ] **Integration (endpoint):**
  - returns only published and non-expired jobs
  - respects group limits, and rejects `q` longer than 60 characters or shorter than 2
  - "alger", "Alger" and "algiers" all find the same city; accent variations work
  - an alias ("reactjs") finds the React skill
  - response time stays reasonable on the seed data (set a generous local budget, for example under 300 ms)
- [ ] **Component:** typing triggers one request after the debounce (not one per key); a slower old response never overwrites a newer one; arrow keys, Enter and Escape behave correctly.
- [ ] **E2E:**
  - type "rea" on the home page and see skill and job suggestions **without clicking anything**
  - choose a city, and the results list filters and the URL updates
  - complete the whole flow with the keyboard only
  - draft and closed jobs never appear in suggestions
- [ ] **Accessibility:** axe on the page with the dropdown open.

**Test gate:** run the gate command.
**Done when:** a user types two letters on the first page and immediately sees relevant jobs, skills and cities, and the list below updates with no button press.

---

## CLASS 6. BCOS branding and marketing placements (P1, S)

**Goal:** show that the platform was **built by the BCOS online team**, in places that promote the team **without bothering users**.

> Confirm with the owner before coding: exact company name and spelling, website URL, logo files (light and dark versions), short tagline, and contact link. Use placeholders until then. Do not invent claims about the company.

### 6.1 Central configuration

- [ ] Create a Payload **global** `site-settings` with a `builtBy` group: `enabled`, `name` (default "BCOS"), `url`, `logo` (upload), `tagline`, `contactUrl`. Marketing can then change the text or turn a placement off without a redeploy.
- [ ] Create a helper `getBuiltBy()` that reads it (cached, revalidated when the global changes).

### 6.2 Placements (non-intrusive)

| # | Where | What it looks like | Why it works |
|---|---|---|---|
| 1 | **Site footer** (every page) | One small line: "Built by **BCOS** online team" with the logo mark, linking to the BCOS site | Always visible, never in the way |
| 2 | **Footer watermark** | A very faint large "BCOS" wordmark behind the bottom of the footer, decorative only | Brand presence without text clutter |
| 3 | **`/about` page** | A short "Built by the BCOS online team" section: who they are, what they build, contact button | For curious visitors and potential clients |
| 4 | **Transactional emails** | Tiny line at the bottom of each email: "Sent by (platform) · Built by BCOS" | Seen by every applicant and employer |
| 5 | **Dashboard sidebar** (bottom) | Very small "Built by BCOS" text link | Visible to power users, outside the work area |
| 6 | **Admin panel** | Small credit on the login page or dashboard (use Payload's admin component options) | Seen by the platform owners |
| 7 | **`humans.txt` and `<meta name="author">`** | Credit in the file and head | Invisible to users, useful for the web community |
| 8 | **Error pages** (404, 500, maintenance) | One friendly line with the credit | Natural moment, not the main task |

### 6.3 Rules so users do not feel bothered

- [ ] **Never** use popups, banners, sticky bars, or anything that blocks content.
- [ ] **Never** show the credit inside forms, the apply flow, payment or settings screens.
- [ ] At most **one visible credit per screen** (the footer watermark is decorative and does not count).
- [ ] The watermark: `aria-hidden="true"`, `pointer-events: none`, low opacity, hidden in print, and it must not reduce the contrast of footer text.
- [ ] Credit text must still meet WCAG AA contrast and be keyboard focusable as a link.
- [ ] External links use `rel="noopener"` and `target="_blank"`, with UTM parameters per placement (`utm_source=jobboard&utm_medium=footer`, `sidebar`, `email`, `about`) so the team can see which placement works. No tracking of individual users.
- [ ] Respect dark mode with a light or dark logo variant.

### 6.4 Tests

- [ ] **Component:** footer renders the link with correct `href`, `rel` and `target`; the watermark has `aria-hidden` and is not focusable; nothing renders when `enabled` is false.
- [ ] **Integration:** changing the global updates the footer after revalidation.
- [ ] **E2E:** the credit appears on the home, jobs, about and dashboard pages; it does **not** appear on the apply form and settings screens; clicking opens the BCOS URL with the right UTM.
- [ ] **Email:** snapshot test shows the credit line in a status email.
- [ ] **Accessibility:** axe contrast check on the footer in light and dark mode.
- [ ] **Visual:** footer screenshots at 360 and 1920 px.

**Test gate:** run the gate command.
**Done when:** the credit is visible but quiet, can be switched off from the admin, and every placement is tested.

---

## CLASS 7. User settings: candidate and employer (P1, L)

**Goal:** one clear settings area at `/dashboard/settings` where each role manages its own information.

### 7.1 Structure and data

- [ ] Settings tabs: **Profile**, **Account**, **Notifications**, **Security**, **Danger zone**. Employers get an extra **Company** tab. Each tab saves independently, shows a saved or error toast, and warns about unsaved changes.
- [ ] Extend `users` with groups (use `admin.condition` so each role only sees its own fields):
  - `candidateProfile`: `headline`, `bio`, `city` (relationship to `locations`), `skills` (relationship to `skills`), `experienceLevel` (junior, mid, senior, lead), `yearsOfExperience`, `desiredJobTypes`, `desiredWorkModes`, `expectedSalary` (private), `availability`, `defaultResume` (relationship to `resumes`), `links` (LinkedIn, GitHub, portfolio)
  - `notificationPreferences`: email on application status change, email on new applicant (employer), job alerts (candidate, frequency), in-app notifications
  - `locale` and `theme` preferences
- [ ] `avatar` (relationship to `media`).
- [ ] Access: a user can read and update **only their own** settings; `role` can never be changed here.

### 7.2 Candidate settings

- [ ] **Profile:** avatar upload (Class 2), headline, bio, city (autocomplete from Class 5), skills (`SkillPicker`), experience level, links, preferences, default resume.
- [ ] **Resumes:** list, upload (PDF, 5 MB), set default, delete.
- [ ] **Notifications:** toggles and alert frequency.
- [ ] Profile completeness indicator with hints ("Add skills to get better results"). Pre-fill the apply form from the profile.

### 7.3 Employer settings

- [ ] **Company:** name, logo, cover image, website, description, size, industry, city, social links.
- [ ] **Hiring defaults:** default job type, work mode, currency, and the contact email shown to applicants.
- [ ] **Notifications:** email on every new applicant or a daily digest.
- [ ] (P2) Team members.

### 7.4 Account and security (both roles)

- [ ] Change name and email (email change requires re-verification), change password (ask for the current one), show active sessions and "log out of all devices" if supported.
- [ ] **Danger zone:** delete account. Confirm with password, remove the user's resumes from storage, and anonymize application records so employers keep their history. **Confirm this policy with the owner** before building. Offer "download my data" (JSON) as P2.

### 7.5 Forms

- [ ] Use `react-hook-form` and Zod, with the same schemas validated again on the server (Server Actions). Show per-field errors, a dirty-state indicator, and a disabled Save button until something changes.

### 7.6 Tests

- [ ] **Unit:** Zod schemas, profile completeness calculation, salary range rules.
- [ ] **Integration (access):** user A cannot read or update user B's settings; a candidate cannot set `role`; employer-only fields cannot be written by a candidate; `expectedSalary` is never returned to employers.
- [ ] **Integration:** turning off a notification preference stops the matching email (check Mailpit or a mocked sender).
- [ ] **Component:** settings tabs, dirty-state and unsaved-changes warning.
- [ ] **E2E:** candidate completes profile, uploads avatar and resume, sets preferences; employer edits company and logo and sees the change on public pages; change password and log in again; delete account flow.
- [ ] **Accessibility:** axe on each settings tab.

**Test gate:** run the gate command.
**Done when:** both roles can manage their profile, notifications and account safely, and privacy rules are proven by tests.

---

## CLASS 8. Candidate application pipeline tracking (P1, L)

**Goal:** a smooth, transparent journey. The candidate always knows the status of each application. The employer manages stages quickly.

### 8.1 Stages and rules

- [ ] Stages: `applied` → `in_review` → `shortlisted` → `interview` → `offer` → `hired`. Terminal: `rejected`, `withdrawn`.
- [ ] Migration for old data: `reviewing` becomes `in_review`; other values stay.
- [ ] Define a **transition map** (which stage may follow which) in one shared file. Employers can move forward, or back by one step; `rejected` is allowed from any active stage; `withdrawn` only by the candidate; only an admin can reopen a terminal application.
- [ ] Enforce transitions in a `beforeChange` hook (not only in the UI).

### 8.2 Data

- [ ] Create `application-events` collection: `application`, `type` (status_change, note, interview_scheduled, message, viewed), `fromStatus`, `toStatus`, `actor`, `message`, `visibleToCandidate` (checkbox), `createdAt`.
- [ ] A hook writes an event automatically on every status change. The first time an employer opens an application, record a `viewed` event (the candidate sees "Viewed by employer").
- [ ] Internal employer notes are events with `visibleToCandidate: false`. Use **field-level and query-level access** so candidates never receive them from the API.
- [ ] Create `notifications` collection: `user`, `type`, `title`, `link`, `readAt`, `createdAt`. Users read and update only their own.

### 8.3 Candidate experience

- [ ] **My applications** list: job, company, applied date, a compact **progress bar** showing the current stage, filter by stage, sort by last update.
- [ ] **Application detail page:** horizontal stepper with the current stage highlighted (vertical on mobile), a timeline of visible events with timestamps, the employer's message when present, interview details (date, time, link or place), and a **Withdraw** button with confirmation.
- [ ] **Notification bell** in the header with unread count and a dropdown list. Refresh the count every 30-60 seconds and when the tab regains focus (no WebSockets at first).
- [ ] Emails per status change, respecting notification preferences (Class 7).
- [ ] Smooth feel: skeleton loading, animated stepper transitions that respect `prefers-reduced-motion`, and a friendly empty state with a link to browse jobs.

### 8.4 Employer experience

- [ ] **Pipeline board** per job: columns per stage, cards with candidate name, avatar, headline and top skills. Drag and drop to move a card (use `@dnd-kit`, ask the owner before adding it). Provide a menu alternative so it works without dragging (keyboard and mobile).
- [ ] **Optimistic updates** with rollback and an error toast if the server rejects the move.
- [ ] Moving to `rejected` or `interview` opens a small dialog: optional message to the candidate, interview date and link (for interview), and a reason template (for reject).
- [ ] Applicant detail drawer: profile, resume viewer or download (through Payload access control), internal notes, timeline.
- [ ] Filters on the board: by skill, by date, search by name. Bulk action: reject several at once (P2).

### 8.5 Tests

- [ ] **Unit:** transition map (every allowed and every forbidden move), stage progress calculation, stepper state.
- [ ] **Integration:**
  - the hook creates one event per status change with the right actor and stages
  - a forbidden transition is rejected, even through the API
  - a candidate cannot see internal notes, and cannot see other candidates' applications
  - an employer cannot move applications of another employer's job
  - withdrawn applications cannot be moved by the employer
  - email sent only when the preference is on
- [ ] **Component:** stepper (all stages, rejected and withdrawn states), pipeline card menu, notification bell.
- [ ] **E2E:**
  - employer moves a card from Applied to Interview; the candidate sees the stepper update and a notification
  - two employers move the same card at the same time; the second sees a clear conflict message and the UI recovers
  - candidate withdraws; the employer sees it in the withdrawn column
  - keyboard-only: move a card using the menu
- [ ] **Accessibility:** stepper uses `aria-current="step"`; the board is operable by keyboard; axe has no serious violations.

**Test gate:** run the gate command.
**Done when:** candidates can follow every application visually and receive updates, employers manage stages smoothly, and privacy is proven by tests.

---

## CLASS 9. Hardening and release (P2, M)

### 9.1 Performance

- [ ] Verify indexes on every filtered or sorted field, and use `select` and low `depth` for list queries.
- [ ] Check Core Web Vitals on `/`, `/jobs`, `/jobs/[slug]` (Lighthouse). Fix the largest issues (image sizes, client JavaScript, layout shifts).
- [ ] Confirm images always use the generated sizes and `sizes` attributes.
- [ ] Load test with k6 or Artillery on a test environment: list with filters, suggestion endpoint, login, apply.

### 9.2 Quality

- [ ] Accessibility sweep on all key pages in light and dark mode, plus keyboard-only walkthrough.
- [ ] Cross-browser check (Chrome, Firefox, Safari) and real phone check.
- [ ] Review every new Server Action and endpoint: re-check user, role, validation, rate limit.
- [ ] Confirm every Local API call made for a user passes `user` and `overrideAccess: false`.
- [ ] Sentry is receiving errors from the new features.

### 9.3 Release

- [ ] Update `README.md`, `.env.example`, and a short **CHANGELOG** for v2.
- [ ] Run migrations on a Neon branch copy of production first, then on production after a backup.
- [ ] Run the full regression: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`.
- [ ] Smoke test production: sign up, search with suggestions, upload an image, apply, change a stage, see the notification, check the footer credit.

**Done when:** the regression suite is green, performance and accessibility checks pass, and the production smoke test succeeds.

---

## Global Definition of Done (every task)

- Code compiles, lint passes, no TypeScript errors.
- Types regenerated after any schema change, and a migration committed.
- At least one allowed case and one denied case tested for every new access rule.
- No secrets, no leftover `console.log`.
- UI works on a 360 px phone and a 2560 px monitor, in light and dark mode.
- Documentation updated when setup or behavior changes.
- Clear commit message.

## Questions to confirm with the owner

1. BCOS: exact name, URL, logo files, tagline, contact link.
2. Account deletion policy for applications (anonymize or delete).
3. Allowed new dependencies: cropper (avatars), `@dnd-kit` (pipeline board), `react-hook-form`.
4. Languages needed (Arabic, French, English) and whether right-to-left layout is required now or later.
5. Should job alerts and the daily digest ship in v2 or be delayed to v3?
