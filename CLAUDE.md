# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`vinly` is a Next.js 16 (App Router, React 19) application deployed to **Cloudflare Workers** via `@opennextjs/cloudflare`. It is currently a fresh `create-cloudflare` scaffold — `src/app/` holds only the starter `layout.tsx` / `page.tsx` / `globals.css`.

## Commands

```bash
npm run dev        # Next.js dev server at localhost:3000 (Node runtime, not Workers)
npm run lint       # ESLint (next/core-web-vitals + next/typescript)
npm run build      # next build
npm run preview    # Build with OpenNext + run on the local Cloudflare Workers runtime
npm run deploy     # Build with OpenNext + deploy to Cloudflare
npm run upload     # Build + upload a new version without deploying it
npm run cf-typegen # Regenerate cloudflare-env.d.ts from wrangler.jsonc bindings
```

There is no test runner configured.

## Architecture notes

**Two runtimes, one codebase.** `npm run dev` runs Next.js on Node and is the fast inner loop. The app actually *ships* on the Cloudflare Workers runtime, which behaves differently (edge APIs, no Node built-ins unless `nodejs_compat` covers them). Validate anything runtime-sensitive with `npm run preview` before assuming it works in production. `next.config.ts` calls `initOpenNextCloudflareForDev()` so Cloudflare bindings are also reachable from `next dev`.

**Bindings flow.** Cloudflare resources (KV, R2, D1, secrets, env vars, the `IMAGES` and `ASSETS` bindings) are declared in `wrangler.jsonc`. After editing bindings there, run `npm run cf-typegen` to regenerate the `CloudflareEnv` types in `cloudflare-env.d.ts` (a generated file — do not edit it by hand; it's wired into `tsconfig.json` `types`). Access bindings at runtime via `getCloudflareContext()` from `@opennextjs/cloudflare`. The worker has a `WORKER_SELF_REFERENCE` service binding (used by OpenNext caching) whose `service` name must stay equal to the worker `name` (`vinly`).

**Data layer.** Persistence is a D1 database (binding `DB`) accessed through Drizzle ORM. The schema lives in `src/db/schema.ts` (camelCase TS fields ↔ snake_case columns) and is the single source of truth — `DbUser` and friends are *inferred* from it (`typeof users.$inferSelect`), never hand-declared. Get a client with `getDb()` from `src/db/index.ts`. Migrations are generated from the schema (`npx drizzle-kit generate`) into `drizzle/` and applied with `npx wrangler d1 migrations apply vinly-db --local` (add `--remote` for prod). Do not edit D1 with ad-hoc `ALTER TABLE` — change `schema.ts`, regenerate, apply. `schema.sql` at the repo root is a legacy artifact kept for reference; the Drizzle migrations are authoritative.

**Caching** is configured in `open-next.config.ts` (R2 incremental cache is scaffolded but commented out). See https://opennext.js.org/cloudflare/caching.

**Local env vars** go in `.dev.vars` (loaded by `wrangler dev` / preview). Production secrets are managed with `wrangler secret`, not committed.

## Conventions

- Path alias `@/*` → `./src/*`.
- TypeScript `strict` mode; the repo uses **tabs** for indentation.
- Styling is Tailwind CSS v4 (configured via `@tailwindcss/postcss` in `postcss.config.mjs`; no `tailwind.config` file).
