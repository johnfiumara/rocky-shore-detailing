# Slice 4 — Gallery CMS Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the public `gallery-section` to read from Supabase `GalleryImage` + `site_setting`, so admin edits in `/admin/gallery` reach the public site without a redeploy.

**Architecture:** New `src/lib/cms/gallery.ts` read module (no caching, static fallback) mirrors existing `src/lib/cms/*` modules. Split `gallery-section.tsx` into a tiny Server Component wrapper + a `gallery-section-client.tsx` carousel, mirroring the existing `process-section.tsx` + `process-section-client.tsx` split. Seed empty `GalleryImage` table from the static `src/data/gallery.ts` content; store curated before/after caption in `site_setting`.

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr` (read) + `@supabase/supabase-js` service role (seed), Prisma 7 (admin writes only — not touched here), vitest, embla-carousel-react.

**Spec:** [../specs/2026-05-31-slice-4-gallery-cms-design.md](../specs/2026-05-31-slice-4-gallery-cms-design.md)

---

## File Inventory

| File | Action | Purpose |
|---|---|---|
| `scripts/seed-gallery.ts` | Create | Seed `GalleryImage` rows from `vehicles[0].images` (brown-truck) |
| `scripts/seed-settings.ts` | Modify | Add `gallery.before_after_label` row |
| `package.json` | Modify | Add `cms:seed:gallery` script; include in `cms:seed` aggregate |
| `src/lib/cms/gallery.ts` | Create | `getGalleryImages()` + `getBeforeAfterPair()` read module |
| `src/lib/__tests__/cms-gallery.test.ts` | Create | Unit tests for read module fallback + selection rule |
| `src/components/gallery-section-client.tsx` | Create (renamed from current `.tsx`) | Embla carousel + BeforeAfter rendering, props-driven |
| `src/components/gallery-section.tsx` | Replace contents | Server Component wrapper: fetches data, passes to client |

---

# ───────────────────────────────────────────────────────────
# Task 1 — Seed `GalleryImage` table
# ───────────────────────────────────────────────────────────

**Files:**
- Create: `scripts/seed-gallery.ts`
- Modify: `scripts/seed-settings.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/seed-gallery.ts`**

```ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { vehicles } from "../src/data/gallery";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BEFORE_SRC = "/gallery/brown-truck/driver-side.jpg";
const AFTER_SRC = "/gallery/brown-truck/exterior-front.jpg";

async function main() {
  const sourceImages = vehicles.flatMap((v) => v.images);
  if (sourceImages.length === 0) {
    console.log("No source images to seed.");
    return;
  }

  // Skip rows that already exist (src is not unique in schema, so query-then-insert).
  const { data: existing, error: readErr } = await supabase
    .from("GalleryImage")
    .select("src");
  if (readErr) {
    console.error("Failed to read GalleryImage:", readErr.message);
    process.exit(1);
  }
  const existingSrcs = new Set((existing ?? []).map((r) => r.src));

  let sortOrder = 0;
  for (const img of sourceImages) {
    sortOrder += 10;
    if (existingSrcs.has(img.src)) {
      console.log("Skip (exists):", img.src);
      continue;
    }
    const row = {
      vehicleId: null,
      src: img.src,
      alt: img.alt,
      label: null,
      isBefore: img.src === BEFORE_SRC,
      isAfter: img.src === AFTER_SRC,
      sortOrder,
      published: true,
    };
    const { error } = await supabase.from("GalleryImage").insert(row);
    if (error) {
      console.error("Failed to insert", img.src, error.message);
    } else {
      console.log("Inserted:", img.src);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Extend `scripts/seed-settings.ts`**

Add this entry to the `settings` array (anywhere in the list, before the closing `]`):

```ts
{ key: "gallery.before_after_label", value: "Recent detail · client pickup" },
```

- [ ] **Step 3: Update `package.json` scripts**

In the `"scripts"` object, add the gallery seed and update the aggregate:

```json
"cms:seed:gallery": "tsx scripts/seed-gallery.ts",
"cms:seed": "npm run cms:seed:services && npm run cms:seed:testimonials && npm run cms:seed:faq && npm run cms:seed:process && npm run cms:seed:gallery && npm run cms:seed:settings",
```

(Keep the existing `cms:seed:settings` line unchanged.)

- [ ] **Step 4: Run the seeds**

```bash
npm run cms:seed:gallery
npm run cms:seed:settings
```

Expected:
- `seed-gallery`: `Inserted: /gallery/brown-truck/exterior.jpg` (×6 lines, one per image), no errors.
- `seed-settings`: at minimum `Seeded setting: gallery.before_after_label` plus the existing settings.

- [ ] **Step 5: Verify in Supabase**

Open `/admin/gallery` in a browser (dev server must be running with `npm run dev`). Expected: 6 images appear under "Unassigned" (because `vehicleId` is null). Two of them show as flagged: `driver-side.jpg` (Before) and `exterior-front.jpg` (After).

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-gallery.ts scripts/seed-settings.ts package.json
git commit -m "feat(cms): seed gallery images and before/after caption setting"
```

---

# ───────────────────────────────────────────────────────────
# Task 2 — Read module + tests
# ───────────────────────────────────────────────────────────

**Files:**
- Create: `src/lib/cms/gallery.ts`
- Test: `src/lib/__tests__/cms-gallery.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/cms-gallery.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { beforeAfterPair as staticPair, galleryGrid as staticGrid } from "@/data/gallery";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAnon: () => supabaseMock,
}));

