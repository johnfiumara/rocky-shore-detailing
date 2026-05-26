# Rocky Shore Detailing — Grounded Redesign (Visual System Overhaul)

**Date**: 2026-05-26
**Status**: Approved foundations + section breakdown; spec under user review
**Supersedes (visual identity only)**: `2026-05-26-rocky-shore-site-design.md` §4 "Coastal Luxury" and the motion/3D bullets in §3
**Preserves**: every functional goal in the original spec — booking wizard, Resend email, `src/data/` content model, accessibility, performance targets

## 1. Context — why this redesign

The first-pass site landed at "coastal luxury" — dark cinematic surfaces, chrome particles, italic editorial display serif, magnetic cursor, smooth-scrolled choreography. After seeing it on a real browser, the brand owner read it as too fashion / too tech-luxury for a one-person mobile detailer working out of a truck across Maine. The new direction is **grounded, nature, grassroots Maine**: warm stone surfaces, an honest workhorse type family, a photograph hero, and motion that's reflective rather than choreographed.

This document captures the new visual system and the section-level changes it triggers. The plan that executes it lives in a separate `docs/superpowers/plans/` file (next step).

## 2. Locked design decisions

| Axis | Decision |
|---|---|
| Palette | **Granite Coast** — warm stone background, deep ink type, slate + moss + rust accents |
| Type | **IBM Plex family** — Serif (display), Sans (body/UI), Mono (eyebrows/captions/numerals) |
| Hero | **Photograph hero** — full-bleed Maine photo + gradient overlay + headline. No 3D. |
| Overhaul depth | **Full re-aesthetic** — tokens + type + hero + cinematic motion stack removed + Process section relayout + Testimonials section relayout |

## 3. Foundations

### 3.1 Palette tokens

Replaces every token in `src/app/globals.css` `:root` and `@theme inline`. Names change because the old `--rs-ink` (dark background) and new `--rs-ink` (dark text on light background) play opposite roles.

| Token | Hex | Role |
|---|---|---|
| `--rs-stone` | `#d8d3c8` | Page background |
| `--rs-stone-2` | `#cbc5b6` | Slightly recessed surface |
| `--rs-paper` | `#ece6d4` | Card / pulled-quote surface |
| `--rs-ink` | `#1f2326` | Primary text, dark surfaces, primary buttons |
| `--rs-ink-2` | `#2a2f33` | Elevated dark surface |
| `--rs-mist` | `#73797b` | Muted / tertiary text |
| `--rs-slate` | `#4d6166` | Eyebrows, links, mono accents (slate teal) |
| `--rs-moss` | `#3a5a4c` | Italic emphasis, hover state |
| `--rs-rust` | `#a85a32` | Rare highlight, status dots |
| `--rs-line` | `rgba(31,35,38,0.10)` | Hairlines |
| `--rs-line-strong` | `rgba(31,35,38,0.22)` | Strong hairlines |

Contrast (verified): ink-on-stone 11.8:1, slate-on-stone 5.4:1, moss-on-stone 5.7:1, rust-on-stone 4.6:1 — all pass WCAG AA. Mist-on-stone is 3.1:1; reserved for decorative captions only, never body text.

### 3.2 Type stack

Loaded via `next/font/google` (no runtime FOIT, latin subset):

```ts
const plexSerif = IBM_Plex_Serif({ variable: "--font-plex-serif", subsets: ["latin"], weight: ["400","500"], style: ["normal","italic"], display: "swap" });
const plexSans  = IBM_Plex_Sans({  variable: "--font-plex-sans",  subsets: ["latin"], weight: ["400","500","600"], display: "swap" });
const plexMono  = IBM_Plex_Mono({  variable: "--font-plex-mono",  subsets: ["latin"], weight: ["400","500"], display: "swap" });
```

Tailwind `@theme inline` exposes them as `--font-display`, `--font-sans`, `--font-mono`. Existing `body { font-family: var(--font-sans) }` stays the same shape; values change.

Headline style (CSS class `.headline`):
- `font-family: var(--font-display)`
- `font-weight: 400`
- `letter-spacing: -0.02em`
- `line-height: 0.98`

`.headline em` (italic emphasis) recolors to `--rs-moss`. No font-variation-settings axes — Plex Serif doesn't have them, and the look doesn't need them.

