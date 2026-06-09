---
name: add-cms-content-type
description: Scaffold a new CMS content type end-to-end in this repo — Prisma model, server actions (create/update/toggle/reorder/delete), admin manager page, and a seed script. Use when adding a new editable section (e.g. banners, awards, team members) that follows the established Service/Testimonial/FaqItem/GalleryImage pattern.
---

# Add a CMS content type

Five content types already follow the same recipe in this codebase: `Service`, `Testimonial`, `FaqItem`, `GalleryImage`, `ProcessStep`. New editable sections should match. This skill walks through the scaffolding.

## When to use

- The user asks to "add a new content section" / "add CMS support for X" / "make X editable from the admin"
- A new public-facing section needs admin CRUD with publish/unpublish and ordering

## When NOT to use

- One-off settings that don't need ordering or publish gating → extend `SiteSetting` instead
- Anything that maps to bookings, customers, vehicles, or expenses — those have their own bespoke models

## Required inputs

Confirm with the user before generating files:

1. **Singular model name** in PascalCase (e.g. `Banner`).
2. **Plural slug** for the route (e.g. `banners` → `/admin/banners`).
3. **Fields** beyond the standard envelope. The envelope is always:
   - `id String @id @default(cuid())`
   - `published Boolean @default(true)`
   - `sortOrder Int @default(0)`
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`

## Steps

### 1. Add the Prisma model

Append to `prisma/schema.prisma`:

```prisma
model Banner {
  id          String   @id @default(cuid())
  // ... custom fields, all sanitized strings (see step 3)
  title       String
  body        String
  published   Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run `npm run db:push` locally, `npm run db:deploy` against prod.

### 2. Add a CMS reader in `src/lib/cms/<plural>.ts`

Mirror `src/lib/cms/services.ts`. Public callers should use the `supabaseAnon()` client and filter `published=true`, ordered by `sortOrder`.

### 3. Add the server actions to `src/app/(admin)/admin/actions.ts`

Every action MUST follow the envelope (see CLAUDE.md → "Server action conventions"). Five actions per content type:

```typescript
// Create
const bannerSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
});

export async function createBanner(_: unknown, formData: FormData) {
  await requireRole("admin", "editor");
  const parsed = bannerSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields." };

  await prisma.banner.create({
    data: {
      title: sanitizeHtml(parsed.data.title),
      body: sanitizeRichText(parsed.data.body),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/banners");
  return { ok: true };
}

// Update — accept id + partial data, sanitize each field individually.
// Toggle published — single bool, no Zod needed but still requireRole.
// Reorder — array of {id, sortOrder} in a $transaction.
// Delete — id only.
```

### 4. Add `/admin/<plural>/page.tsx`

Server component that `requireRole("admin", "editor")`, fetches via `prisma.banner.findMany`, and renders a manager component. Pattern: see `src/app/(admin)/admin/content/testimonials-manager.tsx`.

Use the shared `<Pagination>` from `src/app/(admin)/admin/_components/pagination.tsx` if the list can exceed 25 items.

### 5. Add the manager component

Client component with optimistic updates via `useTransition`. Imports the actions from `../actions`. Re-uses inline form patterns from `services-table.tsx`.

### 6. Add to admin nav

`src/app/(admin)/admin/admin-nav.tsx` → push an entry into `NAV` with an appropriate `lucide-react` icon.

### 7. Add a seed script (optional)

`scripts/seed-banners.ts` mirroring `scripts/seed-services.ts`. Wire into `cms:seed` in `package.json`.

### 8. Public consumer

If the new content type renders on the public site, add a section component under `src/components/site/` that calls the CMS reader from step 2 and renders server-side. Wire into `src/app/(site)/page.tsx`.

## Test before declaring done

- `npm run db:push` succeeds
- `npm run lint` is clean for the new files
- `npm run test:run` still passes
- Visit `/admin/<plural>` in dev — create, toggle, reorder, delete all work
- Visit `/` — the new section renders only `published=true` items in sortOrder
