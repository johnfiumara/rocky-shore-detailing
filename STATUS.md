# Rocky Shore Detailing — Feature Status

Snapshot of what's wired up vs. what isn't. Update when behavior changes.

## Stack

- Next.js 16 App Router (React 19, webpack build)
- Prisma 7 + Postgres (Supabase)
- Supabase Auth (admin only) + Supabase Storage (media bucket)
- Resend (transactional email)
- Upstash Redis (rate limiting, optional)
- Netlify deploy target
- Vitest for tests

## Working

### Public site (`src/app/(site)/page.tsx`)

Single page composed of anchor sections; all dynamic sections are CMS-driven through `src/lib/cms/*`.

- Hero (`src/components/hero/`)
- Story (`src/components/story-section.tsx`)
- Services — pulled from `Service` + `ServiceTier` tables
- Process — pulled from `ProcessStep` table
- Gallery with before/after pairs — pulled from `GalleryImage` table
- Testimonials — pulled from `Testimonial` table
- FAQ — pulled from `FaqItem` table
- Booking section — multi-step form, see below

### Booking flow (`src/app/api/booking/route.ts`, `src/components/booking-*`)

- Multi-step form: vehicle → when → photos+contact
- Zod schema validation (`src/lib/booking-schema.ts`)
- File upload validation (size/type)
- IP rate limit: 5 / hour (Upstash if `UPSTASH_REDIS_REST_URL` is set, otherwise in-process memory)
- Customer + Vehicle upsert, Booking insert (Prisma)
- Booking confirmation email via Resend (`src/lib/send-booking-email.ts`)
- Success screen (`src/components/booking-success.tsx`)

### Admin panel (`src/app/(admin)/admin/*`)

Auth: Supabase email/password, `user_role` table (`admin` | `editor`). `requireRole` guards every page and action.

- Login / logout / change password
- Dashboard (`/admin`)
- **Bookings**: list with pagination, detail page, manual booking creation, status updates, price edit, admin-notes edit
- **Schedule**: month-grid calendar of non-cancelled bookings
- **Customers**: list, detail with vehicles + booking history + message thread (create/delete messages)
- **Budget**: revenue (completed bookings) vs. expenses, by-category breakdown, period totals
- **Expenses**: create / delete
- **Content** (`/admin/content`): CRUD + reorder + publish toggle for Services (incl. tier prices), Testimonials, FAQ, Process Steps
- **Gallery**: create / update / publish toggle / reorder gallery images, with `Vehicle` linkage and before/after flags
- **Media library**: Supabase Storage signed-URL upload flow, list view (`/admin/media`)
- **Users**: invite by email (admin/editor), revoke role; backed by Supabase Auth Admin API
- **Settings**: change own password

### Server actions envelope (`src/app/(admin)/admin/actions.ts`)

All ~30 mutations follow: `"use server"` → `requireRole` → Zod parse → sanitize where applicable → Prisma write → `revalidatePath`. Errors logged server-side via `src/lib/logger.ts`, generic message returned to client.

### Tooling

- `npm run db:push` / `db:deploy` — Prisma schema push
- `npm run db:seed` — full seed (services, testimonials, FAQ, process, gallery, settings)
- `npm run provision:admin` — create an admin user
- `npm run verify:public` — checks that the anon Supabase key can read every public CMS table (catches RLS misconfig before deploy)
- `npm run test` / `test:run` — Vitest (`src/lib/__tests__/`: auth, cms, cms-gallery, sanity)

## Not working / not built / known issues

### Customer accounts — not built

The deleted design spec described a customer-facing auth flow (signup, login, "my bookings"). **None of it ships.** No customer login page, no customer dashboard, no public auth UI. Bookings are guest-only and identified by email at submit time.

### CMS silent-fallback pattern

If the anon Supabase reads fail (missing RLS policy, bad anon key, rotated keys), the public site silently serves hardcoded data from `src/data/*.ts` and does not error. `npm run verify:public` is the gate — **run it before every deploy** or stale content will appear "working" in prod while edits in `/admin/content` have no public effect.

### Stale `DATABASE_URL` password = admin 500s

Known signature: login succeeds (that goes through Supabase Auth) but every other admin page returns 500. Cause is always a rotated Supabase pooler password not reflected in `DATABASE_URL`. Not a code bug.

### Repo hygiene gaps in current working tree

- `.env.example` is deleted — no documented env contract for new contributors. Required vars (minimum): `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `BOOKING_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_SITE_URL`. Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- No README at repo root.

### Not implemented anywhere

- Public-facing customer booking management (cancel / reschedule)
- Customer notifications beyond initial booking confirmation
- SMS / multi-channel messaging (the `CustomerMessage` schema supports it; only the admin-side create UI exists)
- Online payments / deposits (bookings store a `price`, but no checkout)
- Calendar export / iCal
- Admin role granularity beyond `admin` and `editor`
- Audit log of admin actions
