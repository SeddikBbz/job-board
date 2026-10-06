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
