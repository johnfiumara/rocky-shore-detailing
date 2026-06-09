---
name: add-server-action
description: Write a new server action in src/app/(admin)/admin/actions.ts (or an API route) that follows the project's required envelope — requireRole + Zod validation + sanitize + Prisma + revalidatePath + safe error handling. Use whenever adding a mutation to the admin section or any authenticated endpoint.
---

# Add a server action

Every mutation in this codebase has the same shape. New actions must match it; drift has produced real bugs (leaky error messages, missing validation, missing revalidation).

## The envelope

```typescript
// 1. File header. Always at the top, exactly once per file.
"use server";

// 2. Imports — only what you need. Common stack:
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sanitizeHtml, sanitizeRichText } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

// 3. Define the input schema. Even for single-argument mutations.
const updateThingSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(""),
});

// 4. The action.
export async function updateThing(_: unknown, formData: FormData) {
  // 4a. AUTHORIZE FIRST. Never read input before this.
  await requireRole("admin", "editor");

  // 4b. PARSE. Use safeParse and return a structured error on failure.
  const parsed = updateThingSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;

  // 4c. WORK. Sanitize every string before persisting. Wrap in try/catch
  //     so framework sentinels (redirect, notFound) re-throw, real errors
  //     are logged with context, and the client sees a generic message.
  try {
    await prisma.thing.update({
      where: { id: d.id },
      data: {
        name: sanitizeHtml(d.name),
        description: sanitizeRichText(d.description),
      },
    });
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    logger.error("update-thing", "Failed to update thing", err);
    return { error: "Could not save changes. Try again." };
  }

  // 4d. REVALIDATE every route whose render depends on this data.
  revalidatePath("/");
  revalidatePath("/admin/things");

  // 4e. RETURN a consistent shape. Either { ok: true } or { error, fieldErrors? }.
  //     Never return Prisma rows or raw error objects.
  return { ok: true };
}
```

## Required checks before declaring done

- [ ] `"use server"` at the top of the file (not per-function unless it's inline in a page)
- [ ] `requireRole(...)` is the first awaited call
- [ ] All input goes through Zod
- [ ] Every string written to the DB passes through `sanitizeHtml` or `sanitizeRichText`
- [ ] `revalidatePath` is called for every route that reads this data — including `/` if the data is on the public site
- [ ] Error path logs via `logger.error` and returns a generic message
- [ ] Framework sentinels (`digest` property) are re-thrown, not swallowed
- [ ] Return type is `{ ok: true }` or `{ error, fieldErrors? }` — never void, never the row itself

## Variants

### Single-argument mutations (toggle, delete)

For toggles and deletes, you may take typed arguments instead of `FormData`:

```typescript
export async function toggleThingPublished(id: string, published: boolean) {
  await requireRole("admin", "editor");
  await prisma.thing.update({ where: { id }, data: { published } });
  revalidatePath("/");
  revalidatePath("/admin/things");
}
```

Still requires `requireRole` first. Still requires `revalidatePath`. Inputs are typed at the call site, but if `id` comes from user input upstream, validate it with Zod or treat it as untrusted.

### Reorder

Always run as a single `$transaction` to keep ordering consistent:

```typescript
export async function reorderThings(updates: { id: string; sortOrder: number }[]) {
  await requireRole("admin", "editor");
  await prisma.$transaction(
    updates.map((u) => prisma.thing.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } })),
  );
  revalidatePath("/");
  revalidatePath("/admin/things");
}
```

### API routes (`src/app/api/.../route.ts`)

Same envelope, plus:
- Validate `req.headers.get("content-type")`
- Rate-limit at the boundary (see `src/app/api/booking/route.ts` for the Upstash pattern)
- Return `NextResponse.json({...}, { status })` — never expose stack traces

## Why this matters

- **requireRole first**: skipping the auth check on a single action turns it into a public endpoint.
- **Zod everywhere**: Prisma will gladly accept `null`, `undefined`, or wildly typed values and either crash at runtime or write garbage to the DB.
- **Sanitize**: every string the admin enters ends up rendered somewhere. XSS in your own admin is still XSS.
- **revalidatePath**: forgetting this means edits "didn't save" from the user's perspective (stale cache).
- **Generic error messages**: Supabase and Prisma errors can leak schema, role names, and other internals.
