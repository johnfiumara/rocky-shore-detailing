---
name: add-cms-table-rls
description: Add the Supabase RLS migration that makes a new Prisma-owned CMS table readable from the public site. Use whenever a new Prisma model is added that the public marketing site will read via supabaseAnon — typically right after running the add-cms-content-type skill. Closes the gap that caused the multi-day "CMS not updating" incident, where Service / Testimonial / FaqItem / GalleryImage tables had no anon SELECT policy and silently returned zero rows to the public site.
---

# Add CMS Table RLS

Every Prisma-owned table that the public site reads needs a Supabase RLS migration. Without it, writes (via `prisma.x.*` using `DATABASE_URL`) succeed, but reads (via `supabaseAnon()` in `src/lib/cms/*.ts`) return zero rows — and the helpers silently fall back to hardcoded `src/data/*.ts`.

This skill generates the migration. It is the missing companion to the `add-cms-content-type` skill.

## When to use

- Right after `add-cms-content-type` (or any other change that adds a new Prisma model that the public site reads).
- When `rls-policy-auditor` flags a missing public-read policy.
- When adding a new `src/lib/cms/<thing>.ts` helper for an existing table that didn't have one before.

## Inputs needed

- **Table name** — exactly as it appears in `prisma/schema.prisma` (PascalCase, singular, e.g. `Award`).
- **Visibility column** — the boolean that gates whether anon callers can see a row. The repo convention is `published` for most content tables and `active` for `Service`. If the table has neither, use `using (true)` and ask whether that's truly intended.
- **Embedded relations** — any child table that the public helper embeds via PostgREST (e.g. `Service.tiers` embeds `ServiceTier`). Each embedded table needs its own policy.

## The pattern

The reference implementation is `supabase/migrations/0004_public_read_policies.sql`. Match its shape exactly.

```sql
-- supabase/migrations/000N_<table>_public_read.sql
-- Public anon SELECT for the <Table> table. Prisma owns writes via
-- DATABASE_URL (bypasses RLS); the public site reads via supabaseAnon().
-- Without this policy, anon reads return zero rows and src/lib/cms/<table>.ts
-- silently falls back to src/data/<table>.ts.

alter table public."<Table>" enable row level security;

do $$ begin
  create policy <table>_public_read on public."<Table>"
    for select
    using (<visibility-column> = true);
exception when duplicate_object then null; end $$;
```

### For embedded child tables

If `src/lib/cms/<parent>.ts` embeds a relation:

```typescript
.from("Parent").select("..., children:Child(...)").eq("active", true)
```

…then `Child` needs its own policy. PostgREST enforces RLS independently per embedded table. Scope the child policy to the parent's visibility:

```sql
alter table public."Child" enable row level security;

do $$ begin
  create policy child_public_read on public."Child"
    for select
    using (
      exists (
        select 1 from public."Parent" p
        where p.id = "Child"."parentId" and p.active = true
      )
    );
exception when duplicate_object then null; end $$;
```

## Required checks before declaring done

- [ ] Filename is the next sequential migration number — `ls supabase/migrations/` to confirm.
- [ ] Policy `using (...)` predicate matches the `.eq(...)` filter in `src/lib/cms/<table>.ts`. If the helper filters `published = true`, the policy must too.
- [ ] `alter table ... enable row level security` is present. Without it the policy is dead.
- [ ] Idempotent guard (`do $$ begin ... exception when duplicate_object then null; end $$;`) is used — matches the rest of the migrations folder and makes re-runs safe.
- [ ] Every embedded relation in the helper has its own policy in this migration.
- [ ] You verified the helper exists at `src/lib/cms/<table>.ts` and reads via `supabaseAnon()`. If it doesn't, this skill isn't needed yet.
- [ ] You added a new entry to the `CHECKS` array in `scripts/verify-public-reads.ts` so the pre-deploy verification covers this table. Without this, a future RLS regression on the new table won't be caught by `/verify-public-reads`. Match the existing entry shape: `{ table, select, filter?, note }`. If the helper has a special-case fallback (like `getBeforeAfterPair` for GalleryImage), add a corresponding special-case branch in `runCheck`.
- [ ] You reminded the user that the migration must be applied to the prod Supabase project (SQL editor or `supabase db push`). It is NOT applied automatically by the Netlify build.

## Variants

### Multi-table migration

If you're adding several related tables at once (e.g. `Award` + `AwardCategory`), put them in a single migration file. Mirror `0004_public_read_policies.sql`, which covers five tables.

### Tables with no visibility column

If the table has no `published` / `active` field and all rows are intended to be public, use `using (true)` — but ALWAYS ask first. Examples like `Service` started this way before `active` was added; getting it wrong here exposes draft content.

## Why this skill exists

This codebase had a multi-day production incident where CMS edits never appeared on the live site. Root cause: Prisma writes succeeded against `DATABASE_URL` (owner role, bypasses RLS), but `supabaseAnon()` reads returned zero rows because no SELECT policy existed for the anon role. The helpers in `src/lib/cms/*.ts` silently fell back to hardcoded `src/data/*.ts`, so the symptom looked like a caching bug, not a permissions bug.

Adding RLS in the same change as the Prisma model is the only way to make this bug class structurally impossible. The migration is small, idempotent, and safe — there's no reason to skip it.

## After this skill

- Apply the migration to the prod Supabase project (SQL editor or `supabase db push`).
- Run the `verify-public-reads` skill to confirm anon reads return >0 rows for every CMS table before redeploying.
