# CMS Phase 1 — Slices 2–5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining Phase 1 CMS work. After these four slices, every piece of copy and every image on the public site is editable from `/admin` without a code change or redeploy. The public site reads from Supabase Postgres through Next.js 16 `"use cache"` Cache Components with tag-based invalidation; edits go live in under 5 seconds.

**Architecture:** Supabase Postgres holds all content. Prisma stays for the booking API. `@supabase/ssr` handles all CMS reads/writes. Supabase Storage holds media. Cache tags (`services`, `testimonials`, `faq`, `gallery`, `process`, `settings`) invalidate on writes.

**Spec:** [docs/superpowers/specs/2026-05-28-cms-phase-1-design.md](../specs/2026-05-28-cms-phase-1-design.md)  
**Prerequisite:** Slice 1 (Auth swap) is complete and on `main`.

---

## Status as of 2026-05-29

**Slice 1: Complete.** Supabase Auth + `user_role` table + `requireRole(...)` + provision script are all shipped.

**Partial progress from prior work:** The existing CMS admin pages (`/admin/content`, `/admin/gallery`) already have full CRUD, edit inline, toggle publish/active, and reorder via up/down arrows. What's left is:
1. Making the public site read from Supabase instead of `src/data/*.ts`.
2. Adding cache tags + invalidation so edits go live immediately.
3. Building the media library for image upload.
4. Moving gallery images + hero/story/footer content into the CMS.
5. Adding an `/admin/users` page for role management.

---

# ───────────────────────────────────────────────────────────
# SLICE 2 — Content Reads
# ───────────────────────────────────────────────────────────

**Goal:** The public site reads services, testimonials, FAQ, and process steps from Supabase instead of `src/data/*.ts`. Each read is cached with a tag. Admin writes call `updateTag(...)` to invalidate.

**Acceptance:** Public site is visually identical. Editing a service price in `/admin/content` updates the home page within 5 seconds without a redeploy.

---

## Task 1: Create `src/lib/cms/` read modules

**Files:**
- Create: `src/lib/cms/services.ts`
- Create: `src/lib/cms/testimonials.ts`
- Create: `src/lib/cms/faq.ts`
- Create: `src/lib/cms/process-steps.ts`

Each file:
- Exports a `getX()` async function.
- Starts with `"use cache"`.
- Calls `cacheTag("services"|"testimonials"|"faq"|"process")`.
- Calls `cacheLife("max")`.
- Uses `supabaseAnon()` from `@/lib/supabase/server`.
- Falls back to static data if the DB is unreachable (keep the site functional offline).

**`src/lib/cms/services.ts`**

```ts
import { cacheTag, cacheLife } from "next/cache";
import { supabaseAnon } from "@/lib/supabase/server";
import { services as staticServices } from "@/data/services";

export type CmsService = {
  slug: string;
  title: string;
  description: string | null;
  tiers: { size: string; price: number }[];
};

export async function getServices(): Promise<CmsService[]> {
  "use cache";
  cacheTag("services");
  cacheLife("max");

  try {
    const { data, error } = await supabaseAnon()
      .from("Service")
      .select("slug, title, description, tiers:ServiceTier(size, price)")
      .eq("active", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) return staticServices;
    return data as CmsService[];
  } catch {
    return staticServices;
  }
}
```

**`src/lib/cms/testimonials.ts`**

```ts
import { cacheTag, cacheLife } from "next/cache";
import { supabaseAnon } from "@/lib/supabase/server";
import { testimonials as staticTestimonials } from "@/data/testimonials";

export type CmsTestimonial = {
  quote: string;
  name: string;
  context: string;
};

export async function getTestimonials(): Promise<CmsTestimonial[]> {
  "use cache";
  cacheTag("testimonials");
  cacheLife("max");

  try {
    const { data, error } = await supabaseAnon()
      .from("Testimonial")
      .select("quote, name, context")
      .eq("published", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) return staticTestimonials;
    return data;
  } catch {
    return staticTestimonials;
  }
}
```

**`src/lib/cms/faq.ts`**

```ts
import { cacheTag, cacheLife } from "next/cache";
import { supabaseAnon } from "@/lib/supabase/server";
import { faq as staticFaq } from "@/data/faq";

export type CmsFaqItem = { q: string; a: string };

export async function getFaq(): Promise<CmsFaqItem[]> {
  "use cache";
  cacheTag("faq");
  cacheLife("max");

  try {
    const { data, error } = await supabaseAnon()
      .from("FaqItem")
      .select("question, answer")
      .eq("published", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) return staticFaq;
    return data.map((r) => ({ q: r.question, a: r.answer }));
  } catch {
    return staticFaq;
  }
}
```

**`src/lib/cms/process-steps.ts`**

```ts
import { cacheTag, cacheLife } from "next/cache";
import { supabaseAnon } from "@/lib/supabase/server";
import { processSteps as staticSteps } from "@/data/process-steps";

export type CmsProcessStep = {
  number: string;
  title: string;
  body: string;
};

export async function getProcessSteps(): Promise<CmsProcessStep[]> {
  "use cache";
  cacheTag("process");
  cacheLife("max");

  try {
    const { data, error } = await supabaseAnon()
      .from("process_step")
      .select("id, title, body")
      .eq("published", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) return staticSteps;
    return data.map((r, i) => ({
      number: String(i + 1).padStart(2, "0"),
      title: r.title,
      body: r.body,
    }));
  } catch {
    return staticSteps;
  }
}
```

- [ ] **Step 1: Create all four files**

- [ ] **Step 2: Verify `tsc`**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cms/
git commit -m "feat(cms): add cached read modules for services, testimonials, FAQ, process"
```

---

## Task 2: Switch public site components to new read modules

**Files:**
- Modify: `src/components/services-section.tsx`
- Modify: `src/components/testimonials-section.tsx`
- Modify: `src/components/faq-section.tsx`
- Modify: `src/components/process-section.tsx`

Each one:
- Replace the inline `getX()` function + `prisma` import with the new `src/lib/cms/` import.
- Keep the same component props/shape so the JSX doesn't change.

- [ ] **Step 1: Update all four components**

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: compiles.

- [ ] **Step 3: Commit**

```bash
git add src/components/
git commit -m "feat(cms): switch public site to read from Supabase via cache-tagged modules"
```

---

## Task 3: Add `updateTag(...)` to admin write actions

**Files:**
- Modify: `src/app/(admin)/admin/actions.ts`

After every write in the content and gallery sections, call `updateTag(...)` + `revalidatePath("/")`. Import `updateTag` from `next/cache`.

Add tag calls to these existing functions:
- `updateServiceTierPrice`, `toggleServiceActive`, `updateServiceDescription`, `reorderServices` → `updateTag("services")`
- `createTestimonial`, `deleteTestimonial`, `toggleTestimonialPublished`, `updateTestimonial`, `reorderTestimonials` → `updateTag("testimonials")`
- `createFaqItem`, `deleteFaqItem`, `toggleFaqItemPublished`, `updateFaqItem`, `reorderFaqItems` → `updateTag("faq")`
- `updateGalleryImage`, `toggleGalleryImagePublished`, `reorderGalleryImages` → `updateTag("gallery")`

- [ ] **Step 1: Add `updateTag` import and apply to all write actions**

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(admin)/admin/actions.ts
git commit -m "feat(cms): invalidate cache tags on content writes"
```

---

## Task 4: Seed Supabase from static data

**Files:**
- Create: `scrip
