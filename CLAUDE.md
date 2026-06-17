# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`vinly` is a real-time social music listening app built on Next.js 16 (App Router, React 19), deployed to **Cloudflare Workers** via `@opennextjs/cloudflare`. Users authenticate with Spotify, create or join "rooms", and see what every member is currently playing — synced via client-side polling. Tracks can be saved to a personal library (savedDiscs).

## Commands

```bash
npm run dev        # Next.js dev server at localhost:3000 (Node runtime, not Workers)
npm run lint       # ESLint (next/core-web-vitals + next/typescript)
npm run build      # opennextjs-cloudflare build (the one Workers Builds runs; bundles into .open-next/)
npm run build:next # next build (raw Next bundle, debug only)
npm run preview    # Build with OpenNext + run on the local Cloudflare Workers runtime
npm run deploy     # Build with OpenNext + deploy to Cloudflare
npm run cf-typegen # Regenerate cloudflare-env.d.ts from wrangler.jsonc bindings

# Database migrations
npx drizzle-kit generate                                      # generate migration from schema changes
npx wrangler d1 migrations apply vinly-db --local            # apply to local D1
npx wrangler d1 migrations apply vinly-db --remote           # apply to production D1
```

There is no test runner configured.

## Local environment setup

Copy `.dev.vars.example` to `.dev.vars` and fill in Spotify credentials:

```
NEXTJS_ENV=development
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
```

The login route rewrites `localhost` → `127.0.0.1` in redirect URIs because Spotify's OAuth only accepts `127.0.0.1` for local development, not `localhost`.

## Architecture notes

**Two runtimes, one codebase.** `npm run dev` runs Next.js on Node and is the fast inner loop. The app actually *ships* on the Cloudflare Workers runtime, which behaves differently (edge APIs, no Node built-ins unless `nodejs_compat` covers them). Validate anything runtime-sensitive with `npm run preview` before assuming it works in production. `next.config.ts` calls `initOpenNextCloudflareForDev()` so Cloudflare bindings are also reachable from `next dev`.

**Bindings flow.** Cloudflare resources (KV, R2, D1, secrets, env vars, the `IMAGES` and `ASSETS` bindings) are declared in `wrangler.jsonc`. After editing bindings there, run `npm run cf-typegen` to regenerate the `CloudflareEnv` types in `cloudflare-env.d.ts` (a generated file — do not edit it by hand; it's wired into `tsconfig.json` `types`). Access bindings at runtime via `getCloudflareContext()` from `@opennextjs/cloudflare`. The worker has a `WORKER_SELF_REFERENCE` service binding (used by OpenNext caching) whose `service` name must stay equal to the worker `name` (`vinly`).

**Data layer.** Persistence is a D1 database (binding `DB`) accessed through Drizzle ORM. The schema lives in `src/db/schema.ts` (camelCase TS fields ↔ snake_case columns) and is the single source of truth — `DbUser` and friends are *inferred* from it (`typeof users.$inferSelect`), never hand-declared. Get a client with `getDb()` from `src/db/index.ts`. Migrations are generated from the schema (`npx drizzle-kit generate`) into `drizzle/` and applied with `npx wrangler d1 migrations apply vinly-db --local` (add `--remote` for prod). Do not edit D1 with ad-hoc `ALTER TABLE` — change `schema.ts`, regenerate, apply. `schema.sql` at the repo root is a legacy artifact kept for reference; the Drizzle migrations are authoritative.

**Auth flow.** Spotify OAuth 2.0 with PKCE. `GET /api/auth/login` generates a verifier/challenge, stores them in 10-minute cookies, and redirects to Spotify. `GET /api/auth/callback` validates the state + verifier, exchanges the code for tokens, upserts the user in D1, and sets a `vinly_session` cookie (90-day random token stored in the `users` table). All authenticated server-side code calls `getCurrentUser()` from `src/lib/session.ts`, which reads the cookie and queries the DB.

**Spotify token lifecycle.** `getValidAccessToken(user)` in `src/lib/spotify.ts` checks if the token expires within 60 seconds and refreshes it if so, persisting the new token to D1. Always call this before hitting the Spotify API — never use `user.accessToken` directly. `getNowPlayingFor(user)` wraps this and calls the Spotify currently-playing endpoint.

**Room model.** Rooms have a public `id` (slug) and a secret `inviteCode`. Visiting `/room/[id]?invite=<code>` auto-joins the user as a member; without the code they're a spectator (read-only). Only members appear in the now-playing grid and can share the invite link. The room state endpoint (`/api/rooms/[id]/state`) fetches Spotify playback concurrently for all members and falls back to the last-known track stored in `users`.

**Real-time.** There is no WebSocket or SSE — `RoomView` polls `/api/rooms/[id]/state` every 5 seconds. The vinyl disc animation is synced to a deterministic rotation based on track progress, not free-spinning.

**Caching** is configured in `open-next.config.ts` (R2 incremental cache is scaffolded but commented out). See https://opennext.js.org/cloudflare/caching.

**Local env vars** go in `.dev.vars` (loaded by `wrangler dev` / preview). Production secrets are managed with `wrangler secret`, not committed.

## Conventions

- Path alias `@/*` → `./src/*`.
- TypeScript `strict` mode; the repo uses **tabs** for indentation.
- Styling is Tailwind CSS v4 (configured via `@tailwindcss/postcss` in `postcss.config.mjs`; no `tailwind.config` file).
- Client components (`"use client"`) live in `src/components/`. Server components and route handlers live in `src/app/`.
- `src/lib/session.ts` and `src/lib/spotify.ts` are the two primary server-side utilities — nearly every route handler uses one or both.
