# Vercel Migration — Design

**Date:** 2026-06-18
**Status:** Approved for implementation planning
**Driver:** Better Next.js DX — fewer Netlify-specific build quirks (recent middleware.ts/proxy.ts collision, Prisma module quirks)

## Context

Rocky Coast Detailing (repo `rocky-shore-detailing`) is a Next.js 16 App Router app with Prisma + Supabase + Resend, currently deployed to Netlify. Production domain is `rockycoastdetailing.net`. The codebase has accumulated Netlify-specific affordances:

- `@netlify/blobs` for booking photo storage
- `netlify.toml` for caching and security headers
- `next build --webpack` flag (Turbopack default was avoided for Netlify reasons)
- `@netlify/plugin-nextjs` handling `/_next/static/*` immutable caching

The migration goal is to move primary hosting to Vercel without downtime and without losing customer-uploaded booking photos. We also want the work to be staged so that each step is independently shippable and reversible.

## Non-goals

- Not adopting Vercel-specific products beyond hosting (no AI Gateway, no Vercel Blob, no Cron, no Queues in this migration).
- Not refactoring unrelated code, even where touched files have other smells.
- Not changing the Supabase project, Resend account, Upstash account, or any other backing service.
- Not introducing a storage-vendor abstraction. The point is to remove Netlify-specific code, not to add indirection for a future swap.

## Approach: phased migration

Three PRs, each green in production before the next is started. Each PR is reversible.

### PR 1 — Storage migration (vendor-neutral)

**Ships to:** Netlify (production stays on Netlify through this PR).

**Why first:** Removes the only piece of code that is fundamentally incompatible with Vercel (`@netlify/blobs`). After this PR, the app is portable. If we never finish the migration, PR 1 still has standalone value (removes vendor lock for storage).

**Changes:**

1. **Replace `src/lib/booking-photos.ts`** to call Supabase Storage instead of `@netlify/blobs`. Exported function signatures stay identical (`storeBookingPhotos`, `getBookingPhoto`, `contentTypeForKey`) so callers don't change.
2. **Create a private Supabase Storage bucket** `booking-photos` via a SQL migration in `supabase/`. Bucket is private; access goes through a service-role server client. Authorization is enforced at the API route, not at the bucket.
3. **Move security/cache headers** out of `netlify.toml` and into `next.config.ts` `headers()`:
   - Site-wide: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
   - `/gallery/*`: `Cache-Control: public, max-age=31536000, immutable`

   After this PR, `netlify.toml` only contains build settings.
4. **One-shot migration script** `scripts/migrate-netlify-blobs-to-supabase.ts`:
   - Lists all keys in the existing `booking-photos` Netlify Blobs store.
   - Uploads each to the new Supabase bucket, preserving the `<bookingId>/<index>.<ext>` key format.
   - Idempotent: skips keys already present in the destination.
   - Run locally via `tsx` after the new bucket exists and the new code is deployed.
5. **`@netlify/blobs` stays in `package.json`** for this PR — the migration script needs it. Removed in PR 3.

**Verification gate before merging PR 1:**
- Netlify production build is green.
- A test booking with a photo upload writes to Supabase Storage and is readable back via the existing API route.
- The migration script run against the production Netlify store reports the expected key count and zero errors.

### PR 2 — Vercel deploy alongside Netlify

**Ships to:** Vercel preview + Vercel production URL (`*.vercel.app`). Netlify is still the primary; DNS still points there.

**Changes:**

1. **User installs Vercel CLI** (`npm i -g vercel`) — currently missing.
2. **`vercel link`** the repo to a new Vercel project.
3. **Enumerate every env var** the app reads. Write a small helper `scripts/list-required-env.ts` that greps the source tree for `process.env.*` and prints the unique set. Use the output to push values to Vercel Preview + Production via `vercel env add`. Known vars include:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`, `DIRECT_URL` (Prisma)
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. **Add `vercel.ts`** at repo root. Minimal — framework hint only. Headers stay in `next.config.ts` so we don't duplicate config across two files. No rewrites, redirects, or cron.
5. **Drop the `--webpack` flag** from the `build` script. Build becomes `prisma generate && next build` (Turbopack default). If Turbopack hits a blocker on Vercel, revert that one line.
6. **Keep `src/proxy.ts` as-is.** Commit `8d41303` confirms the user intentionally chose `proxy.ts` over `middleware.ts` for Next 16. Next 16 supports both names; no change needed.
7. **`NEXT_PUBLIC_SITE_URL` for previews** uses `VERCEL_URL` as a runtime fallback. Production stays `https://rockycoastdetailing.net` after DNS flips in PR 3.