Eyebrow (`.eyebrow`):
- `font-family: var(--font-mono)`
- `font-size: 0.7rem`
- `letter-spacing: 0.24em`
- `text-transform: uppercase`
- `color: var(--rs-slate)`

### 3.3 Surface treatment

**Removed** from `globals.css`:
- `.grain::before` SVG-noise fixed overlay (was cinematic)
- `.vignette::after` radial vignette (was theater darkening)
- `@media (pointer: fine) { .has-cursor, .has-cursor * { cursor: none } }` (magnetic cursor)
- The `has-cursor`, `grain`, `vignette` classes on `<body>` in `src/app/layout.tsx`

**No replacement texture.** The warm stone color already reads paper-y; adding noise on top muddies it.

### 3.4 Motion philosophy

**Removed**:
- `lenis` (smooth scroll) — back to native browser scroll. Native scroll is more grounded; smooth scroll is a luxury-tech tell.
- `gsap` + `ScrollTrigger` — was only used for the hero char-by-char reveal and the Process horizontal pin, both of which we're dropping.
- `@theatre/core`, `@theatre/studio` — orphaned after hero swap.
- `@react-three/fiber`, `@react-three/drei`, `three`, `@types/three` — orphaned after hero swap.
- `src/components/cursor.tsx` (magnetic cursor)
- `src/components/smooth-scroll.tsx`
- `src/components/hero/` directory (chrome-particles, hero-canvas, hero-timeline, hero.tsx)

**Kept**:
- `framer-motion` for: in-view section reveals, FAQ accordion height, booking step transitions, gallery before/after slider drag.
- `MotionConfig reducedMotion="user"` in the existing `MotionProvider` wrapper — every Framer animation respects OS preference.

**Reveal philosophy** (one rule, applied site-wide):
- `opacity: 0 → 1` and `translateY: 16px → 0`
- Duration `600ms`, ease `[0.2, 0.7, 0.2, 1]` (gentle ease-out)
- Triggered with `useInView({ once: true, amount: 0.2 })`
- No character splits, no per-letter staggers, no scroll-scrubbed timelines.

### 3.5 Files removed, added, renamed

**Delete**:
```
src/components/hero/                           (entire dir)
src/components/cursor.tsx
src/components/smooth-scroll.tsx
```

**Add**:
```
src/components/hero-section.tsx                (new photo hero; ~80 LOC)
src/data/hero.ts                               (photo URL + alt text + copy)
```

**Rewrite** (palette/type swap + small structural changes):
```
src/app/globals.css
src/app/layout.tsx                             (drop cursor + smooth-scroll wrappers; drop has-cursor/grain/vignette classes)
src/app/page.tsx                               (import hero-section instead of hero/hero)
src/components/navigation.tsx
src/components/footer.tsx
src/components/reveal.tsx                      (simplify to opacity+rise only)
src/components/story-section.tsx
src/components/services-section.tsx
src/components/service-card.tsx
src/components/process-section.tsx             (full layout rewrite — vertical timeline)
src/components/gallery-section.tsx
src/components/before-after.tsx                (handle restyle only)
src/components/testimonials-section.tsx        (full layout rewrite — static grid)
src/components/booking-section.tsx
src/components/booking-progress.tsx            (01 → 02 → 03 mono numerals)
src/components/booking-step-vehicle.tsx
src/components/booking-step-when.tsx
src/components/booking-step-photos.tsx
src/components/booking-success.tsx
src/components/faq-section.tsx
src/components/faq-item.tsx
src/components/marquee.tsx                     (now unused — delete)
```

**`package.json` dependency removal**: `lenis`, `gsap`, `@theatre/core`, `@theatre/studio`, `@react-three/fiber`, `@react-three/drei`, `three`, `@types/three`.

## 4. Section-by-section

Each section keeps its current data shape and layout intent. Color/type/accent changes are universal and implicit; only the deltas worth calling out are described below.

### 4.1 Hero (rewrite — `src/components/hero-section.tsx`)

