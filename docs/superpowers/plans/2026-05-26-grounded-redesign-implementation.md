# Grounded Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Coastal Luxury" visual system (dark cinematic, chrome particles, Fraunces italic, magnetic cursor, smooth-scrolled choreography) with the "Granite Coast" grounded system (warm stone surfaces, IBM Plex family, photograph hero, native scroll, simpler reveals). Spec: `docs/superpowers/specs/2026-05-26-grounded-redesign.md`.

**Architecture:** Token-driven cutover. Task 1 rewrites `globals.css` and trims `layout.tsx`; everything downstream inherits the new palette via Tailwind utilities or CSS vars. Each section is then rewritten or restyled in isolation — every component holds its own structure, no shared state to migrate. Cinematic dependencies (`three`, `@react-three/*`, `@theatre/*`, `gsap`, `lenis`) and their consumer files are removed only after every component that references them has been updated, then `package.json` is cleaned up in one task.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · `next/font/google` (IBM Plex Serif/Sans/Mono) · React Hook Form + Zod · Resend.

**Important context for the executor:**
- Between Task 1 and each component task, the site will *render* with broken styling (Tailwind utilities like `bg-ink`, `text-bone`, `text-bronze` reference tokens that no longer exist after Task 1 — they emit nothing). This is expected. `npx tsc --noEmit` and `npm run lint` stay green throughout. Visual smoke is performed at Task 15 once every component is migrated.
- Do not commit before running `npx tsc --noEmit` for any task that touches TypeScript/TSX.
- Project root: `C:\Users\fumar\Videos\New folder\rocky-shore-detailing` (Windows; use bash via Git Bash for `rm` / `git`).
- `prefers-reduced-motion` is currently enabled on the developer's OS — Framer reveals will not animate; verify with `npx tsc --noEmit` and reload, not by watching motion.

---

## Task 1: Foundations — tokens, type, layout

**Files:**
- Modify: `src/app/globals.css` (full rewrite)
- Modify: `src/app/layout.tsx` (drop `SmoothScroll` + `Cursor` wrappers, swap fonts, retune body classes)

- [ ] **Step 1: Rewrite `src/app/globals.css` entirely**

```css
@import "tailwindcss";

/* =========================================================
   ROCKY SHORE DETAILING — Granite Coast theme
   ========================================================= */

:root {
  /* Surfaces */
  --rs-stone: #d8d3c8;
  --rs-stone-2: #cbc5b6;
  --rs-paper: #ece6d4;

  /* Ink */
  --rs-ink: #1f2326;
  --rs-ink-2: #2a2f33;
  --rs-mist: #73797b;

  /* Accents */
  --rs-slate: #4d6166;
  --rs-moss: #3a5a4c;
  --rs-rust: #a85a32;

  /* Hairlines */
  --rs-line: rgba(31, 35, 38, 0.10);
  --rs-line-strong: rgba(31, 35, 38, 0.22);

  --background: var(--rs-stone);
  --foreground: var(--rs-ink);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-stone: var(--rs-stone);
  --color-stone-2: var(--rs-stone-2);
  --color-paper: var(--rs-paper);
  --color-ink: var(--rs-ink);
  --color-ink-2: var(--rs-ink-2);
  --color-mist: var(--rs-mist);
  --color-slate: var(--rs-slate);
  --color-moss: var(--rs-moss);
  --color-rust: var(--rs-rust);
  --color-line: var(--rs-line);
  --color-line-strong: var(--rs-line-strong);

  --font-display: var(--font-plex-serif);
  --font-sans: var(--font-plex-sans);
  --font-mono: var(--font-plex-mono);
}

/* Base */
html {
  background: var(--rs-stone);
  color-scheme: light;
}

body {
  background: var(--rs-stone);
  color: var(--rs-ink);
  font-family: var(--font-sans), ui-sans-serif, system-ui;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
}

/* Selection / focus */
::selection { background: var(--rs-moss); color: var(--rs-stone); }
:focus-visible {
  outline: 2px solid var(--rs-moss);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--rs-stone-2); border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: var(--rs-mist); }

/* Display headline */
.headline {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 0.98;
}
.headline em,
.headline i {
  font-style: italic;
  color: var(--rs-moss);
}

/* Eyebrow */
.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--rs-slate);
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 1.4rem;
  background: var(--rs-ink);
  color: var(--rs-stone);
  border-radius: 4px;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: -0.005em;
  transition: transform 220ms ease, background 220ms ease;
}
.btn-primary:hover {
  background: var(--rs-moss);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 1.3rem;
  border: 1px solid var(--rs-line-strong);
  border-radius: 4px;
  color: var(--rs-ink);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  background: transparent;
  transition: border-color 200ms ease, color 200ms ease, background 200ms ease;
}
.btn-ghost:hover {
  border-color: var(--rs-ink);
  background: rgba(31, 35, 38, 0.04);
}
.btn-ghost:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Rewrite `src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

import MotionProvider from "@/components/motion-provider";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rocky Shore Detailing — Mobile Auto Detailing across Maine",
    template: "%s · Rocky Shore Detailing",
  },
  description:
    "Hand-crafted mobile auto detailing by Aiden Quinn. Paint correction, ceramic coatings, interior restoration — at your driveway, statewide across Maine.",
  metadataBase: new URL("https://rockyshoredetailing.com"),
  openGraph: {
    title: "Rocky Shore Detailing",
    description:
      "Hand-crafted mobile auto detailing by Aiden Quinn. Statewide Maine.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#d8d3c8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone text-ink">
        <MotionProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Components still reference old utility classes like `bg-ink`/`text-bone`; those produce no CSS but cause no type errors.)

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(theme): swap Coastal Luxury tokens for Granite Coast + IBM Plex family"
```

---

## Task 2: Simplify Reveal

**Files:**
- Modify: `src/components/reveal.tsx`

- [ ] **Step 1: Replace `src/components/reveal.tsx`**

```tsx
"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "h2" | "h3" | "span";
};

