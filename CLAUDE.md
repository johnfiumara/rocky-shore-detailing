# Rocky Shore Detailing — Claude context

Cinematic single-page marketing site (`/`) plus a server-rendered admin CMS (`/admin/*`) for a Maine mobile auto-detailing studio. Bookings, customers, services, FAQ, testimonials, gallery, expenses are all editable through the admin.

## Stack

- **Framework**: Next.js 16 App Router · React 19 · TypeScript (strict)
- **Styling**: Tailwind v4 (PostCSS) · no CSS modules
- **Motion**: GSAP + ScrollTrigger · Framer Motion · Theatre.js · Lenis · Three.js / R3F
- **Data**: Prisma 7 with `@prisma/adapter-pg` against a pooled Supabase Postgres (port 6543, `pgbouncer=true`)
- **Auth**: Supabase Auth + a `user_role` table (`admin` / `editor`). `requireRole()` in `src/lib/auth.ts` guards every admin route and server action.
- **Email**: Resend (booking notifications, admin invites)
- **Sanitization**: `sanitize-html` (NOT `isomorphic-dompurify` — that pulled jsdom and broke production)
- **Testing**: Vitest (`npm run test:run`)
- **Deploy**: Netlify with `@netlify/plugin-nextjs`. Production: `https://rockyshoredetail.netlify.app`. The `rockyshoredetailing.com` references in code don't resolve.

## Project layout

```
src/
  app/
    (site)/              — public marketing site (single page with anchor sections)
    (admin)/admin/       — admin CMS
      _components/       — shared admin UI (StatusBadge, Pagination)
      actions.ts         — server actions (every mutation lives here)
      <section>/page.tsx — one route per CMS section
    api/                 — booking + media routes (no other public APIs)
  lib/
    auth.ts              — requireRole, getCurrentUser
    prisma.ts            — lazy Prisma client (Proxy)
    supabase/            — server/client/admin Supabase wrappers
    sanitize.ts          — sanitizeHtml, sanitizeRichText
    logger.ts            — server/client-aware logger
prisma/schema.prisma     — single source of truth for the DB
scripts/                 — tsx scripts: provision-admin, seed-*, verify-admin-login
```

## Server action conventions

Every mutation in `actions.ts` follows this envelope. New mutations must match it:

1. `"use server"` at the top of the file.
2. `await requireRole("admin")` (or `"admin", "editor"`) before any work.
3. Parse all `FormData`/object input through a Zod schema. **Never** pass raw input to Prisma.
4. Any string saved to the DB is run through `sanitizeHtml` (plain) or `sanitizeRichText` (allowed tags) first.
5. `revalidatePath(...)` for every affected route after the write.
6. On error: `logger.error(context, message, err)` server-side; return a **generic** message to the client (never `error.message` from Supabase/Prisma).

See `.claude/skills/add-server-action/SKILL.md` for a template.

## Required env vars

| Var | Notes |
|---|---|
| `DATABASE_URL` | Pooled Supabase URL (port 6543, `pgbouncer=true&connection_limit=1`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key. RLS gates access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Used for admin invite + storage signing. |
| `RESEND_API_KEY` | Booking emails. |
| `NEXT_PUBLIC_SITE_URL` | Base URL embedded in admin invite emails. Must match the deployed host. |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | 32-byte base64. Keeps Server Action IDs stable across deploys. |

Optional: `BOOKING_TO_EMAIL`, `BOOKING_FROM_EMAIL`.

## Common ops

```bash
npm run dev                 # Next dev server
npm run test:run            # Vitest once
npm run lint                # ESLint
npm run db:push             # Apply schema changes locally
npm run db:deploy           # Apply schema changes in prod (no codegen)
npm run db:seed             # Seed CMS content
npm run provision:admin     # Create the first admin via Supabase admin SDK
```

## Things that have bitten this codebase

- **Real secrets in `.env.example`** — there's a PreToolUse hook now that blocks `.env*` edits (except `.env.example`).
- **`isomorphic-dompurify` → jsdom → @exodus/bytes (ESM)** crashed every admin route on Node 24 in the Netlify Lambda. Replaced with `sanitize-html`. Don't re-introduce jsdom server-side.
- **Hardcoded "Welcome back, Aiden" and TEMPORARY DEBUG stack-trace dumps** shipped to prod. The current `admin/error.tsx` only exposes the digest; full errors live in Netlify function logs.
- **Server Action IDs invalidating across deploys.** `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is now set — don't rotate it casually.