vi.mock("@/lib/cms/settings", () => ({
  getSetting: vi.fn().mockResolvedValue("Recent detail · client pickup"),
}));

function chain(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  return { select };
}

describe("getGalleryImages", () => {
  it("returns rows from Supabase when present", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([{ src: "/a.jpg", alt: "a" }, { src: "/b.jpg", alt: "b" }]),
    );
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toEqual([
      { src: "/a.jpg", alt: "a" },
      { src: "/b.jpg", alt: "b" },
    ]);
  });

  it("falls back to static grid when Supabase returns empty", async () => {
    supabaseMock.from.mockReturnValueOnce(chain([]));
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toBe(staticGrid);
  });

  it("falls back to static grid on Supabase error", async () => {
    supabaseMock.from.mockReturnValueOnce(chain(null, { message: "boom" }));
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toBe(staticGrid);
  });
});

describe("getBeforeAfterPair", () => {
  it("pairs first isBefore with first isAfter in same vehicle", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([
        { src: "/b1.jpg", alt: "b1", vehicleId: "v1", isBefore: true, isAfter: false, sortOrder: 10 },
        { src: "/a1.jpg", alt: "a1", vehicleId: "v1", isBefore: false, isAfter: true, sortOrder: 20 },
        { src: "/a2.jpg", alt: "a2", vehicleId: "v2", isBefore: false, isAfter: true, sortOrder: 30 },
      ]),
    );
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toEqual({
      label: "Recent detail · client pickup",
      before: { src: "/b1.jpg", alt: "b1" },
      after: { src: "/a1.jpg", alt: "a1" },
    });
  });

  it("falls back to any isAfter when no same-vehicle match", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([
        { src: "/b1.jpg", alt: "b1", vehicleId: null, isBefore: true, isAfter: false, sortOrder: 10 },
        { src: "/a1.jpg", alt: "a1", vehicleId: "v2", isBefore: false, isAfter: true, sortOrder: 20 },
      ]),
    );
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result.before.src).toBe("/b1.jpg");
    expect(result.after.src).toBe("/a1.jpg");
  });

  it("returns static pair when no isBefore exists", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([
        { src: "/a1.jpg", alt: "a1", vehicleId: null, isBefore: false, isAfter: true, sortOrder: 10 },
      ]),
    );
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toBe(staticPair);
  });

  it("returns static pair on Supabase error", async () => {
    supabaseMock.from.mockReturnValueOnce(chain(null, { message: "boom" }));
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toBe(staticPair);
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
npm run test:run -- src/lib/__tests__/cms-gallery.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/cms/gallery'" (or similar import error).

- [ ] **Step 3: Implement `src/lib/cms/gallery.ts`**

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
    return data as CmsGalleryImage[];
  } catch {
    return staticGrid;
  }
}

type PairRow = {
  src: string;
  alt: string;
  vehicleId: string | null;
  isBefore: boolean;
  isAfter: boolean;
  sortOrder: number;
};

export async function getBeforeAfterPair(): Promise<BeforeAfterPair> {
  try {
    const { data, error } = await supabaseAnon()
      .from("GalleryImage")
      .select("src, alt, vehicleId, isBefore, isAfter, sortOrder")
      .eq("published", true)
      .order("sortOrder");
    if (error || !data || data.length === 0) return staticPair;

    const rows = data as PairRow[];
    const before = rows.find((r) => r.isBefore);
    if (!before) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[gallery] No GalleryImage marked isBefore=true — using static pair.");
      }
      return staticPair;
    }

    const after =
      rows.find((r) => r.isAfter && r.vehicleId && r.vehicleId === before.vehicleId) ??
      rows.find((r) => r.isAfter);
    if (!after) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[gallery] No GalleryImage marked isAfter=true — using static pair.");
      }
      return staticPair;
    }

    const label =
      (await getSetting<string>("gallery.before_after_label")) ?? "Recent detail";
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