**Verification gate before merging PR 2:**
- Vercel preview URL serves the home page and `/admin/login` correctly.
- Admin login round-trips cookies through `src/proxy.ts`.
- A test booking with a photo upload writes to Supabase Storage from the Vercel deployment.
- Netlify production is still live, still serving traffic, still green.

### PR 3 — DNS cutover and Netlify retirement

**Ships to:** Vercel becomes primary. Netlify is decommissioned.

**Changes:**

1. **Attach `rockycoastdetailing.net`** as a custom domain on the Vercel project; Vercel issues the cert.
2. **Lower DNS TTL ahead of cutover** so rollback is cheap.
3. **Flip DNS:** apex `A`/`ALIAS` and any `www` `CNAME` records move from Netlify's load balancer to Vercel's targets.
4. **Smoke test against the custom domain:**
   - Home page renders.
   - `/admin/login` round-trips cookies correctly.
   - A fresh booking with a photo upload survives end-to-end.
   - Resend admin invite email contains the correct `NEXT_PUBLIC_SITE_URL`.
5. **After ~24h green**, clean up:
   - Delete `netlify.toml`.
   - Remove `@netlify/blobs` from `package.json`.
   - Delete `scripts/migrate-netlify-blobs-to-supabase.ts` (it has done its job; git history preserves it).
   - Remove any `@netlify/*` references from `eslint.config.mjs`.
   - Pause or delete the Netlify site (manual, in the Netlify UI).
6. **Update memory entries** `project-basics` and `deployed-url` so future Claude sessions know the deploy target is Vercel.

**Rollback plan:** flip DNS back to Netlify. Netlify still has the last green build of the post-PR-1 code, and that build already reads/writes the Supabase Storage bucket. Rollback is DNS-only — no code revert needed.

**Risk accepted:** during DNS propagation, some users hit Netlify and some hit Vercel. Both serve the same code, read/write the same Supabase database, and read/write the same Supabase Storage bucket — no divergence possible.

## Data flow after migration

```
Browser
  │
  ▼
Vercel (Next.js 16, Fluid Compute, Node 24)
  │
  ├──► Supabase Postgres (Prisma) ─────── bookings, services, etc.
  ├──► Supabase Storage (booking-photos) ─ customer photo uploads
  ├──► Resend ──────────────────────────── transactional email
  └──► Upstash Redis ───────────────────── rate limiting
```

## Files touched

**PR 1:**
- `src/lib/booking-photos.ts` (rewrite)
- `next.config.ts` (add `headers()`)
- `netlify.toml` (remove header blocks; keep `[build]`)
- `supabase/migrations/<new>.sql` (create bucket + storage policies if needed)
- `scripts/migrate-netlify-blobs-to-supabase.ts` (new)

**PR 2:**
- `package.json` (drop `--webpack` from `build`)
- `vercel.ts` (new, minimal)
- `scripts/list-required-env.ts` (new helper for env enumeration)

**PR 3:**
- Delete `netlify.toml`
- Delete `scripts/migrate-netlify-blobs-to-supabase.ts`
- `package.json` (remove `@netlify/blobs`)
- `eslint.config.mjs` (remove `@netlify` refs if any)
- `~/.claude/projects/.../memory/project-basics.md` and `deployed-url.md`

## Success criteria

- `rockycoastdetailing.net` is served by Vercel.
- Pre-existing customer booking photos are accessible after migration.
- Admin login, booking submission, and admin invite emails all work in production on Vercel.
- `netlify.toml` and `@netlify/blobs` are gone from the repo.
- A redeploy from `master` on Vercel is green with `prisma generate && next build` (no `--webpack`).
