---
name: verify-public-reads
description: Pre-deploy sanity check that the public marketing site can actually read CMS content via the Supabase anon key. Use before pushing a deploy or right after applying a Supabase RLS migration. Catches the exact failure mode that caused the "CMS not updating" incident — Prisma writes succeed but supabaseAnon reads return zero rows and the helpers silently fall back to src/data/*.ts.
disable-model-invocation: true
---

# Verify Public Reads

A 30-second pre-deploy check. Runs a small `tsx` script that connects to Supabase using the **anon** key (not service role) and counts rows in each public-facing table. Any zero or error means the live site is about to serve the static fallback from `src/data/*.ts` instead of CMS content.

## When to use

- Right before promoting a deploy to production.
- Right after applying a Supabase RLS migration.
- When debugging "the CMS isn't updating the live site" reports.
- As a quick sanity check after rotating Supabase keys.

## How to run

```bash
npx tsx scripts/verify-public-reads.ts
```

The script reads `.env.local` (or whichever env is loaded) for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

To check production instead of local:

```bash
# Override env vars inline for a one-off prod check.
NEXT_PUBLIC_SUPABASE_URL="https://<prod-ref>.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="<prod-anon-key>" \
npx tsx scripts/verify-public-reads.ts
```

## What the script checks

For each public-facing CMS table:

| Table | Filter | Why it matters |
|---|---|---|
| `Service` | `active = true` | Home page services grid |
| `ServiceTier` | (via embed) | Service pricing tiles |
| `Testimonial` | `published = true` | Testimonials marquee |
| `FaqItem` | `published = true` | FAQ section |
| `GalleryImage` | `published = true` | Gallery + before/after pair |
| `site_setting` | — | Footer contact, hero copy, tagline |

For each, it runs the same query the helper in `src/lib/cms/*.ts` would run, using the anon key. It prints:

```
[ok]   Service          7 rows (filter: active=true)
[ok]   ServiceTier      21 rows (embedded)
[ok]   Testimonial      6 rows (filter: published=true)
[FAIL] FaqItem          0 rows — anon read returned empty. Likely RLS misconfiguration.
[ok]   GalleryImage     12 rows (filter: published=true)
[ok]   site_setting     8 rows
```

Exit code is non-zero if any table returned zero rows or an error. Suitable for CI gating: `npx tsx scripts/verify-public-reads.ts && netlify deploy --prod`.

## Interpreting failures

- **`anon read returned empty`** — most often a missing RLS policy. Check `supabase/migrations/*.sql` for a `for select` policy on the table. If none exists, use the `add-cms-table-rls` skill to add one.
- **`anon read returned an error`** — print the error and check Supabase logs. Common causes: env vars pointing at the wrong project, anon key revoked, table renamed without updating the helper.
- **`env vars not set`** — populate `.env.local` or supply them inline.

## Why this skill exists

The previous incident shipped to production because nothing in CI distinguished "Supabase responded fine but returned zero rows" from "everything works." The `src/lib/cms/*.ts` helpers silently swallowed the empty result and substituted hardcoded data, so the build, the deploy, and the admin all looked healthy. The only signal was a user noticing their edits never appeared.

This script is the missing diagnostic. Running it before each deploy makes that failure mode impossible to ship unnoticed.

## Notes

- The script uses the **anon** key on purpose. Running it with the service-role key would defeat the entire test — service-role bypasses RLS and would report rows even when the public site can't see them.
- The script does NOT mutate anything. Safe to run against production at any time.
- If you add a new CMS table, add it to the `CHECKS` array in `scripts/verify-public-reads.ts`.
