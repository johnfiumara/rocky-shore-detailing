# Restore Supabase-Backed Booking Pipeline

**Branch:** `eersd`
**Date:** 2026-06-20
**Author:** John Fiumara (with Claude)

## Goal

Revert the static-HTML conversion (`eafa25a`) so booking submissions persist to Supabase and trigger a Resend notification email — but keep the rest of the homepage static, and do **not** restore the admin dashboard, customer account portal, or Supabase Auth.

## Why

Commit `eafa25a` stripped all dynamic infrastructure and rewired the booking form to Web3Forms. We want bookings back in our own database (queryable via Supabase Studio), with a real email notification, while keeping the lean shape that came out of the static conversion.

## Scope

**In scope (restored, possibly simplified):**

- Next.js dynamic SSR (drop `output: "export"`, restore image config + security headers)
- `vercel.ts` build command runs `prisma generate`
- Prisma client + one `Booking` table
- Supabase service-role client for storage uploads (no auth client)
- Booking photo uploads to the existing private `booking-photos` bucket
- Resend notification email on successful booking
- `POST /api/booking` route that validates, persists, uploads photos, sends email
- `BookingSectionClient` posts FormData to `/api/booking` (drop Web3Forms path)

**Out of scope (explicitly NOT restored):**

- Admin dashboard (`src/app/(admin)/`)
- Customer account portal (`src/app/(account)/`, login, signup, auth callback)
- Supabase Auth, user-role table, session middleware (`src/proxy.ts`)
- Admin / account / media API routes
- CMS-managed content (services, gallery, FAQ, etc. stay in `src/data/*` files)
- Rate limiting via Upstash (skip; reintroduce later if abuse appears)
- Customer / Vehicle / Expense / Message / Service / etc. Prisma models
- Old Supabase migrations 0001–0005 (admin/user/media/messages tables)
- Provisioning + seeding scripts in `scripts/`

## Architecture

```
[Browser]
  BookingSectionClient ──FormData (fields + photos)──> POST /api/booking
                                                            │
                                                            ▼
                                                      Validate (zod)
                                                            │
                                                            ▼
                                                  prisma.booking.create(...)
                                                            │
                                                            ├──> storeBookingPhotos(id, files)
                                                            │       └─ Supabase Storage (booking-photos)
                                                            │       └─ prisma.booking.update({ photoKeys })
                                                            │
                                                            └──> sendBookingEmail({ data, files })
                                                                    └─ Resend
```

Single API route, single transaction shape: DB write first, then storage + email. If email fails, the booking is still saved (logged). If storage fails, the booking is saved without photos (logged).

## Data Model

One Prisma model. Customer / vehicle fields are denormalized — no separate tables, no upserts, no relations. Each submission is a fresh row.