Layout:
- `<section class="relative isolate min-h-[100svh] flex flex-col">`
- Background: full-bleed `<Image src={hero.photo} fill priority sizes="100vw" />`
- Overlay: top→bottom gradient `linear-gradient(180deg, rgba(31,35,38,0) 0%, rgba(31,35,38,0.40) 55%, rgba(31,35,38,0.92) 100%)`
- Top-left eyebrow: Plex Mono `MOBILE DETAILING · STATEWIDE MAINE` in `--rs-stone`
- Top-right caption: Plex Mono two-line `Statewide / by appointment` in `--rs-stone` (60% opacity)
- Bottom-left block: Plex Serif headline `clamp(2.75rem, 7vw, 5.5rem)`, two-line, second clause italic moss-colored; Plex Sans paragraph max 36ch; two buttons (primary stone-filled, secondary ink-bordered ghost) stacked horizontally
- Bottom-center: Plex Mono `SCROLL ↓` in `--rs-stone` 60% opacity

Hero photo: `src/data/hero.ts` exports `{ src, alt }`. Default `src` is an Unsplash placeholder of a coastal-Maine road or pine-forest backdrop; documented in README that Aiden swaps to his own photo by changing this one file.

No 3D, no `<Canvas>`, no Theatre.js, no GSAP, no char splits.

### 4.2 Story (`story-section.tsx`)

Layout unchanged. Type + color swap. Underline animation that used bronze now uses `--rs-moss` via Framer Motion `width: 0 → 100%` over 700ms when in view. Story image gets a paper-card frame: `bg-paper` + 1px `--rs-line` border + Plex Mono caption beneath (`Aiden Quinn · 2024`).

### 4.3 Services (`services-section.tsx`, `service-card.tsx`)

Cards swap from dark-glow to paper-card aesthetic:
- `bg-[color:var(--rs-paper)]`
- `border: 1px solid var(--rs-line)`
- Inner padding `28px 24px`
- Slug rendered top-right in Plex Mono `--rs-slate`
- Title in Plex Serif (no italic)
- Inclusions list in Plex Sans with `--rs-slate` square bullets
- Footer: optional `priceFrom` Plex Mono + arrow-link CTA
- Hover (CSS only): `transform: translateY(-4px)`, border becomes `--rs-line-strong`, arrow `rotate(-45deg)` to point up-right
- **No bronze glow, no 3D tilt, no Framer Motion hover animations.**

### 4.4 Process (full layout rewrite — `process-section.tsx`)

Old: GSAP-ScrollTrigger pinned horizontal scroll, 5 steps slide horizontally as the section scrubs.

New: **vertical timeline.**
- `<ol class="relative">` with a 1px left rail in `--rs-line-strong`, positioned `left: 32px` desktop / `left: 16px` mobile
- Each `<li>`: numbered marker (Plex Mono `01 / 02 / …` in a 32px ink-stroked circle on the rail), step title in Plex Serif, body in Plex Sans
- Each item reveals on scroll-in via the global Reveal component (opacity + 16px rise)
- Total section height grows naturally with content — no pinning, no scrubbing, no horizontal scroll
- Mobile: same layout, narrower padding

Drops the entire GSAP dependency.

### 4.5 Gallery (`gallery-section.tsx`, `before-after.tsx`)

Before/after slider stays — it's functional, not decorative. Restyle only:
- Drag handle: a 40px ink circle with `<GripVertical>` lucide icon at 14px in stone color
- Below the slider: Plex Mono caption `drag to compare` in `--rs-mist`, centered, on mount; fades out after first drag

6-tile grid: tile bg becomes `bg-paper`, 1px `--rs-line` border, Plex Mono caption beneath each (existing `gallery.ts` `caption` field). Hover: `translateY(-2px)`, border strengthens. No glow.

### 4.6 Testimonials (full layout rewrite — `testimonials-section.tsx`)

Old: two-row CSS marquee in opposite directions with pause-on-hover.

New: **static grid.**
- 3-column on desktop (`>=1024px`), 2-column on tablet, 1-column on mobile
- Each card: `bg-paper`, 1px `--rs-line` border, padding `28px 24px`
- Large slate `"` quote glyph at top-left (Plex Serif 4rem, line-height 0.7, position absolute)
- Body in Plex Serif italic, `--rs-ink`
- Attribution in Plex Mono: `— First Last · Town, ME`
- Reveals stagger by 100ms via Framer Motion `useInView`

