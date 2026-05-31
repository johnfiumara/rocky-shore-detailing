# Rocky Shore Detailing

Cinematic single-page site for **Rocky Shore Detailing** — a Maine-statewide mobile auto-detailing studio run by Aiden Quinn.

## Quick start

```bash
npm install
cp .env.example .env.local
# edit .env.local — at minimum set RESEND_API_KEY
npm run dev
```

Site runs at `http://localhost:3000`.

## Environment variables

| Var | Required? | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | — | Postgres connection string. Use a *pooled* URL in production (Neon `-pooler`, Supabase port 6543). |
| `ADMIN_JWT_SECRET` | yes | — | Signs the admin session cookie. Generate: `openssl rand -base64 48`. App refuses to boot the admin area without it. |
| `ADMIN_PASSWORD_HASH` | yes | — | bcrypt hash of the admin login password. Generate: `node -e "console.log(require('bcryptjs').hashSync('your-password',12))"`. |
| `RESEND_API_KEY` | yes | — | Get one free at https://resend.com (3,000 emails/mo). Without this, booking submissions return 502. |
| `BOOKING_TO_EMAIL` | no | `fumarajohn8@gmail.com` | Where bookings land. |
| `BOOKING_FROM_EMAIL` | no | `Rocky Shore Bookings <onboarding@resend.dev>` | Resend's testing sender until you verify a custom domain at https://resend.com/domains. |

## Editing content (no code knowledge needed)

All editable text + images live in `src/data/`:

- `services.ts` — the 5 service cards. Add `priceFrom: "$185"` to any card to surface a price; omit to show "Request a quote".
- `process-steps.ts` — the 5 process steps shown in the pinned horizontal scroll.
- `testimonials.ts` — quote cards in the marquee.
- `faq.ts` — accordion questions.
- `gallery.ts` — before/after image URLs and the 6-tile grid. Drop your own JPGs in `public/gallery/` and reference like `src: "/gallery/my-photo.jpg"`.

To change phone, email, IG, hours: edit `src/components/footer.tsx`.

## Deploying

The site is host-neutral — it ships with a `netlify.toml` and works the same on Vercel, Netlify, or any host that runs Next.js 16 with a Node.js runtime. Pick one and configure it there.

**1. Provision a Postgres database** (Neon, Supabase, RDS, or self-hosted). Grab a *pooled* connection string for production.

**2. Set the required env vars** in your host's dashboard:

- `DATABASE_URL`
- `ADMIN_JWT_SECRET` — generate with `openssl rand -base64 48`
- `ADMIN_PASSWORD_HASH` — generate with `node -e "console.log(require('bcryptjs').hashSync('your-password',12))"`
- `RESEND_API_KEY`

See the table above for optional vars.

**3. Push the schema to the new database** (the build step does *not* do this automatically):

```bash
DATABASE_URL=postgresql://... npm run db:deploy
DATABASE_URL=postgresql://... npm run db: seed   # optional: seeds services, FAQ, testimonials
```

Re-run `db:deploy` whenever `prisma/schema.prisma` changes.

**4. Deploy** via your host's normal flow (`vercel`, `netlify deploy`, git push, etc.). The build command is `npm run build`, which runs `prisma generate` and `next build`.

## Tech stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · GSAP + ScrollTrigger · Framer Motion · Three.js / R3F · Theatre.js · Lenis smooth scroll · React Hook Form + Zod · Resend.

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```
