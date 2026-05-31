# CMS Phase 1 — Slice 4: Gallery → CMS Design

**Date:** 2026-05-31
**Status:** Approved design, ready for implementation plan
**Parent plan:** [2026-05-29-cms-phase-1-slice-2-5.md](../plans/2026-05-29-cms-phase-1-slice-2-5.md)
**Spec:** [2026-05-28-cms-phase-1-design.md](2026-05-28-cms-phase-1-design.md)

## Problem

The admin can edit `GalleryImage` rows in `/admin/gallery` (full CRUD via Prisma + Server Actions), but the public `gallery-section.tsx` still imports `beforeAfterPair` and `galleryGrid` from the static `src/data/gallery.ts`. Admin edits never reach the public site — this is the only currently broken slice in Phase 1.

Additionally, the `GalleryImage` table is empty (no seed script exists). Even after wiring the public site to the CMS, the static fallback would silently swallow the change unless we seed.

## Goal

Public `gallery-section` reads from Supabase `GalleryImage` (and `site_setting` for the curated pair caption). Admin toggles in `/admin/gallery` surface immediately on the public site. No visible regression — current static content shows identically after seeding.

## Architecture

### Read module — `src/lib/cms/gallery.ts`

Mirrors the existing CMS module pattern (`services.ts`, `process-steps.ts`): plain async function, no `"use cache"` (Cache Components is not enabled platform-wide), static fallback inside try/catch so the site survives a Supabase outage.

```ts
import { supabaseAnon } from "@/lib/supabase/server";
import {
  galleryGrid as staticGrid,
  beforeAfterPair as staticPair,
  type BeforeAfterPair,
} from "@/data/gallery";
import { getSetting } from "@/lib/cms/settings";

export type CmsGalleryImage = { src: string; alt: string };

export async function getGalleryImages(): Promise<CmsGalleryImage[]> {
  try {
    const { data, error } = await supabaseAnon()
      .from("GalleryImage")
      .select("src, alt")
      .eq("published", true)
      .order("sortOrder");
    if (error || !data || data.length === 0) return staticGrid;
    return data;
  } catch {
    return staticGrid;
  }
}

export async function getBeforeAfterPair(): Promise<BeforeAfterPair> {
  try {
    const sb = supabaseAnon();
    const { data: rows, error } = await sb
      .from("GalleryImage")
      .select("src, alt, vehicleId, isBefore, isAfter, sortOrder")
      .eq("published", true)
      .order("sortOrder");
    if (error || !rows?.length) return staticPair;

    const before = rows.find((r) => r.isBefore);
    if (!before) return staticPair;

    const after =
      rows.find((r) => r.isAfter && r.vehicleId && r.vehicleId === before.vehicleId) ??
      rows.find((r) => r.isAfter);
    if (!after) return staticPair;

    const label = (await getSetting<string>("gallery.before_after_label")) ?? "Recent detail";
    return {
      label,
      before: { src: before.src, alt: before.alt },
      after: { src: after.src, alt: after.alt },
    };
  } catch {
    return staticPair;
  }
}
```

**Selection rule:**
1. First published image with `isBefore=true` (by `sortOrder`) → `before`.
2. First published image with `isAfter=true`, prefer same `vehicleId` as the `before` → `after`.
3. Caption: read from `site_setting` key `gallery.before_after_label`; default `"Recent detail"` if missing.
4. If `before` or `after` is missing → fall back to `staticPair` so the section never goes blank.

### Component split — mirror `process-section`

| File | Role |
|---|---|
| `src/components/gallery-section.tsx` (new, Server) | `await getGalleryImages()` + `await getBeforeAfterPair()`, renders the `<section>` shell + headline, passes `{ images, pair }` to the client carousel |
| `src/components/gallery-section-client.tsx` (renamed from `gallery-section.tsx`) | All existing Embla carousel + `BeforeAfter` rendering. Accepts `{ images: CmsGalleryImage[]; pair: BeforeAfterPair }` props. No further changes. |

Public page (`src/app/(site)/page.tsx`) keeps the existing `dynamic(() => import("@/components/gallery-section"), { ssr: true, loading: GallerySkeleton })` import — no change needed (the new SC wrapper has the same path).

`BeforeAfter` (in `before-after.tsx`) keeps its `BeforeAfterPair` type import from `@/data/gallery`. The type stays in `@/data/gallery` so we don't churn unrelated imports.

