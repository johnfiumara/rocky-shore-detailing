# CMS — Phase 1 design

Date: 2026-05-28
Status: approved (brainstorming → spec)
Phase: 1 of 3

## Summary

Turn Rocky Shore Detailing into a content-editable site. Phase 1 lands the foundation: every piece of copy and every image on the public site becomes editable from `/admin` without a code change or redeploy. Supabase Postgres holds the content, Supabase Auth identifies editors with roles, Supabase Storage holds media, and the public site reads through Next.js 16 Cache Components with tag-based invalidation so edits go live in seconds.

Phase 2 (later spec) layers on section ordering and theme tokens. Phase 3 (later spec) layers on drafts, preview, and version history. Neither is in scope here.

## Context

The repo already contains:

- A working `(admin)` route group with bookings, customers, content (services / FAQ / testimonials), gallery, schedule, and a bcrypt + JWT login.
- Prisma 7 schema with `Customer`, `Vehicle`, `Booking`, `Service`, `ServiceTier`, `Testimonial`, `FaqItem`, `GalleryImage` — but the public site does not read these tables. It reads from `src/data/*.ts` (services, faq, testimonials, process-steps, gallery), which are the de facto source of truth.
- Hardcoded contact info (phone, email, IG, hours) in `src/components/footer.tsx`.
- Hardcoded hero and story imagery in `src/components/hero/` and `src/components/story-section.tsx`.
- Photos served from `public/gallery/*.jpg`.

