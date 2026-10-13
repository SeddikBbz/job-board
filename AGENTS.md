<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules (for any AI coding agent: OpenCode, Claude, Copilot…)

Read `docs/HANDOFF.md` first: project status, decisions already made, structure, and the traps below in detail.

**Mode: learning project.** The owner is a developer learning Next.js and Payload.

1. Work on **one task at a time**. Explain in 2-4 sentences what you will do and why before coding, and summarize what changed after.
2. Prefer small, readable code over clever code. Comment only where the reason is not obvious. Match the surrounding style.
3. **Never invent Payload or Next.js APIs.** Check `node_modules/payload/dist` or https://payloadcms.com/docs, and `node_modules/next/dist/docs/`.
4. **Local API gotcha:** Payload's Local API bypasses access control by default. Whenever a call is made on behalf of a user, pass `user` and `overrideAccess: false`.
5. After any change to collections or globals: `pnpm generate:types`, then `pnpm payload migrate:create <name>` and commit the migration. Never rename a field that holds live data without moving the data.
6. Before committing: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:component`. CI runs the slow tests (int, e2e, build) on every push to `develop`.
7. Work on `develop`. Deploying means merging into `main` (Vercel auto-deploys and runs migrations): ask the owner first when it changes production data.
8. Never commit secrets. Keep them in `.env`, and keep `.env.example` up to date with names only.
9. Do not add libraries that are not already used without asking the owner first.
10. Use clear commit messages (`feat: …`, `fix: …`, `test: …`).
