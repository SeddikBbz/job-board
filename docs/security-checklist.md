# Security checklist

Reviewed in M11. The rule: **nothing trusts the client.** Every write is re-checked on the server,
and Payload access control has the final say.

## Server Actions

| Action | Session / role check | Validation | Other protection | Local API |
|---|---|---|---|---|
| `registerAction` | none (public) | Zod (`registerSchema`, role is `candidate` or `employer` only) | Turnstile, rate limit (5/h per IP) | `create users`, `overrideAccess: false`; `protectRole` hook blocks `admin` |
| `loginAction` | none (public) | Zod | Turnstile, rate limit (10/15 min per IP), account lockout (5 tries / 10 min), safe `?next=` redirect | Payload `login()` |
| `logoutAction` | n/a | n/a | n/a | Payload `logout()` |
| `forgotPasswordAction` | none (public) | Zod | rate limit (5/h per IP), same reply whether or not the email exists, Payload's per-user request interval | `forgotPassword`, `overrideAccess: false` |
| `resetPasswordAction` | token | Zod (passwords match) | single-use, expiring token | `resetPassword`, `overrideAccess: false` |
| `applyToJob` | logged in + `candidate` | Zod (PDF, ≤ 5 MB, cover letter ≤ 5000) | rate limit (20/h per user); job must be published and not expired; duplicate check + unique DB index | all calls as the user, `overrideAccess: false`. One exception: deleting the just-uploaded resume after a failed create uses `overrideAccess: true` (candidates can't delete resumes) |
| `saveCompany` | logged in + `employer`/`admin` | Zod (URL, image ≤ 2 MB) | one company per employer (hook) | as the user |
| `saveJob` | logged in + `employer`/`admin` | Zod (salary range, future expiry when publishing) | company ownership re-checked by the jobs hook | as the user |
| `setJobStatus` | logged in + `employer`/`admin` | Zod | access: only jobs of the user's company | as the user |
| `updateApplicationStatus` | logged in + `employer`/`admin` | Zod (no `withdrawn`) | access: only applications to the user's jobs; `guardStatusChange` hook | as the user |
| `withdrawApplication` | logged in + `candidate` | Zod | access: own applications; hook allows only `applied`/`reviewing` → `withdrawn` | as the user |

## REST / GraphQL API (`/api/**`)

- Same collection access rules as above (see the access matrix in `TASKS.md`).
- `POST /api/users` (signup) is **admin-only**: public signup must go through `/register` (Turnstile + rate limit).
- `POST /api/users/login` is protected by account lockout.
- `GET /api/payload-jobs/run` requires an admin or `Authorization: Bearer $CRON_SECRET`.
- Resumes are only served by `/api/resumes/file/...`, which checks read access on every download. Blob URLs have a random suffix.

## Pages

- `/dashboard/**`: layout requires a user; each page calls `requireRole` and reads data as the user.
- `/dashboard/jobs/[id]/*`: `getManagedJobOr404` returns 404 unless the job belongs to the employer.
- Public pages read with `overrideAccess: false` and no user (published, non-expired jobs only).

## Headers

- All routes: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`.
- Public site: Content-Security-Policy (self + Cloudflare Turnstile).

## Known limits

- The rate limiter is in memory, per server instance. On Vercel, also add Vercel Firewall rate-limit rules for `/login`, `/register` and `/jobs/*`.
- Account lockout can be abused to lock someone out for 10 minutes; this trade-off is accepted.
