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

The site deploys cleanly to Vercel:

```bash
npm i -g vercel
vercel
```

Set the env vars in the Vercel dashboard or via `vercel env add RESEND_API_KEY`.

## Tech stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · GSAP + ScrollTrigger · Framer Motion · Three.js / R3F · Theatre.js · Lenis smooth scroll · React Hook Form + Zod · Resend.

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```