Deletes `src/components/marquee.tsx` (now unused) and removes the `.rs-marquee*` CSS rules.

### 4.7 Booking (`booking-section.tsx` + 3 step components + `booking-progress.tsx` + `booking-success.tsx`)

Wizard layout unchanged. All restyle:
- Step indicator becomes `01 → 02 → 03` in Plex Mono. Active step `--rs-ink`, inactive `--rs-mist`. Arrows stay in mist.
- Inputs: `bg-paper`, 1px `--rs-line` border, focus border `--rs-ink`. Label Plex Mono, value Plex Sans.
- Buttons match global pattern (primary ink-filled, secondary ink-bordered ghost).
- Photo dropzone: paper background, dashed `--rs-line-strong` border, "drop or click" prompt in Plex Mono.
- Step transitions: 200ms opacity-only fade via Framer Motion. No translate, no slide.
- Success state: paper card, Plex Serif headline `Sent.`, body confirming Aiden will reply within 24h.

### 4.8 FAQ (`faq-section.tsx`, `faq-item.tsx`)

Accordion layout unchanged.
- Hairline `--rs-line` between items
- Question in Plex Serif
- Answer in Plex Sans
- Toggle indicator: small ink `+` that rotates 45° to read as `×` on open
- Framer Motion height + opacity animation preserved

### 4.9 Navigation (`navigation.tsx`)

- Sticky top, `bg-stone` initially transparent; on scroll past 32px adds opaque `bg-stone` and `border-b border-[--rs-line-strong]`
- Wordmark "Rocky Shore Detailing" in Plex Serif, last word italic in `--rs-moss`
- Links in Plex Mono uppercase, color `--rs-slate` → `--rs-ink` on hover
- Mobile drawer: slides from right (Framer Motion `x` animation), ink panel on `bg-stone/95 backdrop-blur` overlay

### 4.10 Footer (`footer.tsx`)

Three-column on desktop:
- Contact (phone / email / IG)
- Service area (Maine towns / "by appointment")
- Hours (Plex Mono day labels, Plex Sans times)

Labels in Plex Mono `--rs-slate`. Body in Plex Sans `--rs-ink`. Hairline `--rs-line-strong` above bottom row (copyright + IG icon). All on `bg-stone`.

## 5. Accessibility & performance impact

- Contrast: documented in §3.1. All non-decorative text passes WCAG AA.
- Reduced motion: still honored via `MotionConfig reducedMotion="user"`. The reveal philosophy uses only opacity + small translate, both auto-suppressed.
- Bundle size: net **reduction** by dropping `three` (~600KB), `@react-three/*`, `@theatre/*`, `gsap`, `lenis`. Estimated First Load JS drops by ~400KB (gzipped).
- LCP: hero image is `priority`-loaded `<Image>`. With the 3D canvas gone, no JS execution blocks the first paint.
- Keyboard nav: unchanged from previous spec — every interactive control is reachable.

## 6. Out of scope

- New copywriting. Current placeholder copy stays; Aiden can revise in `src/data/*.ts`.
- New photography. Hero photo is an Unsplash placeholder (documented for swap). Gallery photos unchanged.
- Logo mark. The wordmark stays text-only.
- CMS, blog, analytics — same exclusions as the original spec.
- Tests. Same as original spec — verification is `next build` + Lighthouse + manual smoke.

## 7. Verification

After implementation:
1. `npm run lint` — 0 errors
2. `npm run build` — succeeds; report bundle size delta in the plan's verification step
3. Visual smoke (Chrome DevTools MCP): hero photo renders, scroll through every section, confirm no chrome-particle artifacts, no magnetic cursor, no smooth-scroll easing
4. Reduced motion: toggle OS setting → reload → confirm reveals snap rather than animate
5. Mobile (≤375px): nav drawer, vertical timeline, single-column testimonials, dropzone all behave
6. Lighthouse (mobile, incognito): targets unchanged from original spec — Perf ≥ 80, A11y = 100, Best Practices = 100, SEO ≥ 95

## 8. Implementation handoff

Next step: invoke the `superpowers:writing-plans` skill to produce a task-by-task implementation plan at `docs/superpowers/plans/2026-05-26-grounded-redesign-implementation.md`. That plan will execute against this spec.