### Seed data — `scripts/seed-gallery.ts` + `scripts/seed-settings.ts` extension

Why we need it: with the table empty, the fallback to `staticGrid` would hide the wiring change. Seeding the existing static content into `GalleryImage` rows means the public site looks identical after the swap.

**`scripts/seed-gallery.ts`** — mirrors `seed-settings.ts` shape:
- Connects with `SUPABASE_SERVICE_ROLE_KEY`
- Upserts each image from `vehicles[0].images` (brown-truck) with `vehicleId=null` (ungrouped, since `Vehicle` requires a `customerId` FK we don't have a customer for in seed data)
- Marks `driver-side.jpg` as `isBefore=true`, `exterior-front.jpg` as `isAfter=true` (matches the existing static pair)
- All other brown-truck images stay `isBefore=false, isAfter=false`
- Sets monotonically increasing `sortOrder` per image
- Upsert keyed on `src` so re-running is idempotent (NOTE: requires `src` to be unique; if Prisma schema doesn't enforce, the seed should query+insert instead of upsert)

**Extend `scripts/seed-settings.ts`** to add:
```ts
{ key: "gallery.before_after_label", value: "Recent detail · client pickup" }
```

**Package.json:**
```json
"cms:seed:gallery": "tsx scripts/seed-gallery.ts",
"cms:seed": "npm run cms:seed:services && npm run cms:seed:testimonials && npm run cms:seed:faq && npm run cms:seed:process && npm run cms:seed:gallery && npm run cms:seed:settings"
```

### Schema check

`GalleryImage.src` is `String` with no `@unique` in `prisma/schema.prisma:99` — confirmed. The seed must query-then-insert (or delete-and-insert if running on a fresh-ish env) rather than rely on upsert by `src`. Spec assumes query-then-insert.

## Acceptance Criteria

1. After running `npm run cms:seed:gallery` and `npm run cms:seed:settings`, the public home page `/` renders the same gallery carousel as before (visual parity).
2. Toggling `published` off on a `GalleryImage` row in `/admin/gallery` removes that image from the carousel on next public-page visit.
3. Reordering images via `/admin/gallery` reorders the public carousel.
4. Flipping `isBefore` and `isAfter` flags via `/admin/gallery` changes which images appear in the featured before/after pair.
5. Editing `gallery.before_after_label` in the `site_setting` table (or via a future settings UI) changes the caption text.
6. If Supabase is unreachable, the site still renders using static fallback (no error page).
7. `npm run build` completes without TypeScript errors.

## Out of Scope (Deliberate)

- **Cache Components / `updateTag`**: Slice 2 didn't get Cache Components either. Existing `revalidatePath("/")` in admin actions stays. A future performance pass can add `experimental.cacheComponents` across Slices 2 and 4 together.
- **Admin UI for `gallery.before_after_label`**: edit via SQL or the future Settings admin page (Slice 5 territory).
- **Vehicle-attached gallery rows in seed**: requires a fake Customer. Defer until admin has a "Showcase customer" provisioning path.
- **Media library integration (mediaAssetId linkage)**: out of this slice — already a separate concern under Slice 3.

## Implementation Order (will go into the plan)

1. Add `seed-gallery.ts` script; extend `seed-settings.ts` with the label; update `package.json` scripts.
2. Run seed: `npm run cms:seed:gallery && npm run cms:seed:settings`. Verify in Supabase or via `/admin/gallery` UI.
3. Create `src/lib/cms/gallery.ts`. Add a quick unit test verifying fallback behavior (mocked supabase returns `null`).
4. Rename current `src/components/gallery-section.tsx` → `gallery-section-client.tsx`; update its imports to accept `{ images, pair }` props.
5. Create new `src/components/gallery-section.tsx` Server Component that fetches and passes props.
6. `npm run build` — must compile.
7. Manual smoke test in dev: visual parity with prior render; toggle published in `/admin/gallery` and confirm propagation.
8. Commit per logical step (seed, read module, component split).

## Risks / Open Questions

- **Embla import cost**: client component re-mounts on prop change. Acceptable for this site's traffic.
- **Static fallback shadowing**: if the seed runs but flags aren't set, `getBeforeAfterPair` returns `staticPair`. We could log a one-line console warning in dev (`if (process.env.NODE_ENV === "development")`) so it's visible during development. **Decision in plan**: add the dev-only warn.