```prisma
model Booking {
  id          String        @id @default(cuid())

  // Customer fields (denormalized)
  name        String
  email       String
  phone       String
  address     String
  city        String
  zip         String

  // Vehicle fields (denormalized)
  year        Int
  make        String
  model       String
  color       String

  // Service + scheduling
  serviceSlug String        @map("service_slug")
  date        DateTime      @db.Date
  timeWindow  String        @map("time_window")
  notes       String?

  // Photos (Supabase Storage keys: `<bookingId>/<index>.<ext>`)
  photoKeys   String[]      @default([]) @map("photo_keys")

  status      BookingStatus @default(PENDING)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt      @map("updated_at")

  @@index([createdAt])
  @@index([email])
  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## Components

### Restored (slimmed)

- `src/lib/prisma.ts` — unchanged (still uses the `POSTGRES_PRISMA_URL` / `POSTGRES_URL` fallback added in `a0aceb0`)
- `src/lib/supabase/admin.ts` — service-role client for storage uploads
- `src/lib/booking-photos.ts` — `storeBookingPhotos`, `getBookingPhoto`, `contentTypeForKey`
- `src/lib/send-booking-email.ts` — Resend email
- `src/app/api/booking/route.ts` — see "Booking Route" below
- `src/components/booking/booking-section-client.tsx` — POST to `/api/booking`
- `src/components/booking/steps/{photos-step,vehicle-step}.tsx` — restored, stripped of signed-in-customer branches
- `next.config.ts` — restored headers / images / remotePatterns; drop `output: "export"`
- `vercel.ts` — `buildCommand: "prisma generate && next build"`

### Dropped (re-deleted after revert)

- `src/app/(admin)/`, `src/app/(account)/`
- `src/app/api/admin/`, `src/app/api/account/`, `src/app/api/media/`
- `src/lib/{auth,ical,logger,sanitize}.ts`, `src/lib/media/`, `src/lib/cms/{published-list,settings}.ts`
- `src/lib/supabase/{client,server}.ts` (only `admin.ts` is kept)
- `src/proxy.ts`
- `src/components/cms-image.tsx`
- `src/components/booking/{booking-section-server,vehicle-select,types}.tsx`
- `src/components/ui/badge.tsx`
- `prisma/migrations/*` (replaced by a single fresh `0001_init` matching the slim schema)
- `supabase/migrations/0001_user_role.sql` … `0005_media_asset_columns.sql`
- `supabase/migrations/0006_booking_photos_bucket.sql` — **KEPT**
- `scripts/{provision-admin,reset-admins,list-admins,verify-admin-login,verify-public-reads,seed-*,probe-*,cleanup-probe,apply-migration}.ts`
- All admin / account / proxy / cms / sanitize / auth tests

### Package.json

Add back: `@prisma/client`, `prisma`, `@supabase/supabase-js`, `resend`, `pg`, `sharp`
Stay dropped: `@supabase/ssr`, `@upstash/*`, `@netlify/blobs`, `sanitize-html`, `@types/sanitize-html`, `@types/pg` (only if not needed)

## Booking Route

Simplified from the original (`a0aceb0:src/app/api/booking/route.ts` was ~210 lines, this is ~80):

```ts
// src/app/api/booking/route.ts (sketch)
import { NextResponse } from "next/server";
import { bookingSchema, validateFiles } from "@/lib/booking-schema";
import { prisma } from "@/lib/prisma";
import { storeBookingPhotos } from "@/lib/booking-photos";
import { sendBookingEmail } from "@/lib/send-booking-email";

export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const raw = Object.fromEntries(
    Array.from(form.entries()).filter(([, v]) => typeof v === "string"),
  );
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const files = form.getAll("photos")
    .filter((v): v is File => v instanceof File && v.size > 0);
  const fileCheck = validateFiles(files);
  if (!fileCheck.ok) {
    return NextResponse.json(
      { error: "validation", fieldErrors: { photos: [fileCheck.message] } },
      { status: 400 },
    );
  }

  const d = parsed.data;
  let booking: { id: string };
  try {
    booking = await prisma.booking.create({
      data: {
        name: d.name, email: d.email, phone: d.phone,
        address: d.address, city: d.city, zip: d.zip,
        year: d.year, make: d.make, model: d.model, color: d.color,
        serviceSlug: d.service,
        date: new Date(d.date),
        timeWindow: d.timeWindow,
        notes: d.notes,
      },
    });
  } catch (err) {
    console.error("[booking] db write failed", err);
    return NextResponse.json(
      { success: false, error: "Booking could not be saved. Please try again." },
      { status: 500 },
    );
  }

  try {
    const keys = await storeBookingPhotos(booking.id, files);
    if (keys.length > 0) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { photoKeys: keys },
      });
    }
  } catch (err) {
    console.error("[booking] photo upload failed", { bookingId: booking.id, err });
    // continue — booking is saved
  }

  try {
    await sendBookingEmail({ data: d, files });
  } catch (err) {
    console.error("[booking] email send failed", { bookingId: booking.id, err });
    // continue — booking is saved
  }

  return NextResponse.json({ ok: true });
}
```

## Client

- `BookingSectionClient` posts FormData to `/api/booking`
- Drop `WEB3FORMS_KEY`, `WEB3FORMS_ENDPOINT`
- Drop `customer` / `isSignedIn` / `rebook` props throughout the wizard (no auth)
- `PhotosStep` and `VehicleStep` always show manual inputs (already the case in `eafa25a` shape; just re-add file upload via `<PhotoUpload>`)

## Environment Variables

**Required runtime envs (set in `.env.local` + Vercel Production/Preview):**

| Var | Source | Notes |
|---|---|---|
| `POSTGRES_PRISMA_URL` | Supabase | already set |
| `POSTGRES_URL` | Supabase | already set, fallback for Prisma |
| `SUPABASE_URL` | Supabase | already set, used by storage client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | already set, used by storage client |
| `RESEND_API_KEY` | **NEW** — resend.com | required for booking email |
| `BOOKING_TO_EMAIL` | **NEW** — your inbox | optional; defaults to `fumarajohn8@gmail.com` |
| `BOOKING_FROM_EMAIL` | **NEW** | optional; defaults to `Rocky Coast Bookings <onboarding@resend.dev>` |

The existing `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY` are no longer needed by the app (no client-side Supabase, no auth). Safe to leave or remove from `.env.local`.

Drop the leading duplicate lines (1–3) from `.env.local`; they're shadowed by lines 11/13/16.

## Database Changes (in Supabase)

1. **Drop existing admin-era tables** with a new SQL migration `supabase/migrations/0007_drop_admin_tables.sql`:

   ```sql
   drop table if exists public.customer_message cascade;
   drop table if exists public.expense cascade;
   drop table if exists public.media_asset cascade;
   drop table if exists public.settings cascade;
   drop table if exists public.user_role cascade;
   drop table if exists public."FaqItem" cascade;
   drop table if exists public."ProcessStep" cascade;
   drop table if exists public."Testimonial" cascade;
   drop table if exists public."Service" cascade;
   drop table if exists public."ServiceTier" cascade;
   drop table if exists public."GalleryImage" cascade;
   drop table if exists public."Booking" cascade;
   drop table if exists public."Vehicle" cascade;
   drop table if exists public."Customer" cascade;
   drop type if exists public."BookingStatus";
   ```

2. **Apply the new Prisma migration** `prisma/migrations/<timestamp>_init/migration.sql` (generated from the slimmed schema; creates `bookings` table + `BookingStatus` enum).

3. **Keep** the `booking-photos` Storage bucket and its policies (set up by `supabase/migrations/0006_booking_photos_bucket.sql`).

No real bookings to preserve (confirmed by user).

## Testing

Minimum acceptance:

1. `npm run typecheck` — clean
2. `npm run lint` — clean
3. `npm run test:run` — booking-related tests pass (others can be deleted alongside their sources)
4. Local: `npm run dev`, submit the form, see a `Booking` row in Supabase Studio with `photo_keys` populated, receive the email
5. Vercel preview: same end-to-end check

Out of scope for this restore: re-adding the full API integration test (`src/__tests__/api/booking.integration.test.ts` is 528 lines and tied to the old Customer/Vehicle model — would need a rewrite).

## Risks / Open Questions

- **Photo upload size on Vercel:** Vercel's request body limit is ~4.5 MB for serverless functions; the file validator should reject anything that would exceed this. The original `validateFiles` (in `src/lib/booking-schema.ts`) caps per-file at 10 MB which is too permissive for a single POST — may need tightening.
- **Resend free tier:** `onboarding@resend.dev` is fine for testing, but production should use a verified domain. Out of scope for this PR but flag for a follow-up.
- **Vercel Functions / Fluid Compute:** the slimmed booking route runs as a Node.js function with the default 300 s timeout. No changes required.

## Commit Plan

Single commit on `eersd`:

```
feat(booking): restore Supabase + Resend pipeline (admin/account stay dropped)

Revert eafa25a (static-HTML conversion) and slim:
- Restore Prisma + one `Booking` table (denormalized customer/vehicle fields)
- Restore /api/booking route, simplified (no rate limit, no upserts, no auth)
- Restore Supabase Storage upload for booking photos
- Restore Resend notification email
- Restore dynamic SSR (drop `output: "export"`, headers, image config)
- Re-delete admin dashboard, account portal, auth, middleware proxy,
  admin/account/media API routes, scripts/, sanitize, ical, logger
- Replace prisma/migrations with a single fresh init for the slim schema
- Drop supabase/migrations 0001-0005; add 0007 to drop old admin tables
- Client posts FormData to /api/booking (drop Web3Forms path)
```

Follow-up (separate session, not blocking): rewrite the API integration test.
