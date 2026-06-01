# Copilot Instructions for Rocky Shore Detailing

## Build & Run

```bash
npm install
cp .env.example .env.local
npm run dev           # Development server (http://localhost:3000)
npm run build         # Production build (includes Prisma codegen)
npm run start         # Serve production build
npm run lint          # ESLint check
npm test              # Run all tests in watch mode
npm run test:run      # Run tests once (CI-friendly)
```

## Database

**Postgres-only.** Use pooled connection strings in production (`-pooler` suffix for Neon, port 6543 for Supabase).

```bash
npm run db:push       # Apply schema changes (generates Prisma client)
npm run db:deploy     # Apply schema changes (production; skips codegen)
npm run db:seed       # Seed services, FAQ, testimonials, process steps, gallery
npm run db:studio     # Open Prisma Studio (browser UI)
```

**Critical:** After modifying `prisma/schema.prisma`, always run `db:push` or `db:deploy` before the app will work.

### Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✓ | — | Postgres connection string. Use pooled in production. |
| `ADMIN_JWT_SECRET` | ✓ | — | Signs admin session cookies. Generate: `openssl rand -base64 48` |
| `ADMIN_PASSWORD_HASH` | ✓ | — | bcrypt hash of admin password. Generate: `node -e "console.log(require('bcryptjs').hashSync('your-password',12))"` |
| `RESEND_API_KEY` | ✓ | — | Email API key from https://resend.com |
| `BOOKING_TO_EMAIL` | — | `fumarajohn8@gmail.com` | Where booking submissions land |
| `BOOKING_FROM_EMAIL` | — | `Rocky Shore Bookings <onboarding@resend.dev>` | Sender email (use verified domain in production) |

## Architecture

### App Structure

**Route groups** (Next.js 13+ App Router):
- `(site)` — Public-facing storefront (home, booking flow)
- `(admin)` — Protected admin dashboard (CMS, bookings management)
- `api` — Edge functions and API routes

### Key Models

**Prisma schema** includes:
- `Service` + `ServiceTier` — Detailing packages and pricing tiers
- `Booking` + `Vehicle` + `Customer` — Booking workflow (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELLED)
- `GalleryImage` — Before/after photos with vehicle associations
- `Testimonial`, `FaqItem`, `ProcessStep` — Content models
- `CustomerMessage` — Booking communication logs
- `Expense` — Business expense tracking

**Relations:** Customers → Vehicles → Bookings & GalleryImages.

### UI Layers

1. **Cinematic site** — Uses GSAP + ScrollTrigger, Framer Motion, Lenis smooth scroll, Three.js/R3F, Theatre.js for animations
2. **Admin CMS** — Manage services, bookings, testimonials, FAQ, gallery, settings
3. **Booking form** — Multi-step React Hook Form + Zod validation, integrated with Resend for email

### Content Management

**Editable via code or admin panel** (`src/data/` files mirror DB):
- `services.ts` — Service cards (add `priceFrom: "$185"` to surface price)
- `process-steps.ts` — 5-step process carousel
- `testimonials.ts` — Marquee quotes
- `faq.ts` — Accordion
- `gallery.ts` — Before/after grid (drop JPGs in `public/gallery/`)

Edit footer contact (phone, email, IG, hours) in `src/components/footer.tsx`.

## Key Conventions

### Component Organization

- **Client vs. Server:** Use `"use client"` only where needed (animations, forms, interactivity). Keep components server-rendered by default for performance.
- **Naming:** Kebab-case files (`testimonials-section.tsx`). Most sections have a `-client` variant for client-side logic.
- **Example:** `gallery-section.tsx` is server (fetches DB), `gallery-section-client.tsx` handles interaction.

### Styling

- **Tailwind v4** with PostCSS integration (configured in `postcss.config.mjs`)
- **Global CSS** in `src/app/globals.css` (contains utility animations, custom properties)
- No CSS modules; use Tailwind classes directly

### Animations & Motion

- **GSAP** for scroll-triggered animations (imported locally, not globally)
- **Framer Motion** for component-level motion
- **Theatre.js** for timeline-based sequences
- **Lenis** for smooth scrolling (initialized in `smooth-scroll.tsx`)
- Components often wrap consumer code with `<MotionProvider>` to enable Framer Motion context

### Form Handling

- **React Hook Form + Zod** for validation
- Booking form is multi-step; each step validates before advancing
- Email submissions via Resend (booking confirmations, admin notifications)

### Image Handling

- Use `next/image` with remote pattern allowlist (Unsplash, Supabase)
- `sharp` is a peer dependency for Next.js image optimization
- Custom `<CmsImage>` component abstracts Supabase CDN URLs

### Testing

- **Vitest** with Node environment (not jsdom by default)
- Setup file: `src/test/setup.ts`
- Test files colocate with source (`src/**/*.test.ts{,x}`)
- `@testing-library/react` included for component testing

## Deployment

Host-agnostic (Vercel, Netlify, or any Node.js runtime):

1. **Provision Postgres** (Neon, Supabase, RDS)
2. **Set env vars** (DATABASE_URL, ADMIN_JWT_SECRET, ADMIN_PASSWORD_HASH, RESEND_API_KEY)
3. **Push schema** (`npm run db:deploy` before first deploy)
4. **Deploy** (`npm run build` is the build command; builds include Prisma codegen)

## Troubleshooting

- **Prisma client stale:** Run `npm run db:generate` or `npm run db:push` to regenerate `@prisma/client`
- **Build fails:** Ensure `ADMIN_JWT_SECRET` and `ADMIN_PASSWORD_HASH` are set (admin area requires them even if unused)
- **Emails not sending:** Check `RESEND_API_KEY` is valid and the from domain is verified in Resend dashboard
- **Image optimization errors:** Ensure `sharp` is installed; some hosting platforms require `npm ci` instead of `npm install`

## Known Constraints

- **Next.js 16 + React 19** — See `AGENTS.md` for React 19 breaking changes (no defaultProps, forwardRef changes, etc.)
- **Turbopack enabled** — Bundler for faster local dev; use webpack in build if Turbopack causes issues (already configured in `next.config.ts`)
- **No Server Components in animations** — GSAP/Framer Motion require client components; extract to separate files if mixing with server-rendered content