This duality (DB tables that exist but aren't read) is the central tension Phase 1 resolves.

## Goals

- Every public-site string and image is editable from `/admin`.
- Edit → publish → live on production in under 5 seconds.
- Multiple editors with roles (admin, editor). Admin can invite editors; editors can change content but not bookings/customers.
- Media library with a single canonical row per image, reusable across content.
- Each implementation slice ships independently; `main` stays deployable throughout.

## Non-goals (deferred)

- Section ordering / toggles on the home page → Phase 2.
- Theme tokens (color, type, spacing) as DB-editable → Phase 2.
- Drafts, preview, scheduled publish, version history → Phase 3.
- In-browser image cropping / focal-point picker.
- Multilingual content.
- Moving `Customer` / `Vehicle` / `Booking` off Prisma.
- Dashboard / analytics.

## Architecture

### Layering

- **Supabase Postgres** is the single database. The existing `DATABASE_URL` already points at it (or will after provisioning).
- **Prisma + pg** stays for the booking API (`src/app/api/booking/route.ts`) and the bookings/customers admin pages. Server-side trusted code. RLS does not apply because Prisma connects as a privileged role.
- **`@supabase/ssr` + supabase-js** is added for all CMS reads/writes (services, testimonials, FAQ, gallery, process steps, site settings, media assets, user roles). Connects as either anon (public site) or authenticated (editor) — RLS enforces what each can see and do.
- **Supabase Auth** replaces the existing bcrypt + JWT login. Editors sign in with email + password.
- **Supabase Storage** holds all uploaded images in one bucket named `media`.

### Data model

#### New tables

```sql
-- Role assigned to an authenticated Supabase user.
create table public.user_role (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

-- Key/value store for global site settings (footer info, hero image ref, etc.).
create table public.site_setting (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- One row per uploaded image. Everything that references an image references this row.
create table public.media_asset (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  mime text not null,
  width int,
  height int,
  alt text not null default '',
  caption text,
  blur_data_url text,
  uploaded_by uuid references auth.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index on public.media_asset (bucket, path) where deleted_at is null;

-- Migrates src/data/process-steps.ts.
create table public.process_step (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### Existing CMS tables — modifications

- `GalleryImage`: add nullable `media_asset_id uuid references media_asset(id)` in Slice 3 so the migration script can populate it. In Slice 4, `media_asset_id` becomes `NOT NULL` and the legacy `src` column is dropped.
- `Service` uses `active`, not `published`, for visibility — RLS read policy is `using (active)`, not the `coalesce(published, true)` template.
- All other CMS tables already have `published` and `sortOrder` columns per the Prisma schema — no changes needed there.

#### RLS policy template

Applied (with per-table tweaks below) to: `Service`, `ServiceTier`, `Testimonial`, `FaqItem`, `GalleryImage`, `process_step`, `site_setting`, `media_asset`.

```sql
alter table public.<table> enable row level security;

-- Anyone (anon or authenticated) can read published rows.
create policy "<table>_read_published" on public.<table>
  for select using (
    coalesce(published, true)  -- tables without `published` are always readable
  );

-- Admins and editors can do everything.
create policy "<table>_write_role" on public.<table>
  for all using (
    exists (
      select 1 from public.user_role ur
      where ur.user_id = auth.uid() and ur.role in ('admin', 'editor')
    )
  ) with check (
    exists (
      select 1 from public.user_role ur
      where ur.user_id = auth.uid() and ur.role in ('admin', 'editor')
    )
  );
```

**Per-table tweaks:**

- `Service`: read policy is `for select using (active)`.
- `ServiceTier`: read policy follows the parent service — `for select using (exists (select 1 from public.\"Service\" s where s.id = \"serviceId\" and s.active))`.
- `media_asset`: read policy is `for select using (deleted_at is null)` so soft-deleted assets are hidden from anon reads.
- `site_setting`: no `published` column — readable to all by default.
- `user_role`: read policy is self-read only (`for select using (user_id = auth.uid())`); write policy is admin-only (`for all using (exists (select 1 from public.user_role ur where ur.user_id = auth.uid() and ur.role = 'admin'))`).

### Auth & roles

- `/admin/login` posts email + password to a server action that calls `supabase.auth.signInWithPassword`. The Supabase session cookie is set via `@supabase/ssr`'s server helper.
- `src/proxy.ts` is rewritten: read the Supabase session, look up `user_role`, redirect to `/admin/login` if either is missing.
- `src/lib/session.ts` is renamed to `src/lib/auth.ts` and exports `requireRole('admin' | 'editor')` instead of `requireSession()`. Every server action that previously called `requireSession()` calls `requireRole(...)`. Bookings/customers admin pages require `'admin'`; content admin pages require `'admin'` or `'editor'`.
- `ADMIN_JWT_SECRET` and `ADMIN_PASSWORD_HASH` env vars are retired.
- Single initial admin user (Aiden) is created via a one-shot script that inserts into `auth.users` and `user_role`. Subsequent editors are invited via an `/admin/users` page (Slice 5).

## Public site rendering & cache

Every public-route Server Component reads from Supabase via the anon client and caches with a tag keyed to the affected content. Editor publish actions call `updateTag(...)` to invalidate. Re-render is on-demand and per-tag, not whole-site.

### Cache tag taxonomy

| Tag | Tables read | Used by |
|---|---|---|
| `services` | `Service` + `ServiceTier` | services section, footer service list |
| `testimonials` | `Testimonial` | testimonials marquee |
| `faq` | `FaqItem` | FAQ accordion |
| `gallery` | `GalleryImage` + `media_asset` | gallery grid, before/after |
| `process` | `process_step` | pinned scroll |
| `settings` | `site_setting` | footer, hero photo, story photo, anywhere global |

### Read pattern

```ts
// src/lib/cms/services.ts
import { cacheTag, cacheLife } from "next/cache";
import { supabaseAnon } from "@/lib/supabase/server";

export async function getServices() {
  "use cache";
  cacheTag("services");
  cacheLife("max");

  const { data, error } = await supabaseAnon()
    .from("Service")
    .select("*, tiers:ServiceTier(*)")
    .eq("active", true)
    .order("sortOrder");

  if (error) throw error;
  return data;
}
```

### Write pattern

```ts
// src/app/(admin)/admin/content/actions.ts
"use server";
import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function toggleServiceActive(id: string, active: boolean) {
  await requireRole("admin", "editor");
  const supabase = await supabaseServer();
  const { error } = await supabase.from("Service").update({ active }).eq("id", id);
  if (error) throw error;
  updateTag("services");
  revalidatePath("/");
  revalidatePath("/admin/content");
}
```

### Image rendering

A `<CmsImage assetId={...} sizes={...} />` wrapper resolves the asset to a Supabase Storage public URL and renders `next/image`. `next.config.ts` `images.remotePatterns` adds `{ protocol: "https", hostname: "*.supabase.co" }`.

## Media library

### Storage bucket

- One public bucket: `media`.
- Path scheme: `{yyyy}/{mm}/{slug}-{shortid}.{ext}` (e.g., `2026/05/granite-coast-hero-a7f3.jpg`). Slug derived from filename or alt; shortid is 4 hex chars to disambiguate.
- Public-read policy on the bucket (the site is public; no privacy concern). Upload requires authenticated session.

### Upload pipeline

1. Editor drops a file into the uploader (drag-zone, multi-file, 10 MB max each, `image/*` only).
2. Client requests a signed upload URL from `POST /api/media/sign` (Node runtime, role-gated). Body: `{ filename, mime, size }`.
3. Server validates mime, size, role; returns `{ url, path, token }` from `supabase.storage.from('media').createSignedUploadUrl(path)`.
4. Browser PUTs the file to the signed URL directly (skips Vercel/Netlify request body limits).
5. On success, the client calls `POST /api/media/finalize` with `{ path }`. The server reads the uploaded object, runs it through `sharp` to extract `width`, `height`, and a `blurDataURL`, inserts a `media_asset` row, returns its `id`.
6. Uploader emits the new `media_asset.id`.

### Image picker

`<MediaPicker value={assetId} onChange={...} />`:

- Grid of recent assets (paginated, 24 per page).
- Search by filename / alt / caption.
- "Upload new" button reveals the dropzone inline.
- Selected asset returns its `id`.

Used in: gallery row editor, `site_setting` editor for hero/story photos, future service card photos.

### Legacy migration

One-shot script `scripts/migrate-gallery-to-storage.ts`:

1. Walk `public/gallery/`.
2. For each file: probe dimensions with `sharp`, upload to Supabase Storage under `legacy/{original-relative-path}`, insert `media_asset` row (with empty alt for editor to fill in later), and update the corresponding existing `GalleryImage` row to point at the new asset.
3. After verification, `/public/gallery/` is deleted in a follow-up commit.

## Implementation slices

Each slice ships behind a feature-flagged page where feasible, but the site stays fully functional after every slice. Each slice ends with: schema migration applied, code merged, env vars in place, deployed to production.

### Slice 1 — Auth swap

- Provision Supabase project (or use existing); record URL and keys.
- Add `@supabase/supabase-js` and `@supabase/ssr` to dependencies.
- Create `user_role` table and its RLS policies.
- Add `src/lib/supabase/server.ts` (Server Components, route handlers, server actions) and `src/lib/supabase/client.ts` (client components, if any).
- Rewrite `src/proxy.ts` to use Supabase session + `user_role` lookup.
- Rename `src/lib/session.ts` → `src/lib/auth.ts`; export `requireRole(...)`.
- Rewrite `/admin/login` to call `signInWithPassword`. Delete `ADMIN_JWT_SECRET` and `ADMIN_PASSWORD_HASH` references.
- One-shot script to provision the initial admin user.
- Update every `(admin)` server action to call `requireRole(...)` with the appropriate role(s).
- Update `.env.example` and README.

Acceptance: existing admin (bookings/customers/content) works identically, signed in as a Supabase user. Old env vars gone.

### Slice 2 — Content reads

- Apply RLS policies to `Service`, `ServiceTier`, `Testimonial`, `FaqItem`.
- Create `process_step` table + RLS.
- Add `src/lib/cms/` readers (`getServices`, `getTestimonials`, `getFaq`, `getProcessSteps`) — each `"use cache"` + `cacheTag` + supabase-js.
- Seed Supabase from `src/data/services.ts`, `testimonials.ts`, `faq.ts`, `process-steps.ts`. One seed script per source, idempotent (upsert on a natural key).
- Switch the public Server Components to read from the new `src/lib/cms/` modules.
- Update each content admin form's server action to call `updateTag(...)` after writes.
- Delete `src/data/services.ts`, `testimonials.ts`, `faq.ts`, `process-steps.ts` once their readers go live.

Acceptance: public site is visually identical; editing a service price in `/admin/content` updates the home page within 5 seconds without a redeploy.

### Slice 3 — Media library

- Create `media` bucket and `media_asset` table + RLS.
- Add nullable `GalleryImage.media_asset_id` FK so the migration script can populate it.
- Add `/api/media/sign` and `/api/media/finalize` routes (Node runtime, role-gated).
- Build `<MediaPicker>` and `<CmsImage>` components.
- Build `/admin/media` page (list, detail, alt-text edit, soft-delete).
- Extend `next.config.ts` `images.remotePatterns` for the Supabase Storage host.
- Run `scripts/migrate-gallery-to-storage.ts` against production; delete `/public/gallery/` in a follow-up commit.

Acceptance: an editor can upload a new image, set alt text, see it in `/admin/media`, and reference it from anywhere via the picker.

### Slice 4 — Gallery + site settings

- Apply RLS to `GalleryImage`; promote `media_asset_id` to `NOT NULL`; drop legacy `src` column.
- Add `getGallery()` reader in `src/lib/cms/`, `"use cache"` + `cacheTag("gallery")`.
- Switch the public gallery section to read from the new module; delete `src/data/gallery.ts`.
- Create `site_setting` table + RLS.
- Seed `site_setting` from current hardcoded values in `footer.tsx`, `hero/`, `story-section.tsx`. Keys: `contact.phone`, `contact.email`, `contact.instagram`, `contact.hours`, `hero.photo_asset_id`, `story.photo_asset_id`, etc.
- Add `getSetting(key)` and `getSettings()` to `src/lib/cms/`, both `"use cache"` + `cacheTag("settings")`.
- Rewrite `footer.tsx`, hero, and story sections to read from settings.
- Build `/admin/settings` page (key-by-key editor; hero/story photos use `<MediaPicker>`).
- Rewrite gallery admin to use `<MediaPicker>` for `GalleryImage.media_asset_id`.

Acceptance: an editor can change the phone number in `/admin/settings` and see it on the footer within 5 seconds; can swap the hero photo from the media library without code.

### Slice 5 — Admin UX polish

- Drag-reorder for testimonials, FAQ, gallery, process steps (writes `sortOrder` in bulk).
- `/admin/users` page: list users + role; admin can invite an editor (Supabase Auth admin invite); admin can revoke.
- Inline form validation with Zod + `react-hook-form`.
- Optimistic UI on toggles (active/published, sort order changes).
- Per-section "Published" badges visible on `/admin/content`.

Acceptance: an admin can invite a second editor; that editor can sign in, edit content, but cannot access bookings or customers; reordering testimonials via drag updates the public marquee.

## Deploy impact

### New env vars

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL, public.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key, public.
- `SUPABASE_SERVICE_ROLE_KEY` — service role key, server-only. Used by the one-shot scripts and the `/api/media/sign` route for storage operations that bypass RLS.

### Retired env vars

- `ADMIN_JWT_SECRET`
- `ADMIN_PASSWORD_HASH`

### Existing env vars (unchanged)

- `DATABASE_URL` — keeps pointing at Supabase Postgres (pooled URL in prod).
- `RESEND_API_KEY`, `BOOKING_TO_EMAIL`, `BOOKING_FROM_EMAIL`.

### Other deploy changes

- `next.config.ts`: `remotePatterns` adds `{ protocol: "https", hostname: "*.supabase.co" }`.
- New dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `sharp` (for dimension probe).
- README "Deploying" section updated to walk through Supabase project setup + seed scripts.
- `npm run db:deploy` continues to apply Prisma schema. A new `npm run cms:setup` runs the Supabase-side SQL (new tables, RLS policies) and the seed scripts.

## Risks and open items

- **`sharp` on Vercel Functions / Netlify Functions.** Both support it but the dependency is platform-sensitive. If issues arise, fall back to client-side dimension probe via `Image.decode()` and skip `blurDataURL` generation server-side.
- **RLS during Prisma writes.** Prisma uses a privileged role that bypasses RLS — fine for booking/customer writes. Just need to confirm the `DATABASE_URL` user has the right grants in Supabase.
- **Supabase free-tier limits.** Free tier covers 500 MB DB, 1 GB storage, 50 K monthly active auth users. Generous for one small detailing site; flag if usage grows.
- **Initial admin provisioning.** Slice 1 requires a manual or scripted step to create Aiden's Supabase Auth user and grant the `admin` role before deploying. Document explicitly.
- **Cache Components stability.** Next.js 16's `"use cache"` + `cacheTag` is GA in 16.2; this project is on 16.2.6 so we're fine.
- **Cost of `updateTag` cascading.** On a publish, all pages tagged with the affected key invalidate. Granular tag scheme above (one per content type) keeps blast radius small.

## Out of scope (Phase 2 / Phase 3 hooks)

Phase 1 deliberately leaves these unbuilt; the data model and architecture are chosen so they can be added without breakage:

- A `home_section(name, sort_order, enabled)` table for Phase 2 section ordering — no Phase 1 code references home-page section order; it stays in `(site)/page.tsx`.
- A `theme_token(key, value)` shape, parallel to `site_setting`, for Phase 2 — `site_setting` is jsonb so it can host tokens if a separate table proves unnecessary.
- A `content_draft` table for Phase 3 — current writes go straight to the published table; adding drafts means inserting a draft row and a publish action that promotes it. No Phase 1 code makes this impossible.