const variants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: Props) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
```

Note: the `y` prop is dropped. Every consumer continues to compile because removing an optional prop is non-breaking.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/reveal.tsx
git commit -m "refactor(reveal): single 16px/600ms in-view fade — drop y prop, simplify variants"
```

---

## Task 3: Photo hero (new) + page.tsx import + delete `src/components/hero/`

**Files:**
- Create: `src/data/hero.ts`
- Create: `src/components/hero-section.tsx`
- Delete: `src/components/hero/chrome-particles.tsx`, `src/components/hero/hero-canvas.tsx`, `src/components/hero/hero-timeline.ts`, `src/components/hero/hero.tsx`, `src/components/hero/` (directory)
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/data/hero.ts`**

```ts
export type HeroContent = {
  photo: { src: string; alt: string };
  eyebrow: string;
  topRight: string[];
  headlineLine1: string;
  headlineLine2: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export const hero: HeroContent = {
  photo: {
    src: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2400&q=85",
    alt: "Quiet Maine coastline at golden hour",
  },
  eyebrow: "Mobile Detailing · Statewide Maine",
  topRight: ["Statewide", "by appointment"],
  headlineLine1: "Worked by hand,",
  headlineLine2: "measured by sun.",
  body:
    "Aiden Quinn brings the studio to your driveway — paint correction, ceramic coatings, and full restorations across Maine.",
  primaryCta: { label: "Book a detail", href: "#book" },
  secondaryCta: { label: "See the work", href: "#gallery" },
};
```

- [ ] **Step 2: Create `src/components/hero-section.tsx`**

```tsx
import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import { hero } from "@/data/hero";

export default function HeroSection() {
  return (
    <section
      id="top"
      aria-labelledby="hero-h"
      className="relative isolate min-h-[100svh] flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src={hero.photo.src}
          alt={hero.photo.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(31,35,38,0) 0%, rgba(31,35,38,0.40) 55%, rgba(31,35,38,0.92) 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 pt-32 md:pt-40 flex items-start justify-between gap-6">
        <p className="eyebrow text-stone/90">{hero.eyebrow}</p>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-stone/70 leading-relaxed text-right">
          {hero.topRight.map((line) => (
            <span key={line} className="block">{line}</span>
          ))}
        </p>
      </div>

      <div className="relative flex-1 mx-auto w-full max-w-7xl px-6 pb-32 md:pb-40 flex flex-col justify-end">
        <h1
          id="hero-h"
          className="headline text-stone text-[clamp(2.75rem,7vw,5.5rem)] max-w-5xl"
        >
          {hero.headlineLine1}<br />
          <em>{hero.headlineLine2}</em>
        </h1>
        <p className="mt-8 max-w-xl text-stone/85 leading-relaxed">
          {hero.body}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href={hero.primaryCta.href} className="btn-primary" style={{ background: "var(--rs-stone)", color: "var(--rs-ink)" }}>
            {hero.primaryCta.label} <ArrowRight size={16} />
          </a>
          <a
            href={hero.secondaryCta.href}
            className="btn-ghost"
            style={{ borderColor: "rgba(236, 230, 212, 0.35)", color: "var(--rs-stone)" }}
          >
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>

      <a
        href="#story"
        aria-label="Scroll to story"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-stone/60"
      >
        <span>Scroll</span>
        <ArrowDown size={14} />
      </a>
    </section>
  );
}
```

Note: hero CTAs override `.btn-primary`/`.btn-ghost` colors inline because the hero sits on a dark photo overlay, not on the stone page background.

- [ ] **Step 3: Update `src/app/page.tsx`**

```tsx
import HeroSection from "@/components/hero-section";
import StorySection from "@/components/story-section";
import ServicesSection from "@/components/services-section";
import ProcessSection from "@/components/process-section";
import GallerySection from "@/components/gallery-section";
import TestimonialsSection from "@/components/testimonials-section";
import BookingSection from "@/components/booking-section";
import FaqSection from "@/components/faq-section";

export default function Page() {
  return (
    <>
      <HeroSection />
      <StorySection />
      <ServicesSection />
      <ProcessSection />
      <GallerySection />
      <TestimonialsSection />
      <BookingSection />
      <FaqSection />
    </>
  );
}
```

- [ ] **Step 4: Delete the old hero directory**

Run (Git Bash):
```bash
rm -rf src/components/hero
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/hero.ts src/components/hero-section.tsx src/app/page.tsx
git rm -r src/components/hero
git commit -m "feat(hero): photograph hero replaces R3F/Theatre.js chrome-particle scene"
```

---

## Task 4: Navigation restyle

**Files:**
- Modify: `src/components/navigation.tsx`

- [ ] **Step 1: Replace `src/components/navigation.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#story", label: "Story" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#gallery", label: "Work" },
  { href: "#book", label: "Book" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 320 && y > lastY);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-transform duration-500 ${
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-6 py-4 flex items-center justify-between transition-colors duration-300 ${
          scrolled || open ? "bg-stone/95 backdrop-blur border-b border-line-strong" : ""
        }`}
      >
        <a
          href="#top"
          className="flex items-baseline gap-2 font-display text-xl tracking-tight text-ink"
        >
          <span>Rocky Shore</span>
          <em className="text-moss font-normal">Detailing</em>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] tracking-[0.2em] uppercase text-slate hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#book" className="hidden md:inline-flex btn-primary text-sm">Book a detail</a>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden text-ink p-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-stone/95 backdrop-blur border-b border-line-strong px-6 py-8 flex flex-col gap-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-ink hover:text-moss transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a href="#book" onClick={() => setOpen(false)} className="btn-primary self-start mt-4">
            Book a detail
          </a>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation.tsx
git commit -m "feat(nav): Granite Coast restyle — stone bg, ink wordmark, moss italic, mono links"
```

---

## Task 5: Footer restyle

**Files:**
- Modify: `src/components/footer.tsx`

- [ ] **Step 1: Replace `src/components/footer.tsx`**

```tsx
import { Mail, Phone, AtSign } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-line-strong bg-stone">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="eyebrow">Rocky Shore Detailing</p>
            <h2 className="headline mt-4 text-5xl md:text-7xl text-ink">
              Hand-detailed,<br />
              <em>statewide.</em>
            </h2>
            <p className="mt-6 max-w-md text-ink/75 leading-relaxed">
              Mobile auto detailing by Aiden Quinn. From Kittery to Madawaska — we bring the studio to your driveway.
            </p>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 gap-10">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-slate mb-4">Contact</p>
              <ul className="space-y-3 text-ink">
                <li className="flex items-center gap-3">
                  <Phone size={14} className="text-slate" />
                  <a href="tel:+12075550100" className="hover:text-moss transition-colors">(207) 555-0100</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={14} className="text-slate" />
                  <a href="mailto:hello@rockyshoredetailing.com" className="hover:text-moss transition-colors">hello@rockyshoredetailing.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <AtSign size={14} className="text-slate" />
                  <a href="https://instagram.com" className="hover:text-moss transition-colors">@rockyshore</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-slate mb-4">Hours</p>
              <ul className="space-y-2 text-ink/80 text-sm">
                <li>Mon – Fri · 8a – 6p</li>
                <li>Saturday · 9a – 4p</li>
                <li>Sunday · by appointment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-line-strong flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-mist text-xs font-mono tracking-wider uppercase">
          <span>© {year} Rocky Shore Detailing · Statewide Maine</span>
          <span>Built with care</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/footer.tsx
git commit -m "feat(footer): Granite Coast restyle — stone bg, slate labels, moss link hover"
```

---

## Task 6: Story section restyle

**Files:**
- Modify: `src/components/story-section.tsx`

- [ ] **Step 1: Replace `src/components/story-section.tsx`**

```tsx
import Reveal from "@/components/reveal";

export default function StorySection() {
  return (
    <section id="story" aria-labelledby="story-h" className="relative py-32 md:py-44">
      <div className="mx-auto max-w-7xl px-6 grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Reveal>
            <p className="eyebrow">The Studio</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="story-h" className="headline mt-6 text-5xl md:text-7xl text-ink">
              An Aiden Quinn<br />studio,<br /><em>on wheels.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-10 h-px w-24 bg-moss" />
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7 self-end space-y-6 text-ink/80 leading-relaxed text-lg">
          <Reveal delay={0.1}>
            <p>
              Rocky Shore started in a single garage in Portland, the kind of operation where a 2-stage polish meant
              missing dinner. Today it&apos;s a fully-equipped mobile studio that shows up at your driveway with water,
              power, and product — so you never give up your day to a shop.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p>
              Aiden Quinn is the only set of hands on every job. No subcontractors, no quick-fix passes. Every car
              gets paint readings before correction; every coating gets a 12-hour cure window honored to the minute.
              The standard he applies to a daily driver is the standard he applies to a concours collection.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate">
              Detailing Maine · Kittery to Madawaska · 2018 →
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/story-section.tsx
git commit -m "feat(story): Granite Coast restyle — ink body, moss underline, slate tagline"
```

---

## Task 7: Services + ServiceCard restyle

**Files:**
- Modify: `src/components/services-section.tsx`
- Modify: `src/components/service-card.tsx`

- [ ] **Step 1: Replace `src/components/services-section.tsx`**

```tsx
import Reveal from "@/components/reveal";
import ServiceCard from "@/components/service-card";
import { services } from "@/data/services";

export default function ServicesSection() {
  return (
    <section
      id="services"
      aria-labelledby="services-h"
      className="relative py-32 md:py-44 border-t border-line-strong"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16 md:mb-24">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">What we offer</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="services-h" className="headline mt-6 text-5xl md:text-7xl text-ink">
                Five services.<br /><em>One pair of hands.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-ink/75 leading-relaxed">
                Built around the most common asks. Bundle, modify, or ask for something else entirely on the booking form.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.06}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `src/components/service-card.tsx`**

```tsx
"use client";

import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <a
      href={`#book?service=${service.slug}`}
      onClick={(e) => {
        e.preventDefault();
        history.replaceState(null, "", `#book?service=${service.slug}`);
        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="group relative flex flex-col p-8 rounded-md border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-line-strong"
    >
      <div className="flex items-baseline justify-between mb-3">
        <p className="eyebrow">{service.eyebrow}</p>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-slate/70">
          {service.slug}
        </span>
      </div>
      <h3 className="font-display text-3xl md:text-4xl text-ink">{service.title}</h3>
      <p className="mt-4 text-ink/75 leading-relaxed">{service.tagline}</p>
      <ul className="mt-6 space-y-2 text-sm text-ink/80">
        {service.inclusions.map((inc) => (
          <li key={inc} className="flex items-start gap-3">
            <span className="mt-2 size-1 rounded-full bg-slate shrink-0" />
            <span>{inc}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-slate">
          {service.priceFrom ? `From ${service.priceFrom}` : "Request a quote"}
        </span>
        <ArrowUpRight
          size={18}
          className="text-ink transition-transform duration-300 group-hover:-rotate-45"
        />
      </div>
    </a>
  );
}
```

Note: dropped `motion.a` + `whileHover` — replaced with CSS hover via Tailwind. Drops one Framer Motion import per card.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/services-section.tsx src/components/service-card.tsx
git commit -m "feat(services): paper cards on stone, slate bullets, hover lift via CSS, no glow"
```

---

## Task 8: Process — vertical timeline (full rewrite, eliminates GSAP)

**Files:**
- Modify: `src/components/process-section.tsx`

- [ ] **Step 1: Replace `src/components/process-section.tsx`**

```tsx
import Reveal from "@/components/reveal";
import { processSteps } from "@/data/process-steps";

export default function ProcessSection() {
  return (
    <section
      id="process"
      aria-labelledby="process-h"
      className="relative border-t border-line-strong py-32 md:py-44"
    >
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p className="eyebrow">The process</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="process-h" className="headline mt-6 text-5xl md:text-7xl max-w-3xl text-ink">
            From driveway<br />to <em>final reveal.</em>
          </h2>
        </Reveal>

        <ol className="relative mt-16 md:mt-24 pl-14 md:pl-20 space-y-14 md:space-y-20 before:absolute before:top-2 before:bottom-2 before:left-4 md:before:left-6 before:w-px before:bg-line-strong">
          {processSteps.map((step, i) => (
            <Reveal as="li" key={step.number} delay={i * 0.05} className="relative">
              <span
                aria-hidden
                className="absolute -left-14 md:-left-20 top-0 size-8 rounded-full border border-line-strong bg-stone flex items-center justify-center font-mono text-[11px] text-ink"
              >
                {step.number}
              </span>
              <h3 className="font-display text-3xl md:text-4xl text-ink">{step.title}</h3>
              <p className="mt-3 text-ink/75 leading-relaxed max-w-2xl">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

This deletes the last remaining `gsap` import in the project. Verify in the next step.

- [ ] **Step 2: Verify no remaining GSAP imports**

Run: `grep -r "from \"gsap\"" src/ 2>/dev/null` (or use Grep tool on `from "gsap"`)
Expected: no results.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/process-section.tsx
git commit -m "feat(process): vertical numbered timeline replaces GSAP pinned horizontal scroll"
```

---

## Task 9: Gallery + BeforeAfter restyle

**Files:**
- Modify: `src/components/gallery-section.tsx`
- Modify: `src/components/before-after.tsx`

- [ ] **Step 1: Replace `src/components/gallery-section.tsx`**

```tsx
import Image from "next/image";
import Reveal from "@/components/reveal";
import BeforeAfter from "@/components/before-after";
import { beforeAfter, galleryGrid } from "@/data/gallery";

export default function GallerySection() {
  return (
    <section
      id="gallery"
      aria-labelledby="gallery-h"
      className="relative py-32 md:py-44 border-t border-line-strong"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">Selected work</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="gallery-h" className="headline mt-6 text-5xl md:text-7xl text-ink">
                Drag the line.<br /><em>See the difference.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-ink/75 leading-relaxed">{beforeAfter.label}</p>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <BeforeAfter pair={beforeAfter} />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 mt-16">
          {galleryGrid.map((img, i) => (
            <Reveal key={img.src} delay={i * 0.05}>
              <figure className="relative aspect-[4/5] rounded-md overflow-hidden border border-line bg-paper">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 30vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `src/components/before-after.tsx`**

```tsx
"use client";

import Image from "next/image";
import { GripVertical } from "lucide-react";
import { useRef, useState } from "react";
import type { BeforeAfterPair } from "@/data/gallery";

export default function BeforeAfter({ pair }: { pair: BeforeAfterPair }) {
  const [pos, setPos] = useState(50);
  const [dragged, setDragged] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, ratio)));
    if (!dragged) setDragged(true);
  };

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="relative w-full aspect-[16/10] rounded-md overflow-hidden border border-line-strong select-none cursor-ew-resize"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFromClientX(e.clientX);
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }}
        role="slider"
        aria-label={`Before and after: ${pair.label}`}
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
        }}
      >
        <Image
          src={pair.after.src}
          alt={pair.after.alt}
          fill
          sizes="(min-width: 768px) 75vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <Image
            src={pair.before.src}
            alt={pair.before.alt}
            fill
            sizes="(min-width: 768px) 75vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-y-0" style={{ left: `${pos}%`, transform: "translateX(-1px)" }}>
          <div className="absolute inset-y-0 w-px bg-stone" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-10 rounded-full bg-ink text-stone flex items-center justify-center pointer-events-none">
            <GripVertical size={14} />
          </div>
        </div>
        <div className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.2em] uppercase bg-ink/80 backdrop-blur px-3 py-1.5 rounded text-stone">
          Before
        </div>
        <div className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.2em] uppercase bg-ink/80 backdrop-blur px-3 py-1.5 rounded text-stone">
          After
        </div>
      </div>
      <p
        aria-hidden
        className={`mt-3 text-center font-mono text-[10px] tracking-[0.22em] uppercase text-mist transition-opacity duration-500 ${
          dragged ? "opacity-0" : "opacity-100"
        }`}
      >
        drag to compare
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/gallery-section.tsx src/components/before-after.tsx
git commit -m "feat(gallery): paper-framed tiles, ink-circle slider handle with mono caption"
```

---

## Task 10: Testimonials — static grid (delete marquee)

**Files:**
- Modify: `src/components/testimonials-section.tsx` (full rewrite)
- Delete: `src/components/marquee.tsx`

- [ ] **Step 1: Replace `src/components/testimonials-section.tsx`**

```tsx
import Reveal from "@/components/reveal";
import { testimonials } from "@/data/testimonials";

