# Rocky Shore Detailing — Site Design

**Date**: 2026-05-26
**Status**: Approved (pending spec review)
**Owner**: Aiden Quinn (business), fumarajohn8@gmail.com (booking inbox)

## 1. Goals

Build a cinematic, scroll-driven single-page marketing site for Rocky Shore Detailing — a Maine-statewide mobile auto detailing business run by Aiden Quinn. The site must:

- Convert visitors into booking requests via a multi-step form that emails Aiden directly.
- Feel premium and hand-crafted, not template-y. Cinematic scroll choreography (GSAP + Theatre.js + Three.js + Framer Motion) is core to brand impression.
- Stay accessible (AA contrast, keyboard-navigable, reduced-motion friendly) and performant on mobile (Maine clients will browse on phones).
- Allow Aiden (a non-developer) to swap service names, descriptions, gallery images, FAQ, and testimonials by editing well-organized files in `src/data/`.

## 2. Non-Goals (explicit YAGNI)

- CMS, headless or otherwise — content lives in `src/data/*.ts`.
- Auth, payments, admin dashboard — Aiden reads bookings in his Gmail.
- i18n.
- S3/Blob photo storage — booking photos ride along on the email as attachments (5 × 5MB max = well under Resend's 40MB combined attachment limit).
- Analytics — easy to bolt on with a `<Script>` later if desired.
- A blog.
- Automated tests — this is a static-ish marketing site. Verification is `next build`, Lighthouse, and a manual smoke walk-through.

## 3. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router + TypeScript | Already scaffolded; matches user's stated preference. |
| Styling | Tailwind CSS v4 | Theme tokens via `@theme inline` already wired. |
| Scroll choreography | GSAP + ScrollTrigger | Industry standard for pinned/scrubbed animations. |
| Component animation | Framer Motion | Best for in-view reveals and form-step transitions. |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` | R3F is the canonical React-Three integration. |
| Sequenced timeline | Theatre.js (`@theatre/core`) | Drives the 6-second hero intro. Studio (`@theatre/studio`) is dev-only. |
| Smooth scroll | Lenis | Required for buttery GSAP scrubbing. |
| Form state | React Hook Form + Zod (`@hookform/resolvers`) | Best practice for multi-step forms with validation. |
| Email | Resend SDK | Vercel-native, generous free tier, supports attachments via `Buffer`. |
| Icons | `lucide-react` | Already installed. |
| Fonts | next/font Google subset: **Fraunces** (display variable serif), **Instrument Sans** (body), **JetBrains Mono** (accents) | Distinct, characterful, not the default Inter/Geist. |

## 4. Aesthetic — "Coastal Luxury"

Maine coast meets automotive precision. Already encoded in `src/app/globals.css`.

| Token | Hex | Use |
|---|---|---|
| `--rs-ink` | `#0a0b0d` | Background |
| `--rs-charcoal` | `#13151a` | Card surface |
| `--rs-stone` | `#1c1f26` | Elevated surface |
| `--rs-bone` | `#f4efe6` | Primary text |
| `--rs-bone-dim` | `#c9c3b6` | Secondary text |
| `--rs-mist` | `#8a8578` | Tertiary / muted |
| `--rs-bronze` | `#c9a36b` | Primary accent — eyebrows, dividers, links |
| `--rs-bronze-glow` | `#e9c894` | Hover state, italic emphasis |
| `--rs-tide` | `#3c7a89` | Secondary accent — ocean teal |
| `--rs-ember` | `#e07a4b` | Rare highlight — status dots |

Atmospheric overlays: fixed-position SVG-noise grain (6% opacity, overlay blend) + radial vignette. Both `pointer-events: none`. Custom magnetic cursor on pointer:fine devices only.

Contrast (AA verified): bone on ink 16.3:1 · bronze on ink 7.2:1 · bone-dim on ink 11.4:1.

## 5. Page Structure (single-page scroll)

| # | Section | Purpose | Key animation |
|---|---|---|---|
| 1 | Hero | Brand impression + book CTA | Theatre.js 6s intro + R3F particle scene + GSAP char-by-char headline reveal |
| 2 | Story | Aiden's bio + Maine roots | Bronze underline draws on scroll-in; image parallax |
| 3 | Services | 5 service cards + "Request a quote" CTA pre-fills booking | Framer Motion 3D tilt + bronze glow on hover |
| 4 | Process | 5-step "how it goes" | GSAP ScrollTrigger pinned horizontal scroll with progress bar |
| 5 | Gallery | Before/after slider + 6-tile grid | Draggable comparison; grid hover lift |
| 6 | Testimonials | Social proof | Two-row CSS marquee, opposite directions, pause on hover |
| 7 | Booking | Capture booking → email Aiden | 3-step wizard, Framer Motion step transitions |
| 8 | FAQ | Surface common questions | Accordion with Framer Motion height animation |
| 9 | Footer | Contact + service area + hours | Static |

### 5.1 Hero copy

- Eyebrow: `MOBILE AUTO DETAILING · STATEWIDE MAINE`
- Headline: `Glass-deep finish, *by hand.*` (italic on "by hand" → bronze-glow)
- Sub: `Aiden Quinn brings the studio to your driveway — paint correction, ceramic coatings, and full restorations across Maine.`
- Primary CTA: `Book a Detail` → scrolls to `#book`
- Secondary CTA: `See the work` → scrolls to `#gallery`

### 5.2 Story section copy

- Eyebrow: `THE STUDIO`
- Headline: `An Aiden Quinn studio, *on wheels.*`
- Body (2 paragraphs, placeholder Aiden can edit):
  - Paragraph 1: who Aiden is, why mobile, what makes his work different.
  - Paragraph 2: Maine roots, statewide reach, no shop overhead.

### 5.3 Services (placeholder content, edit in `src/data/services.ts`)

5 cards. No prices — each has `"Request a quote"` CTA. Service slugs (used for hash-prefill of the booking form):

| Slug | Display name |
|---|---|
| `express-wash` | Express Wash |
| `full-detail` | Full Detail |
| `paint-correction` | Paint Correction |
| `ceramic-coating` | Ceramic Coating |
| `interior-restoration` | Interior Restoration |

Each service object has this exact shape (defined in `src/data/services.ts`):

```ts
type Service = {
  slug: string;            // url hash, e.g. "paint-correction"
  eyebrow: string;         // small label above title
  title: string;           // display name
  tagline: string;         // 1-line value prop
  inclusions: string[];    // 3-5 bullet points of what's included
  priceFrom?: string;      // optional — renders "From $XYZ" if present, otherwise hidden
};
```

The card CTA is **"Request a quote"** and scrolls to `#book?service=<slug>`, which pre-selects that service in step 1 of the wizard.

### 5.4 Process steps (placeholder, edit in `src/data/process-steps.ts`)

1. **Arrive at your driveway** — Mobile setup, no shop drop-off needed.
2. **Inspect & document** — Walk-around with photos so we're aligned on goals.
3. **Wash & decontaminate** — Foam, hand-wash, iron-x, clay if needed.
4. **Polish & protect** — Correction passes, finishing polish, sealant or coating.
5. **Final reveal** — Side-by-side photos, care instructions, you drive off shining.

### 5.5 FAQ topics (placeholder, edit in `src/data/faq.ts`)

1. Where do you travel? (statewide; travel fee beyond X miles)
2. What if it rains?
3. How long does a typical detail take?
4. Do you offer ceramic coating warranties?
5. How do I pay?
6. Do you sell gift cards?

## 6. Booking Flow

### 6.1 Form structure — 3-step wizard

**Step 1 — Vehicle & Service**
- Service (radio cards, one of the 5 slugs, defaults to value of `#book?service=<slug>` hash)
- Vehicle Year (number, 1900–2030)
- Vehicle Make (text, required)
- Vehicle Model (text, required)
- Color (text, required)

**Step 2 — When & Where**
- Address (text, required, ≥ 5 chars)
- City (text, required)
- ZIP (text, US 5-digit, required)
- Preferred date (date input, future-only — `min` set to today + 1)
- Time window (radio, one of: `Morning (8–11am)` / `Afternoon (11am–3pm)` / `Evening (3–6pm)`)

**Step 3 — Photos & Contact**
- Photos (file input, up to 5, `image/*`, ≤ 5MB each, drag-drop, previews, individual remove)
- Name (text, required)
- Email (email, required)
- Phone (text, required, US format flexible)
- Notes (textarea, optional, max 1000 chars)

### 6.2 Submission data flow

```
client wizard
  └─ FormData (text fields + 0-5 files)
       └─ POST /api/booking
            ├─ parse FormData
            ├─ validate text fields against Zod schema    → 400 { errors: ZodFlattenedError } on fail
            ├─ validate files: count ≤ 5, ≤ 5MB ea, mime  → 400 { errors: { files: [...] } } on fail
            ├─ sendBookingEmail({ data, files })
            │     - subject:  "New booking — {service} · {name} · {date}"
            │     - to:       BOOKING_TO_EMAIL  (default: fumarajohn8@gmail.com)
            │     - from:     BOOKING_FROM_EMAIL (default: "Rocky Shore Bookings <onboarding@resend.dev>")
            │     - replyTo:  customer email
            │     - html:     templated summary table
            │     - attachments: [{ filename, content: base64 }]
            │     → on resend error, log + throw
            └─ return 200 { ok: true } | 502 { error: "send-failed" }
client
  └─ success state (full-screen reveal) | inline field errors | fallback toast w/ mailto:
```

### 6.3 Email template

Plain-but-clean HTML, dark-mode-friendly, table-laid-out for Gmail compatibility:

- Header with "New Booking Request" + business wordmark
- Two-column table of all fields (Service / Date / Time / Vehicle / Address / Customer / Notes)
- Attachments list ("5 photos attached")
- Footer hint: "Reply directly to this email to respond to {customer name}."

## 7. Architecture — file structure (1 file 1 job)

```
src/
  app/
    layout.tsx                # ✓ DONE — fonts, providers, grain/vignette, nav, footer
    page.tsx                  # composes sections, no logic
    globals.css               # ✓ DONE — Coastal Luxury tokens, motion utilities
    api/booking/route.ts      # POST handler

  components/
    smooth-scroll.tsx         # Lenis provider — wraps children, drives scroll
    cursor.tsx                # Magnetic custom cursor (pointer:fine only)
    navigation.tsx            # Sticky nav, scroll-aware hide/show, mobile drawer
    footer.tsx
    reveal.tsx                # Reusable scroll-reveal wrapper (Framer Motion in-view)
    marquee.tsx               # Generic infinite marquee primitive

    hero/
      hero.tsx                # Section orchestration: layout, copy, CTAs
      hero-canvas.tsx         # R3F <Canvas> + scene root + Suspense fallback
      chrome-particles.tsx    # Drifting metallic particles (instanced mesh)
      hero-timeline.ts        # Theatre.js sheet config + project setup

    story-section.tsx
    services-section.tsx
    service-card.tsx          # Single card; receives Service object as prop
    process-section.tsx       # GSAP pinned horizontal scroll
    gallery-section.tsx
    before-after.tsx          # Draggable before/after comparison slider
    testimonials-section.tsx
    booking-section.tsx       # Wizard orchestrator: manages step state, FormProvider
    booking-step-vehicle.tsx  # Step 1 fields
    booking-step-when.tsx     # Step 2 fields
    booking-step-photos.tsx   # Step 3 fields + photo dropzone
    booking-progress.tsx      # Top progress indicator (steps 1/2/3)
    booking-success.tsx       # Post-submit success state
    faq-section.tsx
    faq-item.tsx

  lib/
    booking-schema.ts         # Zod schema + inferred type + file validators
    send-booking-email.ts     # Resend client + HTML email composer

  data/
    services.ts               # Edit: 5 service objects
    process-steps.ts          # Edit: 5 process step objects
    testimonials.ts           # Edit: 6 testimonial objects
    faq.ts                    # Edit: 6 Q/A objects
    gallery.ts                # Edit: image refs (Unsplash placeholders initially)
```

## 8. Accessibility & Motion

- Semantic landmarks: `<nav>`, `<main>`, `<section aria-labelledby="…">`, `<footer>`.
- All non-decorative imagery has `alt` text.
- All interactive elements are keyboard-reachable; focus-visible ring is bronze (`--rs-bronze-glow`), 2px, 3px offset.
- Form: every field has a `<label>`; errors are announced via `aria-describedby` and `role="alert"`; wizard step has `aria-current="step"`.
- `prefers-reduced-motion: reduce` is honored:
  - `globals.css` already nukes `animation-duration` and `transition-duration` to 1ms.
  - GSAP timeline `paused` if reduced-motion detected; final state applied immediately.
  - Framer Motion respects it natively when `<MotionConfig reducedMotion="user">` wraps the tree (set in `layout.tsx`).
  - Theatre.js sequence is jumped to its last keyframe rather than animated.
- Custom cursor is gated on both `pointer:fine` AND `prefers-reduced-motion: no-preference`; native cursor returns otherwise.
- 3D scene wrapped in `<Suspense fallback={static-gradient}>`. R3F bails to fallback if WebGL unavailable.

## 9. Error Handling

| Failure | Behavior |
|---|---|
| Form field invalid (client) | Inline error under field, focus first invalid field. |
| Form field invalid (server-side re-validation) | Step rewinds to first invalid field; inline errors set. |
| File too large / too many / wrong mime | Inline error in step 3 dropzone; offending file shown highlighted. |
| Resend API failure (network or 5xx) | 502 returned; client shows toast `"Couldn't send right now — please call/text {phone} or email {email}."` with a `mailto:` link populated with the user's typed data. |
| WebGL unavailable | R3F bails to static radial-gradient hero background. Site fully functional. |
| Theatre.js fails to load | Hero falls back to GSAP-only intro; particles still render. |
| Missing `RESEND_API_KEY` env var | At build time route handler logs warn; at request time returns 502. Surfaced in `.env.example` clearly. |

## 10. Environment Variables

```
RESEND_API_KEY        # required — from resend.com dashboard
BOOKING_TO_EMAIL      # default: fumarajohn8@gmail.com
BOOKING_FROM_EMAIL    # default: "Rocky Shore Bookings <onboarding@resend.dev>"
```

A `.env.example` will be committed with placeholder values and a comment block explaining how to get a Resend key.

## 11. Verification (in lieu of tests)

For a single-page marketing site, formal test suites are YAGNI. The acceptance checklist:

- [ ] `npm run build` passes (no type errors, no build errors).
- [ ] `npm run lint` passes.
- [ ] Dev server loads `/` with no console errors.
- [ ] Each section appears, scroll-triggers fire, animations play smoothly at 60fps on a recent laptop.
- [ ] Lighthouse: Performance ≥ 80, Accessibility = 100, Best Practices = 100, SEO ≥ 95.
- [ ] Keyboard-only walk through every section, including the booking wizard, succeeds.
- [ ] OS `prefers-reduced-motion: reduce` → no animation plays; all content reachable.
- [ ] Submit the booking form with `RESEND_API_KEY` set → email arrives at `fumarajohn8@gmail.com` with all fields + photo attachments.
- [ ] Submit the booking form WITHOUT `RESEND_API_KEY` → graceful 502 + fallback toast.
- [ ] Mobile viewport (375px) renders all sections; the pinned-horizontal Process section degrades to vertical stack.

## 12. Deferred decisions

These are intentionally pushed to "later" rather than designed now:

- **Service prices** — Aiden will provide; the data file structure already has an optional `priceFrom?: string` field that the card renders if present, otherwise renders nothing (CTA still says "Request a quote").
- **Real testimonials** — placeholders to start; Aiden swaps in `src/data/testimonials.ts`.
- **Real gallery images** — high-quality Unsplash placeholders to start; Aiden drops his own JPGs in `public/gallery/` and updates `src/data/gallery.ts`.
- **Custom email-sender domain** — uses Resend's `onboarding@resend.dev` until Aiden verifies his own domain. README documents the switch.
- **Deployment** — README documents Vercel deploy. Not part of this build.

## 13. Open Questions

None.