- [ ] **Step 4: Run the test — confirm it passes**

```bash
npm run test:run -- src/lib/__tests__/cms-gallery.test.ts
```

Expected: PASS for all 7 tests.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
npm run test:run
```

Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cms/gallery.ts src/lib/__tests__/cms-gallery.test.ts
git commit -m "feat(cms): gallery read module with isBefore/isAfter pair selection"
```

---

# ───────────────────────────────────────────────────────────
# Task 3 — Component split (client carousel)
# ───────────────────────────────────────────────────────────

**Files:**
- Create: `src/components/gallery-section-client.tsx` (content moved from current `gallery-section.tsx` with prop changes)

- [ ] **Step 1: Create `src/components/gallery-section-client.tsx`**

Copy the current contents of `src/components/gallery-section.tsx` into a new file `src/components/gallery-section-client.tsx`, then apply these changes:

1. Rename the default export `GallerySection` → `GallerySectionClient`.
2. Replace the import of `beforeAfter`/`galleryGrid` from `@/data/gallery` with a props interface.
3. Use `pair` and `images` from props instead of the static imports.

Full file content:

```tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Reveal from "@/components/reveal";
import BeforeAfter from "@/components/before-after";
import type { BeforeAfterPair } from "@/data/gallery";
import type { CmsGalleryImage } from "@/lib/cms/gallery";

type Props = {
  images: CmsGalleryImage[];
  pair: BeforeAfterPair;
};

export default function GallerySectionClient({ images, pair }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    duration: 28,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  const totalSlides = images.length + 1;

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-h"
      className="relative py-32 md:py-44 border-t border-line"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">Selected work</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="gallery-h" className="headline mt-6 text-5xl md:text-7xl">
                Drag the line.
                <br />
                <em>See the difference.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-bone-dim leading-relaxed">
                {pair.label}
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Selected detailing work"
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
              <div className="flex touch-pan-y">
                <div
                  className="relative shrink-0 grow-0 basis-full pl-0 pr-4"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`1 of ${totalSlides}: before and after`}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <BeforeAfter pair={pair} />
                </div>

                {images.map((img, i) => (
                  <div
                    key={img.src}
                    className="relative shrink-0 grow-0 basis-full pl-0 pr-4"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 2} of ${totalSlides}`}
                  >
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-line">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(min-width: 768px) 75vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous slide"
              className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 size-12 rounded-full border border-line-strong bg-ink/70 backdrop-blur text-bone hover:text-bronze hover:border-bronze transition-colors flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next slide"
              className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 size-12 rounded-full border border-line-strong bg-ink/70 backdrop-blur text-bone hover:text-bronze hover:border-bronze transition-colors flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="mt-8 flex items-center justify-between gap-6">
              <div
                className="flex flex-wrap items-center gap-2"
                role="tablist"
                aria-label="Slide selection"
              >
                {Array.from({ length: totalSlides }, (_, i) => {
                  const active = i === selectedIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => scrollTo(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        active
                          ? "w-10 bg-bronze"
                          : "w-5 bg-bone/30 hover:bg-bone/60"
                      }`}
                    />
                  );
                })}
              </div>
              <p
                className="font-mono-accent text-[10px] tracking-[0.2em] uppercase text-bone-dim"
                aria-live="polite"
              >
                {String(selectedIndex + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check the new client file**

```bash
npx tsc --noEmit
```

Expected: clean. (The old `gallery-section.tsx` is still importing static data — that will be replaced in Task 4.)

If tsc complains about a duplicate default export across the two gallery files or about unused imports in the old `gallery-section.tsx`, ignore for this step — Task 4 replaces the old file's contents.

- [ ] **Step 3: Commit**

```bash
git add src/components/gallery-section-client.tsx
git commit -m "feat(gallery): extract carousel into props-driven client component"
```

---

# ───────────────────────────────────────────────────────────
# Task 4 — Server Component wrapper
# ───────────────────────────────────────────────────────────

**Files:**
- Modify: `src/components/gallery-section.tsx` (full rewrite — see code below)

- [ ] **Step 1: Replace `src/components/gallery-section.tsx` with the Server Component**

```tsx
import { getGalleryImages, getBeforeAfterPair } from "@/lib/cms/gallery";
import GallerySectionClient from "./gallery-section-client";

export default async function GallerySection() {
  const [images, pair] = await Promise.all([
    getGalleryImages(),
    getBeforeAfterPair(),
  ]);
  return <GallerySectionClient images={images} pair={pair} />;
}
```

(Note: `Promise.all` is used to fetch both in parallel rather than serially, matching the avoid-waterfalls guidance.)

- [ ] **Step 2: Type-check the project**

```bash
npx tsc --noEmit
```

Expected: clean. No `gallery-section.tsx` import errors and no leftover unused-import warnings.

- [ ] **Step 3: Run full test suite**

```bash
npm run test:run
```

Expected: all suites pass.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: build completes with no TypeScript errors. Some image domain warnings from `next/image` are acceptable.

- [ ] **Step 5: Commit**

```bash
git add src/components/gallery-section.tsx
git commit -m "feat(gallery): public section reads from CMS instead of static data"
```

---

# ───────────────────────────────────────────────────────────
# Task 5 — Manual smoke test + acceptance verification
# ───────────────────────────────────────────────────────────

**Files:** None.

This task is verification, not code. Run each step and confirm the expected result.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Visit home page**

Navigate to `http://localhost:3000`. Scroll to the gallery section.

Expected:
- Carousel renders with 7 total slides (1 before/after + 6 carousel images).
- Caption above the carousel reads "Recent detail · client pickup".
- Before/after slider uses `driver-side.jpg` as before and `exterior-front.jpg` as after.
- Visual parity with prior render — no broken images, layout unchanged.

- [ ] **Step 3: Toggle an image's `published` to false in `/admin/gallery`**

Sign in to `/admin` (admin or editor role), navigate to `/admin/gallery`, pick any one of the six images (NOT the before or after pair images), toggle its publish status off.

Reload `http://localhost:3000`. Expected: that image no longer appears in the carousel (now 6 slides total instead of 7).

- [ ] **Step 4: Reorder images in `/admin/gallery`**

Move one image up or down via the reorder controls.

Reload `http://localhost:3000`. Expected: carousel slide order matches the new admin order.

- [ ] **Step 5: Toggle the before/after pair**

In `/admin/gallery`, flip the `isBefore` flag off on `driver-side.jpg` (which removes the only `isBefore=true` row), reload.

Expected: the before/after slider falls back to the static `beforeAfterPair` (driver-side as before, exterior-front as after — visually identical because the static label and the seeded settings label are both `"Recent detail · client pickup"`). The unambiguous signal is a dev-console warning: `[gallery] No GalleryImage marked isBefore=true — using static pair.`

Then flip the flag back on. Expected: warning disappears; carousel still renders correctly (now driven by CMS again).

- [ ] **Step 6: Restore the publish toggle**

Re-publish the image you turned off in Step 3 so the site is back to the seeded state.

- [ ] **Step 7: No commit**

Smoke-test only — nothing to commit.

---

## Acceptance Recap

All seven acceptance criteria from the spec map to verified steps:

| Spec criterion | Verified in |
|---|---|
| 1. Seeded site shows visual parity | Task 5 Step 2 |
| 2. Toggling `published` off hides image | Task 5 Step 3 |
| 3. Reordering changes public order | Task 5 Step 4 |
| 4. Flipping flags changes featured pair | Task 5 Step 5 |
| 5. Settings label change updates caption | implied via Task 2 test + Task 5 Step 5 (settings label proven loading) |
| 6. Supabase outage falls back to static | Task 2 unit tests cover all fallback branches |
| 7. `npm run build` clean | Task 4 Step 4 |

## Out of Scope (Reminder)

Not in this plan:
- Cache Components (`experimental.cacheComponents`, `"use cache"`, `updateTag`) — defer to a separate performance pass.
- Admin UI for `gallery.before_after_label` — edit via SQL until a Settings admin page exists.
- Vehicle-attached gallery seed rows — requires fake Customer; defer.
- MediaAsset linkage — separate concern.

## Risks

- **Schema mismatch**: if `prisma/schema.prisma` ever adds a `@unique` on `GalleryImage.src`, the seed's query-then-insert becomes a candidate for `upsert`. Re-evaluate at that time.
- **Static fallback shadowing**: if the seed is skipped, the public site looks unchanged — but admin edits won't reach it. Task 5 Step 2 catches this (carousel slide count should be 7, not 6 — the static `galleryGrid` also has 6 images so this is NOT a foolproof check; the surer signal is opening `/admin/gallery` and seeing seeded rows).