function Quote({
  quote,
  name,
  context,
  index,
}: {
  quote: string;
  name: string;
  context: string;
  index: number;
}) {
  return (
    <Reveal as="div" delay={index * 0.05}>
      <figure className="relative h-full rounded-md border border-line bg-paper p-8">
        <span
          aria-hidden
          className="absolute -top-2 left-6 font-display italic text-7xl leading-none text-slate/40 select-none"
        >
          &ldquo;
        </span>
        <blockquote className="font-display italic text-xl text-ink leading-snug pt-6">
          {quote}
        </blockquote>
        <figcaption className="mt-6 font-mono text-[11px] tracking-[0.2em] uppercase text-slate">
          — {name} <span className="text-mist">·</span> <span className="text-ink/70">{context}</span>
        </figcaption>
      </figure>
    </Reveal>
  );
}

export default function TestimonialsSection() {
  return (
    <section
      aria-labelledby="testimonials-h"
      className="relative py-32 md:py-44 border-t border-line-strong"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16">
          <Reveal>
            <p className="eyebrow">In their words</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="testimonials-h" className="headline mt-6 text-5xl md:text-7xl text-ink">
              The work, <em>reviewed.</em>
            </h2>
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Quote key={`${t.name}-${i}`} index={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Delete `src/components/marquee.tsx`**

Run: `rm src/components/marquee.tsx`

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/testimonials-section.tsx
git rm src/components/marquee.tsx
git commit -m "feat(testimonials): static 3-column paper grid replaces dual marquee"
```

---

## Task 11: Booking — section + 3 steps + progress + success

**Files:**
- Modify: `src/components/booking-section.tsx`
- Modify: `src/components/booking-progress.tsx`
- Modify: `src/components/booking-step-vehicle.tsx`
- Modify: `src/components/booking-step-when.tsx`
- Modify: `src/components/booking-step-photos.tsx`
- Modify: `src/components/booking-success.tsx`

- [ ] **Step 1: Replace `src/components/booking-progress.tsx`**

```tsx
const STEP_LABELS = ["Vehicle", "When & Where", "Photos & Contact"];

export default function BookingProgress({ step }: { step: 0 | 1 | 2 }) {
  return (
    <ol
      aria-label="Booking progress"
      className="flex items-center gap-3 sm:gap-5 mb-10 font-mono text-[11px] tracking-[0.2em] uppercase"
    >
      {STEP_LABELS.map((label, i) => {
        const isCurrent = i === step;
        const isDone = i < step;
        const numeral = String(i + 1).padStart(2, "0");
        return (
          <li
            key={label}
            aria-current={isCurrent ? "step" : undefined}
            className="flex items-center gap-3 sm:gap-5"
          >
            <span
              className={`flex items-baseline gap-2 ${
                isCurrent ? "text-ink" : isDone ? "text-ink/65" : "text-mist"
              }`}
            >
              <span className="font-semibold">{numeral}</span>
              <span className="hidden sm:inline">{label}</span>
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span aria-hidden className="text-mist">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Replace `src/components/booking-step-vehicle.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { BookingInput } from "@/lib/booking-schema";
import { services } from "@/data/services";

export default function BookingStepVehicle() {
  const { register, formState: { errors }, watch, setValue } =
    useFormContext<BookingInput>();
  const selected = watch("service");

  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="font-display text-2xl md:text-3xl text-ink mb-6">Choose a service</legend>
        <div role="radiogroup" aria-label="Service" className="grid gap-3 md:grid-cols-2">
          {services.map((s) => {
            const checked = selected === s.slug;
            return (
              <label
                key={s.slug}
                className={`cursor-pointer rounded-md border p-5 transition-colors ${
                  checked
                    ? "border-ink bg-paper"
                    : "border-line hover:border-line-strong bg-stone-2"
                }`}
              >
                <input
                  type="radio"
                  value={s.slug}
                  {...register("service")}
                  className="sr-only"
                  onChange={() =>
                    setValue("service", s.slug as BookingInput["service"], { shouldValidate: true })
                  }
                />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-xl text-ink">{s.title}</span>
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-slate">
                    {s.eyebrow.split("·")[0].trim()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/75 leading-relaxed">{s.tagline}</p>
              </label>
            );
          })}
        </div>
        {errors.service && <FieldError msg={errors.service.message} />}
      </fieldset>

      <fieldset className="grid gap-5 md:grid-cols-4">
        <legend className="sr-only">Vehicle details</legend>
        <FormField label="Year" error={errors.year?.message}>
          <input type="number" inputMode="numeric" {...register("year")} className={inputClass} placeholder="2021" />
        </FormField>
        <FormField label="Make" error={errors.make?.message}>
          <input type="text" {...register("make")} className={inputClass} placeholder="Subaru" />
        </FormField>
        <FormField label="Model" error={errors.model?.message}>
          <input type="text" {...register("model")} className={inputClass} placeholder="Outback" />
        </FormField>
        <FormField label="Color" error={errors.color?.message}>
          <input type="text" {...register("color")} className={inputClass} placeholder="Magnetite Gray" />
        </FormField>
      </fieldset>
    </div>
  );
}

const inputClass =
  "w-full bg-paper border border-line rounded px-4 py-3 text-ink placeholder:text-mist focus:border-ink focus:outline-none transition-colors";

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] tracking-[0.22em] uppercase text-slate mb-2">
        {label}
      </span>
      {children}
      {error && <FieldError msg={error} />}
    </label>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-2 text-[12px] text-rust">
      {msg}
    </p>
  );
}
```

- [ ] **Step 3: Replace `src/components/booking-step-when.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { BookingInput } from "@/lib/booking-schema";
import { TIME_WINDOWS, TIME_WINDOW_LABELS } from "@/lib/booking-schema";
import { FormField, FieldError } from "@/components/booking-step-vehicle";

const inputClass =
  "w-full bg-paper border border-line rounded px-4 py-3 text-ink placeholder:text-mist focus:border-ink focus:outline-none transition-colors";

export default function BookingStepWhen() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BookingInput>();

  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().slice(0, 10);
  const selectedWindow = watch("timeWindow");

  return (
    <div className="space-y-10">
      <fieldset className="grid gap-5 md:grid-cols-6">
        <legend className="sr-only">Service location</legend>
        <div className="md:col-span-6">
          <FormField label="Street address" error={errors.address?.message}>
            <input type="text" {...register("address")} className={inputClass} placeholder="123 Coastal Rd." />
          </FormField>
        </div>
        <div className="md:col-span-4">
          <FormField label="City" error={errors.city?.message}>
            <input type="text" {...register("city")} className={inputClass} placeholder="Portland" />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="ZIP" error={errors.zip?.message}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              {...register("zip")}
              className={inputClass}
              placeholder="04101"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="sr-only">When</legend>
        <FormField label="Preferred date" error={errors.date?.message}>
          <input
            type="date"
            min={minDate}
            {...register("date")}
            className={inputClass}
          />
        </FormField>
        <div>
          <span className="block font-mono text-[10px] tracking-[0.22em] uppercase text-slate mb-2">
            Time window
          </span>
          <div role="radiogroup" aria-label="Time window" className="grid grid-cols-3 gap-2">
            {TIME_WINDOWS.map((w) => {
              const checked = selectedWindow === w;
              return (
                <label
                  key={w}
                  className={`cursor-pointer rounded border px-3 py-3 text-sm text-center transition-colors ${
                    checked
                      ? "border-ink bg-paper text-ink"
                      : "border-line text-ink/70 hover:border-line-strong"
                  }`}
                >
                  <input
                    type="radio"
                    value={w}
                    {...register("timeWindow")}
                    className="sr-only"
                    onChange={() => setValue("timeWindow", w, { shouldValidate: true })}
                  />
                  {TIME_WINDOW_LABELS[w].split(" ")[0]}
                </label>
              );
            })}
          </div>
          {errors.timeWindow && <FieldError msg={errors.timeWindow.message} />}
        </div>
      </fieldset>
    </div>
  );
}
```

- [ ] **Step 4: Replace `src/components/booking-step-photos.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { BookingInput } from "@/lib/booking-schema";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, validateFiles } from "@/lib/booking-schema";
import { FormField, FieldError } from "@/components/booking-step-vehicle";

const inputClass =
  "w-full bg-paper border border-line rounded px-4 py-3 text-ink placeholder:text-mist focus:border-ink focus:outline-none transition-colors";

type Props = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  filesError: string | null;
  setFilesError: (e: string | null) => void;
};

export default function BookingStepPhotos({
  files,
  onFilesChange,
  filesError,
  setFilesError,
}: Props) {
  const { register, formState: { errors } } = useFormContext<BookingInput>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const combined = [...files, ...Array.from(incoming)].slice(0, MAX_PHOTOS);
    const check = validateFiles(combined);
    if (!check.ok) {
      setFilesError(check.message);
      return;
    }
    setFilesError(null);
    onFilesChange(combined);
  };

  const removeAt = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFilesError(null);
    onFilesChange(next);
  };

  return (
    <div className="space-y-10">
      <div>
        <span className="block font-mono text-[10px] tracking-[0.22em] uppercase text-slate mb-2">
          Photos (optional · up to {MAX_PHOTOS})
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          className={`w-full flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed py-10 transition-colors ${
            dragOver ? "border-ink bg-paper" : "border-line-strong bg-stone-2 hover:border-ink"
          }`}
        >
          <Upload size={20} className="text-slate" />
          <span className="text-ink/80 font-mono text-[11px] tracking-[0.2em] uppercase">
            Drop images here or <span className="text-ink underline">browse</span>
          </span>
          <span className="text-[11px] text-mist">
            JPG, PNG, HEIC · {MAX_PHOTO_BYTES / 1024 / 1024} MB max each
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {filesError && <FieldError msg={filesError} />}

        {files.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {files.map((f, i) => {
              const url = URL.createObjectURL(f);
              return (
                <li
                  key={`${f.name}-${i}`}
                  className="relative aspect-square rounded overflow-hidden border border-line group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={f.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => removeAt(i)}
                    className="absolute top-2 right-2 size-7 rounded-full bg-ink/85 text-stone flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <fieldset className="grid gap-5 md:grid-cols-2">
        <legend className="sr-only">Contact</legend>
        <FormField label="Name" error={errors.name?.message}>
          <input type="text" {...register("name")} className={inputClass} placeholder="Alex Doe" />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className={inputClass} placeholder="you@example.com" />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Phone" error={errors.phone?.message}>
            <input type="tel" {...register("phone")} className={inputClass} placeholder="(207) 555-0123" />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="Notes (optional)" error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={4}
              className={`${inputClass} resize-y`}
              placeholder="Anything Aiden should know — pet hair, ceramic add-on, gate code, etc."
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}
```

- [ ] **Step 5: Replace `src/components/booking-success.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function BookingSuccess({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative rounded-md border border-line-strong bg-paper p-12 md:p-16 text-center"
    >
      <div className="inline-flex size-16 items-center justify-center rounded-full bg-ink text-stone mb-8">
        <Check size={28} strokeWidth={2.5} />
      </div>
      <p className="eyebrow">Booking received</p>
      <h3 className="headline mt-4 text-4xl md:text-5xl text-ink">
        Thanks, {name.split(" ")[0]}.<br />
        <em>We&apos;ll be in touch within 24 hours.</em>
      </h3>
      <p className="mt-6 max-w-md mx-auto text-ink/75 leading-relaxed">
        Aiden reviews each request personally. You&apos;ll get a confirmation email with the quote and a calendar invite once it&apos;s locked in.
      </p>
    </motion.div>
  );
}
```

- [ ] **Step 6: Replace `src/components/booking-section.tsx`**

```tsx
"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { type BookingInput, bookingSchema, SERVICE_SLUGS } from "@/lib/booking-schema";

type BookingFormInput = z.input<typeof bookingSchema>;
import BookingProgress from "@/components/booking-progress";
import BookingStepVehicle from "@/components/booking-step-vehicle";
import BookingStepWhen from "@/components/booking-step-when";
import BookingStepPhotos from "@/components/booking-step-photos";
import BookingSuccess from "@/components/booking-success";
import Reveal from "@/components/reveal";

type Step = 0 | 1 | 2;

const STEP_FIELDS: Record<Step, (keyof BookingFormInput)[]> = {
  0: ["service", "year", "make", "model", "color"],
  1: ["address", "city", "zip", "date", "timeWindow"],
  2: ["name", "email", "phone", "notes"],
};

export default function BookingSection() {
  const methods = useForm<BookingFormInput, unknown, BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: {
      service: "full-detail",
      year: undefined,
      make: "",
      model: "",
      color: "",
      address: "",
      city: "",
      zip: "",
      date: "",
      timeWindow: "morning",
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const [step, setStep] = useState<Step>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [submittedName, setSubmittedName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const match = hash.match(/service=([a-z-]+)/);
    if (!match) return;
    const slug = match[1];
    if ((SERVICE_SLUGS as readonly string[]).includes(slug)) {
      methods.setValue("service", slug as BookingFormInput["service"]);
    }
  }, [methods]);

  const onNext = async () => {
    const ok = await methods.trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => (Math.min(2, s + 1) as Step));
  };
  const onBack = () => setStep((s) => (Math.max(0, s - 1) as Step));

  const onSubmit = methods.handleSubmit(async (data) => {
    setSubmitState("submitting");
    setServerError(null);
    const fd = new FormData();
    (Object.entries(data) as [string, unknown][]).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    files.forEach((f) => fd.append("photos", f));

    try {
      const res = await fetch("/api/booking", { method: "POST", body: fd });
      if (res.ok) {
        setSubmittedName(data.name);
        setSubmitState("ok");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setServerError(body?.error === "validation" ? "Some fields need fixing." : "Couldn't send right now.");
      setSubmitState("error");
    } catch {
      setServerError("Network issue — please try again or call.");
      setSubmitState("error");
    }
  });

  if (submitState === "ok") {
    return (
      <section id="book" className="relative py-32 md:py-44 border-t border-line-strong">
        <div className="mx-auto max-w-3xl px-6">
          <BookingSuccess name={submittedName} />
        </div>
      </section>
    );
  }

  return (
    <section
      id="book"
      aria-labelledby="book-h"
      className="relative py-32 md:py-44 border-t border-line-strong"
    >
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="eyebrow">Book a detail</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="book-h" className="headline mt-6 text-5xl md:text-7xl mb-12 text-ink">
            Tell us about <em>your car.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="rounded-md border border-line-strong bg-stone-2 p-8 md:p-12">
            <BookingProgress step={step} />
            <FormProvider {...methods}>
              <form noValidate onSubmit={onSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === 0 && <BookingStepVehicle />}
                    {step === 1 && <BookingStepWhen />}
                    {step === 2 && (
                      <BookingStepPhotos
                        files={files}
                        onFilesChange={setFiles}
                        filesError={filesError}
                        setFilesError={setFilesError}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {serverError && (
                  <p role="alert" className="mt-6 text-rust text-sm">
                    {serverError}{" "}
                    <a className="underline" href="tel:+12075550100">
                      Or call (207) 555-0100.
                    </a>
                  </p>
                )}

                <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={step === 0 || submitState === "submitting"}
                    className="btn-ghost"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>

                  {step < 2 ? (
                    <button type="button" onClick={onNext} className="btn-primary">
                      Next <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitState === "submitting"}
                      className="btn-primary"
                    >
                      {submitState === "submitting" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Sending…
                        </>
                      ) : (
                        <>Send request <ArrowRight size={16} /></>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </FormProvider>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/booking-section.tsx src/components/booking-progress.tsx src/components/booking-step-vehicle.tsx src/components/booking-step-when.tsx src/components/booking-step-photos.tsx src/components/booking-success.tsx
git commit -m "feat(booking): Granite Coast restyle — 01 → 02 → 03 mono progress, paper inputs, fade-only step transitions"
```

---

## Task 12: FAQ section + item

**Files:**
- Modify: `src/components/faq-section.tsx`
- Modify: `src/components/faq-item.tsx`

- [ ] **Step 1: Replace `src/components/faq-section.tsx`**

```tsx
import Reveal from "@/components/reveal";
import FaqItem from "@/components/faq-item";
import { faq } from "@/data/faq";

export default function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-h"
      className="relative py-32 md:py-44 border-t border-line-strong"
    >
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p className="eyebrow">Common questions</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="faq-h" className="headline mt-6 text-5xl md:text-7xl mb-12 text-ink">
            Things people <em>often ask.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="border-b border-line">
            {faq.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `src/components/faq-item.tsx`**

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 py-6 md:py-8 text-left group"
      >
        <span className="font-display text-2xl md:text-3xl text-ink group-hover:text-moss transition-colors">
          {q}
        </span>
        <span
          aria-hidden
          className={`shrink-0 font-display text-3xl text-ink transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 max-w-2xl text-ink/75 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/faq-section.tsx src/components/faq-item.tsx
git commit -m "feat(faq): Granite Coast restyle — ink question, moss hover, rotating + glyph"
```

---

## Task 13: Delete orphaned components

After Task 1 layout.tsx stopped importing `Cursor` and `SmoothScroll`, leaving those files as dead modules. Delete them now that no other component references them.

**Files:**
- Delete: `src/components/cursor.tsx`
- Delete: `src/components/smooth-scroll.tsx`

- [ ] **Step 1: Confirm no remaining references**

Run (Grep tool, or `grep -rE "from \"@/components/(cursor|smooth-scroll)\"" src/`):
Expected: no results.

- [ ] **Step 2: Delete the files**

```bash
rm src/components/cursor.tsx src/components/smooth-scroll.tsx
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git rm src/components/cursor.tsx src/components/smooth-scroll.tsx
git commit -m "chore: delete orphaned cursor + smooth-scroll components"
```

---

## Task 14: Remove unused npm dependencies

By this point, no source file imports `gsap`, `lenis`, `@theatre/*`, `@react-three/*`, `three`, or `@types/three`. Prune them and rerun install so `package-lock.json` and `node_modules` are consistent.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (regenerated by npm)

- [ ] **Step 1: Verify nothing imports the deps to be removed**

Run (Grep tool on each):
- `from "gsap"` — expected: no results
- `from "lenis"` — expected: no results
- `from "@theatre/` — expected: no results
- `from "@react-three/` — expected: no results
- `from "three"` — expected: no results

If any result appears, stop and fix the importing file before continuing.

- [ ] **Step 2: Remove deps via npm**

```bash
npm uninstall gsap lenis @theatre/core @theatre/studio @react-three/fiber @react-three/drei three @types/three
```

Expected: npm prints "removed N packages" and writes a new `package-lock.json`. The remaining `dependencies` block in `package.json` should be:

```json
"dependencies": {
  "@hookform/resolvers": "^5.4.0",
  "framer-motion": "^12.40.0",
  "lucide-react": "^1.16.0",
  "next": "16.2.6",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "react-hook-form": "^7.76.1",
  "resend": "^6.12.4",
  "zod": "^4.4.3"
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both succeed with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): drop three, @react-three/*, @theatre/*, gsap, lenis — unused after redesign"
```

---

## Task 15: Verification — build + visual smoke

This task is the gate. The visual look has been broken between Task 1 and Task 12; here we confirm everything resolved.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds. Compare First Load JS to the previous build (before this plan): expect a drop on the `/` route in the order of 300–500 KB raw (gzipped figures roughly proportional) thanks to dropping `three` + `@react-three/*` + `@theatre/*` + `gsap` + `lenis`. Note the actual delta in the commit message of Step 6 if anything was fixed.

- [ ] **Step 3: Start dev server**

If a dev server is already running on :3000, reuse it. Otherwise:

```bash
npm run dev
```

- [ ] **Step 4: Visual smoke via Chrome DevTools MCP**

For each step below, take a screenshot and check console for errors. Use the Chrome DevTools MCP `take_screenshot` + `list_console_messages` tools. Navigate to `http://localhost:3000` and:

1. Hero: stone-overlaid Maine photo loads, headline in IBM Plex Serif italic-moss, stone-colored buttons readable, no `<canvas>` element exists in the section
2. Scroll to Story: ink type on stone, moss underline reveals
3. Scroll to Services: 5 paper cards, hover one — card rises, arrow rotates to up-right, no glow
4. Scroll to Process: vertical numbered timeline, no horizontal scroll, no `pin-spacer` element in the DOM
5. Scroll to Gallery: before/after handle is an ink circle with grip icon, "drag to compare" mono caption appears, drag once → caption fades
6. Scroll to Testimonials: 3-column static grid, large slate quote glyphs, mono attributions
7. Scroll to Booking: paper inputs, mono `01 / 02 / 03` progress, click Next twice → fade-only transitions
8. Scroll to FAQ: click an item → `+` rotates 45° to `×`, content animates open
9. Console: zero errors. (Warnings about `THREE.Clock` should be gone since `three` is uninstalled.)

- [ ] **Step 5: Mobile breakpoint smoke**

Use Chrome DevTools MCP `resize_page` to 375×812. Reload. Walk the same flow. Confirm:
- Nav drawer opens with hamburger and ink links on stone
- Process timeline stays vertical, numerals visible
- Testimonials collapses to one column
- Booking inputs stack
- No horizontal overflow

- [ ] **Step 6: Commit any fixes**

If Steps 4–5 surfaced issues that required edits to fix, commit them with a clear message:

```bash
git add <fixed-files>
git commit -m "fix(redesign): <one-line description of fix>"
```

If nothing needed fixing, skip the commit and report verification clean.

- [ ] **Step 7: Final report**

Report to the user:
- Final `npm run build` First Load JS for `/` (before redesign vs after)
- Any deviations from the spec made during execution and why
- Whether OS reduced-motion was active during the smoke test (animations skipped) or not

---

## Plan summary

15 tasks. After completion the site:
- Uses Granite Coast palette (warm stone surfaces, ink type, slate + moss + rust accents)
- Uses IBM Plex Serif / Sans / Mono across all display, body, and accent text
- Replaces the chrome-particle hero with a full-bleed Maine photograph
- Replaces the GSAP-pinned horizontal Process with a vertical numbered timeline
- Replaces the dual marquee Testimonials with a static 3-column grid
- Drops cinematic motion machinery: `three`, `@react-three/*`, `@theatre/*`, `gsap`, `lenis`, magnetic cursor, char-by-char reveals — a measurable bundle-size win
- Retains all functional behavior: booking wizard, Resend email, data-file content model, accessibility, reduced-motion compliance
