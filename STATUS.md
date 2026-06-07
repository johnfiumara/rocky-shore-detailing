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

### Customer accounts (`src/app/(account)/*`)

- `/signup` — name + email + password; creates Supabase Auth user and pre-creates a `Customer` row (or links to an existing one with that email). Shows "check your inbox" after submit.
- `/login` — email + password sign-in. Blocks staff accounts (`user_role` row) from using the customer side.
- `/auth/callback` — Supabase email-confirmation handler; exchanges `?code=` for a session, then redirects to `/account`.
- `/account` — dashboard: greeting, full booking history with status badges, vehicles list, and the customer iCal feed URL.
- `/account/bookings/[id]` — booking detail with **Cancel** button. Customers can cancel `PENDING` or `CONFIRMED` bookings whose date is today or later. `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, and past-dated bookings show a "can no longer be cancelled" message.
- Sign out.
- Schema link: `Customer.userId` (Supabase `auth.users.id`, unique, nullable). Stored as `String? @db.Uuid` — Prisma can't FK into the `auth` schema.
- Auto-link rules: on `/signup` and on every server-side customer auth check, an unlinked `Customer` row with the matching email is bound to the user id. Mismatched / already-linked emails return null (no data leak).
- Public booking flow (`POST /api/booking`): if the submitter is signed in **and** the form email matches their auth email **and** they are not staff, the `Customer` upsert sets `userId`. Guest bookings continue to work; on later signup with that email the existing bookings get claimed automatically.

### Calendar feeds

- `GET /api/admin/calendar.ics?token=$CALENDAR_FEED_TOKEN` — all non-cancelled bookings as an iCal feed for admin use. 503 when `CALENDAR_FEED_TOKEN` env is unset.
- `GET /api/account/calendar.ics` — authenticated customer's own non-cancelled bookings; 401 when not signed in.
- All-day events (booking dates are date-only). Window / vehicle / status go in the description.

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

### Migration not applied yet

This commit changes the schema (adds `Customer.user_id uuid`). Run `npm run db:deploy` (or `npx prisma db push`) against the prod Supabase project before deploying — until then, `Customer` queries will fail at runtime because Prisma expects the column.

### CMS silent-fallback pattern

If the anon Supabase reads fail (missing RLS policy, bad anon key, rotated keys), the public site silently serves hardcoded data from `src/data/*.ts` and does not error. `npm run verify:public` is the gate — **run it before every deploy** or stale content will appear "working" in prod while edits in `/admin/content` have no public effect.

### Stale `DATABASE_URL` password = admin 500s

Known signature: login succeeds (that goes through Supabase Auth) but every other admin page returns 500. Cause is always a rotated Supabase pooler password not reflected in `DATABASE_URL`. Not a code bug.

### Repo hygiene gaps in current working tree

- `.env.example` is deleted — no documented env contract for new contributors. Required vars (minimum): `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `BOOKING_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_SITE_URL`. Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CALENDAR_FEED_TOKEN` (admin iCal).
- No README at repo root.

### Not implemented anywhere

- **Password reset** for customers (link out to Supabase's hosted recovery flow from `/login` — not wired up)
- **Reschedule** (only cancel — customers cancel and rebook)
- **Profile edit** (name / email / password change from `/account`)
- **Customer email change** + re-confirmation flow
- **Customer notifications** beyond the initial booking confirmation (no "your booking was confirmed", "cancelled by you", "reminder tomorrow")
- **SMS / multi-channel messaging** (the `CustomerMessage` schema supports it; only the admin-side create UI exists). Requires Twilio account.
- **Online payments / deposits** (bookings store a `price`, but no checkout). Requires Stripe account.
- **Admin role granularity** beyond `admin` and `editor`
- **Audit log** of admin actions
