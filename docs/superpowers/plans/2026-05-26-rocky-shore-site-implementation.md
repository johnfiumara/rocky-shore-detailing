# Rocky Shore Detailing — Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cinematic, scroll-driven single-page site for Rocky Shore Detailing (Maine statewide mobile auto detailing) with a 3-step booking form that emails submissions (including up to 5 photos) to `fumarajohn8@gmail.com`.

**Architecture:** Next.js 16 App Router single page composed of nine independently-rendered React components, driven by data files in `src/data/*.ts` so the business owner can edit content without touching code. A `/api/booking` Route Handler validates FormData with Zod and sends a structured HTML email via Resend with photo attachments. Animation is layered: Lenis for smooth scroll, GSAP/ScrollTrigger for scroll-pinned choreography, Framer Motion for in-view reveals and step transitions, Three.js (via R3F) for the hero particle scene, Theatre.js for the hero intro timeline.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · GSAP 3 + ScrollTrigger · Framer Motion 12 · @react-three/fiber 9 + drei 10 · @theatre/core 0.7 · Lenis 1.3 · react-hook-form 7 + zod 4 · Resend 6 · lucide-react 1 · next/font (Fraunces / Instrument Sans / JetBrains Mono).

**Spec:** [docs/superpowers/specs/2026-05-26-rocky-shore-site-design.md](../specs/2026-05-26-rocky-shore-site-design.md)

**No automated tests** — per spec §11, this is a marketing site; verification is `next build`, `next lint`, Lighthouse audit, and a manual smoke walkthrough. Each task ends with a visual or compile verification step.

---

## Status as of 2026-05-29

**Fully shipped.** Every task in this plan has a matching commit in `git log`:

| Task | Commit |
|---|---|
| 1 (data files) | `98b2567 docs: add site implementation plan` (data committed alongside) |
| 4 (smooth-scroll) | `8a8177a feat(motion): magnetic cursor` (Lenis bundled) |
| 5 (cursor) | `8a8177a feat(motion): magnetic cursor` |
| 6 (Reveal) | `1b1524d feat(motion): Reveal wrapper for scroll-in animations` |
| 7 (marquee) | `7a08e9d feat(motion): infinite marquee primitive` |
| 8 (Navigation) | `1691f65 feat(nav): sticky scroll-aware navigation` |
| 9 (Footer) | `57e353c feat(chrome): footer with contact, hours` |
| 10 (Story) | `33a6335 feat(story): Studio narrative section` |
| 11 (Services) | `a539e47 feat(services): service card with hover glow` |
| 12 (Testimonials) | `45e1735 feat(testimonials): two-row dual-direction marquee` |
| 13 (FAQ) | `4f7db00 feat(faq): accordion section` |
| 14 (Before/after + gallery) | `da8c08e feat(gallery): draggable before/after slider + 6-tile grid` *(see note below)* |
| 15 (Process) | `b5485b9 feat(process): pinned horizontal-scroll process section` |
| 16 (Hero particles) | `7972b3b feat(hero): instanced chrome-particle field` |
| 17 (Hero canvas) | `ddc7203 feat(hero): R3F canvas root with static fallback` |
| 18 (Hero Theatre) | `9dce6ca feat(hero): orchestration with GSAP char reveal + Theatre.js sheet` |
| 19 (Booking progress + success) | `83de6da feat(booking): wizard progress indicator` |
| 20 (Booking step 1) | `416c6be feat(booking): step 1 — service + vehicle fields` |
| 21 (Booking step 2) | `90563d6 feat(booking): step 2 — address + date + time window` |
| 22 (Booking step 3) | `abccdf8 feat(booking): step 3 — photo dropzone + contact fields` |
| 23 (Booking orchestrator) | `27c2558 feat(booking): wizard orchestrator with step validation` |
| 24 (Compose page.tsx) | `b87d36e feat(page): compose story → faq sections` + `b3b60d3 feat(page): swap hero to R3F/Theatre.js Hero component` |
| 25 (MotionConfig wrap) | `4527e51 feat(motion): MotionConfig reducedMotion=user wraps the app` |
| 26 (README) | `d21b44f docs: rewrite README with setup, env vars, and content-editing guide` |

**Subsequent change not in this plan:** `gallery-section.tsx` was reworked again on 2026-05-29 into an Embla carousel (BeforeAfter as slide 1, six grid images as slides 2-7). The 3-column tiled grid Task 14 Step 2 specifies no longer exists. `before-after.tsx` itself is unchanged from Task 14.

All checkboxes below were checked off in bulk against this commit map. If you find a checked step that no longer matches the current code (e.g., because the grounded redesign or another later plan overwrote that file), trust the code over the checkbox.

---

## Already complete (do not redo)

- Next.js 16 App Router scaffolded in repo root with TypeScript, Tailwind v4, Turbopack, `src/` dir, `@/*` import alias.
- All dependencies installed (see `package.json`).
- `src/app/globals.css` — Coastal Luxury theme tokens, grain/vignette overlays, motion-reduce rules, button utilities.
- `src/app/layout.tsx` — fonts wired (Fraunces / Instrument Sans / JetBrains Mono), grain+vignette body classes, `<SmoothScroll>`/`<Cursor>`/`<Navigation>`/`<Footer>` shell (those components do not yet exist — Tasks 4, 5, 9, 10 create them).
- Empty directories created: `src/components/`, `src/components/hero/`, `src/lib/`, `src/data/`, `src/app/api/booking/`.
- Design spec committed in `docs/superpowers/specs/`.

If `src/components/hero/` does not exist yet, create it with `mkdir -p src/components/hero` before Task 14.

---

## Task 1: Data files

**Files:**
- Create: `src/data/services.ts`
- Create: `src/data/process-steps.ts`
- Create: `src/data/testimonials.ts`
- Create: `src/data/faq.ts`
- Create: `src/data/gallery.ts`

- [x] **Step 1: Create `src/data/services.ts`**

```ts
export type Service = {
  slug: string;
  eyebrow: string;
  title: string;
  tagline: string;
  inclusions: string[];
  priceFrom?: string;
};

export const services: Service[] = [
  {
    slug: "express-wash",
    eyebrow: "01 · Maintenance",
    title: "Express Wash",
    tagline: "A quick, careful reset between full details — never a drive-through.",
    inclusions: [
      "Two-bucket hand wash",
      "Wheel & tire cleaning",
      "Spray sealant top-up",
      "Glass cleaned inside & out",
      "Door jambs wiped",
    ],
  },
  {
    slug: "full-detail",
    eyebrow: "02 · Signature",
    title: "Full Detail",
    tagline: "The complete reset — outside and in.",
    inclusions: [
      "Full decontamination wash",
      "Iron remover + clay treatment",
      "Single-stage polish",
      "Interior deep clean & vacuum",
      "Leather conditioned, plastics dressed",
    ],
  },
  {
    slug: "paint-correction",
    eyebrow: "03 · Restoration",
    title: "Paint Correction",
    tagline: "Multi-stage compounding to remove swirl marks, light scratches, and oxidation.",
    inclusions: [
      "Paint depth measurement",
      "Two- or three-stage cut & polish",
      "Defect removal up to 80–95%",
      "Finishing polish for clarity",
      "Sealant or coating prep",
    ],
  },
  {
    slug: "ceramic-coating",
    eyebrow: "04 · Protection",
    title: "Ceramic Coating",
    tagline: "Long-term gloss and chemical resistance — measured in years, not weeks.",
    inclusions: [
      "Paint correction prep",
      "Panel-wipe & IPA prep",
      "Professional-grade ceramic application",
      "12-hour cure window",
      "Aftercare kit & instructions",
    ],
  },
  {
    slug: "interior-restoration",
    eyebrow: "05 · Interior",
    title: "Interior Restoration",
    tagline: "Pet hair, spills, scent, stains — handled.",
    inclusions: [
      "Full vacuum incl. seat rails",
      "Hot-water extraction on fabrics",
      "Leather clean + condition",
      "Headliner & vents detailed",
      "Odor neutralizer treatment",
    ],
  },
];
```

- [x] **Step 2: Create `src/data/process-steps.ts`**

```ts
export type ProcessStep = {
  number: string;
  title: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Arrive at your driveway",
    body: "Mobile setup — water, power, and product all come with the truck. No drop-off, no shop visit.",
  },
  {
    number: "02",
    title: "Inspect & document",
    body: "Walk-around with photos and paint readings so we're aligned on goals before a single mitt touches metal.",
  },
  {
    number: "03",
    title: "Wash & decontaminate",
    body: "Foam pre-wash, two-bucket hand wash, iron-x, clay if needed. Bonded contaminants gone before polishing starts.",
  },
  {
    number: "04",
    title: "Polish & protect",
    body: "Correction passes if you booked them, finishing polish, then sealant or ceramic coating cured to spec.",
  },
  {
    number: "05",
    title: "Final reveal",
    body: "Side-by-side photos, care instructions, and a receipt. You drive off looking like you just bought it.",
  },
];
```

- [x] **Step 3: Create `src/data/testimonials.ts`**

```ts
export type Testimonial = {
  quote: string;
  name: string;
  context: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Aiden brought my eight-year-old daily back to dealer-floor condition. Showed up early, worked late, left no streaks.",
    name: "Marcus L.",
    context: "Portland · 2018 Audi A4",
  },
  {
    quote:
      "I've used three detailers since moving to Maine. Rocky Shore is the only one I'll let touch my truck again.",
    name: "Sarah B.",
    context: "Bangor · 2022 F-150",
  },
  {
    quote:
      "Ceramic coat held up through two winters of salt and sand. Worth every penny.",
    name: "Jared K.",
    context: "Camden · Tesla Model 3",
  },
  {
    quote:
      "Pet hair from two labs and a toddler's juice incident — completely gone. I genuinely cried a little.",
    name: "Emily R.",
    context: "Augusta · Honda Pilot",
  },
  {
    quote:
      "Booked him for a paint correction on the wife's surprise birthday gift. She thought we'd bought a new car.",
    name: "Tom V.",
    context: "Kennebunk · Mercedes E300",
  },
  {
    quote:
      "Most thorough detailer I've ever hired. Asked questions. Took photos. Explained every step. Pro.",
    name: "Hannah P.",
    context: "Bar Harbor · Subaru Outback",
  },
];
```

- [x] **Step 4: Create `src/data/faq.ts`**

```ts
export type FaqItem = {
  q: string;
  a: string;
};

export const faq: FaqItem[] = [
  {
    q: "Where do you travel?",
    a: "All of Maine. Within 25 miles of Portland there's no travel fee; beyond that a small mileage charge is added to the quote so you'll always see it up front.",
  },
  {
    q: "What happens if it rains?",
    a: "Light drizzle is fine — we work under a canopy. Heavy rain or thunderstorms get rescheduled to the next available slot at no charge.",
  },
  {
    q: "How long does a typical detail take?",
    a: "Express Wash is about an hour. A Full Detail runs 4–6 hours depending on condition. Paint correction and ceramic coatings are full-day or two-day jobs.",
  },
  {
    q: "Do you warranty ceramic coatings?",
    a: "Yes — coatings carry a manufacturer warranty (typically 3–7 years depending on the product) plus our own workmanship guarantee. Details handed over at completion.",
  },
  {
    q: "How do I pay?",
    a: "Card, Apple Pay, Venmo, or cash. Payment is collected on completion after you've walked around the vehicle.",
  },
  {
    q: "Do you sell gift cards?",
    a: "We do — any dollar amount, no expiration. Email us through the booking form and mention \"gift card\" in the notes.",
  },
];
```

- [x] **Step 5: Create `src/data/gallery.ts`**

```ts
export type GalleryImage = {
  src: string;
  alt: string;
};

export type BeforeAfterPair = {
  before: GalleryImage;
  after: GalleryImage;
  label: string;
};

// Placeholder Unsplash images — replace with real before/after shots in /public/gallery/
export const beforeAfter: BeforeAfterPair = {
  label: "Single-stage paint correction · 2017 BMW M2",
  before: {
    src: "https://images.unsplash.com/photo-1547038577-da80abbc4f19?w=1600&q=80",
    alt: "Car with swirl marks and oxidation before correction",
  },
  after: {
    src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80",
    alt: "Same car after paint correction, deep gloss restored",
  },
};

export const galleryGrid: GalleryImage[] = [
  { src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80", alt: "Detailed black sports car at sunset" },
  { src: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80", alt: "Microfiber close-up on hood reflection" },
  { src: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=80", alt: "Wheel and brake caliper detail" },
  { src: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80", alt: "Side profile of polished sedan" },
  { src: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80", alt: "Foam-covered hood during wash" },
  { src: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=80", alt: "Interior dashboard, freshly conditioned" },
];
```

- [x] **Step 6: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 7: Commit**

```bash
git add src/data/
git commit -m "feat(data): add services, process, testimonials, FAQ, gallery"
```

---

## Task 2: Booking Zod schema

**Files:**
- Create: `src/lib/booking-schema.ts`

- [x] **Step 1: Create `src/lib/booking-schema.ts`**

```ts
import { z } from "zod";

export const SERVICE_SLUGS = [
  "express-wash",
  "full-detail",
  "paint-correction",
  "ceramic-coating",
  "interior-restoration",
] as const;

export const TIME_WINDOWS = [
  "morning",
  "afternoon",
  "evening",
] as const;

export const TIME_WINDOW_LABELS: Record<(typeof TIME_WINDOWS)[number], string> = {
  morning: "Morning (8–11am)",
  afternoon: "Afternoon (11am–3pm)",
  evening: "Evening (3–6pm)",
};

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const bookingSchema = z.object({
  service: z.enum(SERVICE_SLUGS, { message: "Select a service" }),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(2030, "Year must be 2030 or earlier"),
  make: z.string().trim().min(1, "Make is required").max(40),
  model: z.string().trim().min(1, "Model is required").max(40),
  color: z.string().trim().min(1, "Color is required").max(30),

  address: z.string().trim().min(5, "Address is required").max(120),
  city: z.string().trim().min(1, "City is required").max(60),
  zip: z.string().trim().regex(/^\d{5}$/, "Use a 5-digit ZIP"),
  date: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Pick a valid date")
    .refine((s) => new Date(s) >= todayStart(), "Date must be today or later"),
  timeWindow: z.enum(TIME_WINDOWS, { message: "Pick a time window" }),

  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Use a valid email").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(20)
    .regex(/^[+()\-.\s\d]+$/, "Use digits, spaces, and -.() only"),
  notes: z.string().trim().max(1000).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export function validateFiles(files: File[]):
  | { ok: true }
  | { ok: false; message: string } {
  if (files.length > MAX_PHOTOS) {
    return { ok: false, message: `Up to ${MAX_PHOTOS} photos only.` };
  }
  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      return { ok: false, message: `"${f.name}" isn't an image.` };
    }
    if (f.size > MAX_PHOTO_BYTES) {
      return { ok: false, message: `"${f.name}" is over ${MAX_PHOTO_BYTES / 1024 / 1024}MB.` };
    }
  }
  return { ok: true };
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/lib/booking-schema.ts
git commit -m "feat(booking): add Zod schema + file validators"
```

---

## Task 3: Email sender + API route

**Files:**
- Create: `src/lib/send-booking-email.ts`
- Create: `src/app/api/booking/route.ts`
- Create: `.env.example`

- [x] **Step 1: Create `src/lib/send-booking-email.ts`**

```ts
import { Resend } from "resend";
import {
  type BookingInput,
  TIME_WINDOW_LABELS,
} from "@/lib/booking-schema";

type SendInput = {
  data: BookingInput;
  files: File[];
};

const SERVICE_LABELS: Record<BookingInput["service"], string> = {
  "express-wash": "Express Wash",
  "full-detail": "Full Detail",
  "paint-correction": "Paint Correction",
  "ceramic-coating": "Ceramic Coating",
  "interior-restoration": "Interior Restoration",
};

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 16px 8px 0;color:#8a8578;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;width:160px;">${label}</td>
    <td style="padding:8px 0;color:#f4efe6;font-size:15px;">${escapeHtml(value)}</td>
  </tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(d: BookingInput, fileCount: number): string {
  const dateLabel = new Date(d.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0b0d;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 28px;color:#f4efe6;">
    <p style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a36b;margin:0 0 8px;">Rocky Shore Detailing</p>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.1;margin:0 0 24px;">New booking request</h1>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(244,239,230,0.12);border-bottom:1px solid rgba(244,239,230,0.12);">
      ${row("Service", SERVICE_LABELS[d.service])}
      ${row("Date", dateLabel)}
      ${row("Time window", TIME_WINDOW_LABELS[d.timeWindow])}
      ${row("Vehicle", `${d.year} ${d.make} ${d.model} (${d.color})`)}
      ${row("Address", `${d.address}, ${d.city}, ME ${d.zip}`)}
      ${row("Customer", `${d.name}`)}
      ${row("Email", d.email)}
      ${row("Phone", d.phone)}
      ${d.notes ? row("Notes", d.notes) : ""}
      ${row("Photos", fileCount ? `${fileCount} attached` : "none")}
    </table>
    <p style="font-size:12px;color:#8a8578;margin-top:24px;">Reply directly to this email to respond to ${escapeHtml(d.name)}.</p>
  </div>
</body></html>`;
}

export async function sendBookingEmail({ data, files }: SendInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const to = process.env.BOOKING_TO_EMAIL ?? "fumarajohn8@gmail.com";
  const from = process.env.BOOKING_FROM_EMAIL ?? "Rocky Shore Bookings <onboarding@resend.dev>";

  const resend = new Resend(apiKey);
  const attachments = await Promise.all(
    files.map(async (f) => ({
      filename: f.name,
      content: Buffer.from(await f.arrayBuffer()),
    })),
  );

  const subject = `New booking — ${SERVICE_LABELS[data.service]} · ${data.name} · ${data.date}`;

  const result = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject,
    html: buildHtml(data, files.length),
    attachments,
  });

  if (result.error) {
    throw new Error(`Resend failed: ${result.error.message}`);
  }
}
```

- [x] **Step 2: Create `src/app/api/booking/route.ts`**

```ts
import { NextResponse } from "next/server";
import { bookingSchema, validateFiles } from "@/lib/booking-schema";
import { sendBookingEmail } from "@/lib/send-booking-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

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

  const files = form.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  const fileCheck = validateFiles(files);
  if (!fileCheck.ok) {
    return NextResponse.json(
      { error: "validation", fieldErrors: { photos: [fileCheck.message] } },
      { status: 400 },
    );
  }

  try {
    await sendBookingEmail({ data: parsed.data, files });
  } catch (err) {
    console.error("[booking] send failed", err);
    return NextResponse.json({ error: "send-failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
```

- [x] **Step 3: Create `.env.example`**

```
# Resend API key — sign up at https://resend.com (free tier covers 3,000 emails/month)
# Required for the booking form to actually send mail.
RESEND_API_KEY=

# Where booking submissions are delivered. Defaults to fumarajohn8@gmail.com if unset.
BOOKING_TO_EMAIL=fumarajohn8@gmail.com

# From address. Until you verify your own domain at https://resend.com/domains,
# leave this as Resend's testing sender below.
BOOKING_FROM_EMAIL=Rocky Shore Bookings <onboarding@resend.dev>
```

- [x] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 5: Commit**

```bash
git add src/lib/send-booking-email.ts src/app/api/booking/route.ts .env.example
git commit -m "feat(booking): Resend email sender + /api/booking route handler"
```

---

## Task 4: Smooth-scroll provider (Lenis)

**Files:**
- Create: `src/components/smooth-scroll.tsx`

- [x] **Step 1: Create `src/components/smooth-scroll.tsx`**

```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/smooth-scroll.tsx
git commit -m "feat(motion): Lenis smooth-scroll provider, gated by prefers-reduced-motion"
```

---

## Task 5: Magnetic cursor

**Files:**
- Create: `src/components/cursor.tsx`

- [x] **Step 1: Create `src/components/cursor.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const noPref = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    setEnabled(fine && noPref);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let tx = rx;
    let ty = ry;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }
    };
    const onOver = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLElement) {
        setHover(Boolean(t.closest("a, button, [role=button], input, textarea, label, [data-cursor]")));
      }
    };
    const tick = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          background: "var(--rs-bronze-glow)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 90,
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: hover ? 56 : 32,
          height: hover ? 56 : 32,
          border: "1px solid var(--rs-bronze)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 89,
          transition: "width 220ms ease, height 220ms ease, background 220ms ease",
          background: hover ? "rgba(201,163,107,0.08)" : "transparent",
        }}
      />
    </>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/cursor.tsx
git commit -m "feat(motion): magnetic cursor, pointer:fine + no-reduced-motion only"
```

---

## Task 6: Reveal wrapper

**Files:**
- Create: `src/components/reveal.tsx`

- [x] **Step 1: Create `src/components/reveal.tsx`**

```tsx
"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "h2" | "h3" | "span";
};

const variants: Variants = {
  hidden: (custom: { y: number }) => ({ opacity: 0, y: custom.y }),
  show: { opacity: 1, y: 0 },
};

export default function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: Props) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      custom={{ y }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.22, 0.7, 0.2, 1], delay }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/reveal.tsx
git commit -m "feat(motion): Reveal wrapper for scroll-in animations"
```

---

## Task 7: Marquee primitive

**Files:**
- Create: `src/components/marquee.tsx`

- [x] **Step 1: Create `src/components/marquee.tsx`**

```tsx
import type { ReactNode } from "react";

export default function Marquee({
  children,
  direction = "left",
  className = "",
}: {
  children: ReactNode;
  direction?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={`rs-marquee overflow-hidden ${className}`}>
      <div
        className="rs-marquee-track flex w-max gap-12"
        style={{ animationDirection: direction === "right" ? "reverse" : "normal" }}
      >
        <div className="flex gap-12 shrink-0">{children}</div>
        <div className="flex gap-12 shrink-0" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/marquee.tsx
git commit -m "feat(motion): infinite marquee primitive with pause-on-hover"
```

---

## Task 8: Navigation

**Files:**
- Create: `src/components/navigation.tsx`

- [x] **Step 1: Create `src/components/navigation.tsx`**

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
        className={`mx-auto max-w-7xl px-6 py-4 flex items-center justify-between transition-colors duration-500 ${
          scrolled || open ? "backdrop-blur-md bg-ink/70 border-b border-line" : ""
        }`}
      >
        <a href="#top" className="flex items-baseline gap-2 font-display text-bone text-xl tracking-tight">
          <span>Rocky Shore</span>
          <span className="text-bronze italic font-light">Detailing</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-bone-dim hover:text-bronze transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#book" className="hidden md:inline-flex btn-primary text-sm">Book a Detail</a>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden text-bone p-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-ink/95 backdrop-blur-md border-b border-line px-6 py-8 flex flex-col gap-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-bone hover:text-bronze transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a href="#book" onClick={() => setOpen(false)} className="btn-primary self-start mt-4">
            Book a Detail
          </a>
        </div>
      )}
    </header>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/navigation.tsx
git commit -m "feat(nav): sticky scroll-aware navigation with mobile drawer"
```

---

## Task 9: Footer

**Files:**
- Create: `src/components/footer.tsx`

- [x] **Step 1: Create `src/components/footer.tsx`**

```tsx
import { Mail, Phone, Instagram } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="eyebrow">Rocky Shore Detailing</p>
            <h2 className="headline mt-4 text-5xl md:text-7xl">
              Hand-detailed,<br />
              <em>statewide.</em>
            </h2>
            <p className="mt-6 max-w-md text-bone-dim leading-relaxed">
              Mobile auto detailing by Aiden Quinn. From Kittery to Madawaska — we bring the studio to your driveway.
            </p>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 gap-10">
            <div>
              <p className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-mist mb-4">Contact</p>
              <ul className="space-y-3 text-bone">
                <li className="flex items-center gap-3">
                  <Phone size={14} className="text-bronze" />
                  <a href="tel:+12075550100" className="hover:text-bronze-glow transition-colors">(207) 555-0100</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={14} className="text-bronze" />
                  <a href="mailto:hello@rockyshoredetailing.com" className="hover:text-bronze-glow transition-colors">hello@rockyshoredetailing.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <Instagram size={14} className="text-bronze" />
                  <a href="https://instagram.com" className="hover:text-bronze-glow transition-colors">@rockyshore</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-mist mb-4">Hours</p>
              <ul className="space-y-2 text-bone-dim text-sm">
                <li>Mon – Fri · 8a – 6p</li>
                <li>Saturday · 9a – 4p</li>
                <li>Sunday · by appointment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-mist text-xs font-mono-accent tracking-wider uppercase">
          <span>© {year} Rocky Shore Detailing · Statewide Maine</span>
          <span>Built with care</span>
        </div>
      </div>
    </footer>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/footer.tsx
git commit -m "feat(chrome): footer with contact, hours, and statewide tagline"
```

---

## Task 10: Story section

**Files:**
- Create: `src/components/story-section.tsx`

- [x] **Step 1: Create `src/components/story-section.tsx`**

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
            <h2 id="story-h" className="headline mt-6 text-5xl md:text-7xl">
              An Aiden Quinn<br />studio,<br /><em>on wheels.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-10 h-px w-24 bg-bronze" />
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7 self-end space-y-6 text-bone-dim leading-relaxed text-lg">
          <Reveal delay={0.1}>
            <p>
              Rocky Shore started in a single garage in Portland, the kind of operation where a 2-stage polish meant
              missing dinner. Today it's a fully-equipped mobile studio that shows up at your driveway with water,
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
            <p className="font-mono-accent text-[11px] tracking-[0.22em] uppercase text-bronze">
              Detailing Maine · Kittery to Madawaska · 2018 →
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/story-section.tsx
git commit -m "feat(section): story / about Aiden"
```

---

## Task 11: Service card + services section

**Files:**
- Create: `src/components/service-card.tsx`
- Create: `src/components/services-section.tsx`

- [x] **Step 1: Create `src/components/service-card.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <motion.a
      href={`#book?service=${service.slug}`}
      onClick={(e) => {
        // honor hash for pre-select but also smooth-scroll
        e.preventDefault();
        history.replaceState(null, "", `#book?service=${service.slug}`);
        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="group relative flex flex-col p-8 rounded-2xl border border-line bg-charcoal/40 backdrop-blur overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(60% 80% at 80% 0%, rgba(201,163,107,0.16), transparent 70%)",
        }}
      />
      <p className="eyebrow relative">{service.eyebrow}</p>
      <h3 className="font-display text-3xl md:text-4xl mt-3 text-bone relative">{service.title}</h3>
      <p className="mt-4 text-bone-dim leading-relaxed relative">{service.tagline}</p>
      <ul className="mt-6 space-y-2 text-sm text-bone-dim relative">
        {service.inclusions.map((inc) => (
          <li key={inc} className="flex items-start gap-3">
            <span className="mt-2 size-1 rounded-full bg-bronze shrink-0" />
            <span>{inc}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 pt-6 border-t border-line flex items-center justify-between relative">
        <span className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-bronze">
          {service.priceFrom ? `From ${service.priceFrom}` : "Request a quote"}
        </span>
        <ArrowUpRight size={18} className="text-bronze group-hover:rotate-12 transition-transform" />
      </div>
    </motion.a>
  );
}
```

- [x] **Step 2: Create `src/components/services-section.tsx`**

```tsx
import Reveal from "@/components/reveal";
import ServiceCard from "@/components/service-card";
import { services } from "@/data/services";

export default function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16 md:mb-24">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">What we offer</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="services-h" className="headline mt-6 text-5xl md:text-7xl">
                Five services.<br /><em>One pair of hands.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-bone-dim leading-relaxed">
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

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/components/service-card.tsx src/components/services-section.tsx
git commit -m "feat(section): services grid with hover-glow cards"
```

---

## Task 12: Testimonials marquee

**Files:**
- Create: `src/components/testimonials-section.tsx`

- [x] **Step 1: Create `src/components/testimonials-section.tsx`**

```tsx
import Marquee from "@/components/marquee";
import Reveal from "@/components/reveal";
import { testimonials } from "@/data/testimonials";

function Quote({ quote, name, context }: { quote: string; name: string; context: string }) {
  return (
    <figure className="w-[420px] md:w-[480px] shrink-0 rounded-2xl border border-line bg-charcoal/40 backdrop-blur p-8">
      <blockquote className="font-display italic text-2xl text-bone leading-snug">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-baseline gap-3 font-mono-accent text-[11px] tracking-[0.2em] uppercase">
        <span className="text-bronze">{name}</span>
        <span className="text-mist">·</span>
        <span className="text-bone-dim">{context}</span>
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSection() {
  // Split into two rows for opposite-direction marquees
  const rowA = testimonials.slice(0, 3);
  const rowB = testimonials.slice(3);
  return (
    <section aria-labelledby="testimonials-h" className="relative py-32 md:py-44 border-t border-line overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-16">
        <Reveal>
          <p className="eyebrow">In their words</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="testimonials-h" className="headline mt-6 text-5xl md:text-7xl">
            The work, <em>reviewed.</em>
          </h2>
        </Reveal>
      </div>

      <div className="space-y-8">
        <Marquee direction="left">
          {rowA.map((t, i) => <Quote key={`a-${i}`} {...t} />)}
        </Marquee>
        <Marquee direction="right">
          {rowB.map((t, i) => <Quote key={`b-${i}`} {...t} />)}
        </Marquee>
      </div>
    </section>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/testimonials-section.tsx
git commit -m "feat(section): two-row testimonials marquee"
```

---

## Task 13: FAQ accordion

**Files:**
- Create: `src/components/faq-item.tsx`
- Create: `src/components/faq-section.tsx`

- [x] **Step 1: Create `src/components/faq-item.tsx`**

```tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";

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
        <span className="font-display text-2xl md:text-3xl text-bone group-hover:text-bronze-glow transition-colors">
          {q}
        </span>
        <span className="shrink-0 rounded-full border border-line p-2 text-bronze group-hover:border-bronze transition-colors">
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 max-w-2xl text-bone-dim leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [x] **Step 2: Create `src/components/faq-section.tsx`**

```tsx
import Reveal from "@/components/reveal";
import FaqItem from "@/components/faq-item";
import { faq } from "@/data/faq";

export default function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p className="eyebrow">Common questions</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="faq-h" className="headline mt-6 text-5xl md:text-7xl mb-12">
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

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/components/faq-item.tsx src/components/faq-section.tsx
git commit -m "feat(section): FAQ accordion with motion height animation"
```

---

## Task 14: Before/after slider + gallery section

**Files:**
- Create: `src/components/before-after.tsx`
- Create: `src/components/gallery-section.tsx`

- [x] **Step 1: Create `src/components/before-after.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { BeforeAfterPair } from "@/data/gallery";

export default function BeforeAfter({ pair }: { pair: BeforeAfterPair }) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, ratio)));
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-line select-none cursor-ew-resize"
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
        priority={false}
      />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <Image
          src={pair.before.src}
          alt={pair.before.alt}
          fill
          sizes="(min-width: 768px) 75vw, 100vw"
          className="object-cover"
        />
      </div>
      <div
        className="absolute inset-y-0"
        style={{ left: `${pos}%`, transform: "translateX(-1px)" }}
      >
        <div className="absolute inset-y-0 w-px bg-bone" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-12 rounded-full bg-bone text-ink flex items-center justify-center shadow-2xl pointer-events-none">
          <span className="text-xs font-mono-accent tracking-wider">‹ ›</span>
        </div>
      </div>
      <div className="absolute top-4 left-4 font-mono-accent text-[10px] tracking-[0.2em] uppercase bg-ink/70 backdrop-blur px-3 py-1.5 rounded-full text-bone">
        Before
      </div>
      <div className="absolute top-4 right-4 font-mono-accent text-[10px] tracking-[0.2em] uppercase bg-ink/70 backdrop-blur px-3 py-1.5 rounded-full text-bronze">
        After
      </div>
    </div>
  );
}
```

- [x] **Step 2: Create `src/components/gallery-section.tsx`**

```tsx
import Image from "next/image";
import Reveal from "@/components/reveal";
import BeforeAfter from "@/components/before-after";
import { beforeAfter, galleryGrid } from "@/data/gallery";

export default function GallerySection() {
  return (
    <section id="gallery" aria-labelledby="gallery-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">Selected work</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="gallery-h" className="headline mt-6 text-5xl md:text-7xl">
                Drag the line.<br /><em>See the difference.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-bone-dim leading-relaxed">{beforeAfter.label}</p>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <BeforeAfter pair={beforeAfter} />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 mt-16">
          {galleryGrid.map((img, i) => (
            <Reveal key={img.src} delay={i * 0.05}>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line group">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 30vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [x] **Step 3: Configure `next.config.ts` to allow Unsplash domain**

Open `next.config.ts` and replace its contents with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
```

- [x] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 5: Commit**

```bash
git add src/components/before-after.tsx src/components/gallery-section.tsx next.config.ts
git commit -m "feat(section): gallery — draggable before/after slider + grid"
```

---

## Task 15: Process section (GSAP pinned horizontal scroll)

**Files:**
- Create: `src/components/process-section.tsx`

- [x] **Step 1: Create `src/components/process-section.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { processSteps } from "@/data/process-steps";

export default function ProcessSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) return; // mobile: stack vertically, no pin
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!section || !track) return;

    const distance = () => track.scrollWidth - window.innerWidth;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progress) progress.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-labelledby="process-h"
      className="relative border-t border-line overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 pt-32 md:pt-44 pb-12">
        <p className="eyebrow">The process</p>
        <h2 id="process-h" className="headline mt-6 text-5xl md:text-7xl max-w-3xl">
          From driveway<br />to <em>final reveal.</em>
        </h2>
      </div>

      <div className="hidden md:block relative">
        <div className="absolute top-12 left-6 right-6 h-px bg-line z-10">
          <div
            ref={progressRef}
            className="h-full bg-bronze origin-left scale-x-0"
            style={{ transformOrigin: "left center" }}
          />
        </div>
        <div ref={trackRef} className="flex gap-12 px-6 pb-40 pt-24 w-max">
          {processSteps.map((step) => (
            <article
              key={step.number}
              className="w-[70vw] max-w-[640px] shrink-0 rounded-2xl border border-line bg-charcoal/40 backdrop-blur p-10 md:p-14"
            >
              <p className="font-display text-[8rem] leading-none text-bronze opacity-90 select-none">
                {step.number}
              </p>
              <h3 className="font-display text-4xl md:text-5xl mt-6 text-bone">{step.title}</h3>
              <p className="mt-6 text-bone-dim leading-relaxed text-lg">{step.body}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Mobile fallback: vertical stack */}
      <div className="md:hidden px-6 pb-24 space-y-10">
        {processSteps.map((step) => (
          <article key={step.number} className="rounded-2xl border border-line bg-charcoal/40 p-8">
            <p className="font-display text-7xl leading-none text-bronze">{step.number}</p>
            <h3 className="font-display text-3xl mt-4 text-bone">{step.title}</h3>
            <p className="mt-4 text-bone-dim leading-relaxed">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/process-section.tsx
git commit -m "feat(section): pinned horizontal-scroll process section (GSAP ScrollTrigger)"
```

---

## Task 16: Hero — chrome particle scene

**Files:**
- Create: `src/components/hero/chrome-particles.tsx`

- [x] **Step 1: Create the hero subdirectory if missing**

Run: `mkdir -p src/components/hero`

- [x] **Step 2: Create `src/components/hero/chrome-particles.tsx`**

```tsx
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800;

export default function ChromeParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const arr: { pos: THREE.Vector3; speed: number; offset: number; scale: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 12,
        ),
        speed: 0.04 + Math.random() * 0.08,
        offset: Math.random() * Math.PI * 2,
        scale: 0.018 + Math.random() * 0.04,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      const y = p.pos.y + Math.sin(t * p.speed + p.offset) * 0.4;
      const x = p.pos.x + Math.cos(t * p.speed * 0.6 + p.offset) * 0.25;
      dummy.position.set(x, y, p.pos.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color="#e9c894"
        metalness={1}
        roughness={0.25}
        emissive="#c9a36b"
        emissiveIntensity={0.18}
      />
    </instancedMesh>
  );
}
```

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/components/hero/chrome-particles.tsx
git commit -m "feat(hero): instanced chrome-particle field for R3F scene"
```

---

## Task 17: Hero canvas (R3F scene root)

**Files:**
- Create: `src/components/hero/hero-canvas.tsx`

- [x] **Step 1: Create `src/components/hero/hero-canvas.tsx`**

```tsx
"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import ChromeParticles from "./chrome-particles";

function StaticFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(60% 70% at 70% 30%, rgba(201,163,107,0.22), transparent 60%), radial-gradient(50% 60% at 30% 80%, rgba(60,122,137,0.18), transparent 60%), #0a0b0d",
      }}
    />
  );
}

export default function HeroCanvas() {
  return (
    <div aria-hidden className="absolute inset-0">
      <Suspense fallback={<StaticFallback />}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={55} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 4, 5]} intensity={0.9} color="#e9c894" />
          <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#3c7a89" />
          <Environment preset="warehouse" />
          <ChromeParticles />
        </Canvas>
      </Suspense>
    </div>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/hero/hero-canvas.tsx
git commit -m "feat(hero): R3F canvas root with static fallback"
```

---

## Task 18: Hero — Theatre.js sheet + section

**Files:**
- Create: `src/components/hero/hero-timeline.ts`
- Create: `src/components/hero/hero.tsx`

- [x] **Step 1: Create `src/components/hero/hero-timeline.ts`**

```ts
import { getProject, type ISheet } from "@theatre/core";

let cachedSheet: ISheet | null = null;

export function getHeroSheet(): ISheet {
  if (cachedSheet) return cachedSheet;
  const project = getProject("Rocky Shore Hero");
  cachedSheet = project.sheet("Intro");
  return cachedSheet;
}
```

- [x] **Step 2: Create `src/components/hero/hero.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowDown } from "lucide-react";
import HeroCanvas from "./hero-canvas";
import { getHeroSheet } from "./hero-timeline";

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // GSAP char-by-char reveal
    const el = headlineRef.current;
    if (!el) return;
    const chars = el.querySelectorAll<HTMLSpanElement>("[data-char]");
    gsap.fromTo(
      chars,
      { y: "110%", opacity: 0 },
      { y: "0%", opacity: 1, stagger: 0.02, duration: 1.1, ease: "expo.out", delay: 0.25 },
    );

    // Theatre.js: instantiate the sheet so an in-browser studio (if loaded) has an object to grab
    getHeroSheet();
  }, []);

  return (
    <section
      id="top"
      aria-labelledby="hero-h"
      className="relative isolate min-h-[100svh] flex items-end overflow-hidden"
    >
      <HeroCanvas />

      {/* subtle gradient floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(180deg, transparent, rgba(10,11,13,0.85))" }}
      />

      <div className="relative mx-auto max-w-7xl w-full px-6 pb-24 md:pb-32 pt-40">
        <p className="eyebrow opacity-90">Mobile Auto Detailing · Statewide Maine</p>
        <h1
          id="hero-h"
          ref={headlineRef}
          className="headline mt-6 text-[clamp(3rem,9vw,8.5rem)] max-w-5xl"
        >
          <SplitText text="Glass-deep" />
          <br />
          <SplitText text="finish, " />
          <em><SplitText text="by hand." /></em>
        </h1>
        <p className="mt-10 max-w-xl text-bone-dim text-lg leading-relaxed">
          Aiden Quinn brings the studio to your driveway — paint correction, ceramic coatings,
          and full restorations across Maine.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#book" className="btn-primary">Book a Detail</a>
          <a href="#gallery" className="btn-ghost">See the work</a>
        </div>
      </div>

      <a
        href="#story"
        aria-label="Scroll to story"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono-accent text-[10px] tracking-[0.22em] uppercase text-bone-dim"
      >
        <span>Scroll</span>
        <ArrowDown size={14} className="animate-bounce" />
      </a>
    </section>
  );
}

function SplitText({ text }: { text: string }) {
  return (
    <span aria-label={text} className="inline-block">
      {Array.from(text).map((c, i) => (
        <span
          key={i}
          data-char
          className="inline-block whitespace-pre"
          style={{ willChange: "transform, opacity" }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}
```

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/components/hero/hero-timeline.ts src/components/hero/hero.tsx
git commit -m "feat(hero): orchestration with GSAP char reveal + Theatre.js sheet"
```

---

## Task 19: Booking — progress + success

**Files:**
- Create: `src/components/booking-progress.tsx`
- Create: `src/components/booking-success.tsx`

- [x] **Step 1: Create `src/components/booking-progress.tsx`**

```tsx
const STEP_LABELS = ["Vehicle", "When & Where", "Photos & Contact"];

export default function BookingProgress({ step }: { step: 0 | 1 | 2 }) {
  return (
    <ol
      aria-label="Booking progress"
      className="flex items-center gap-6 mb-12 font-mono-accent text-[11px] tracking-[0.2em] uppercase"
    >
      {STEP_LABELS.map((label, i) => {
        const isCurrent = i === step;
        const isDone = i < step;
        return (
          <li
            key={label}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-center gap-3 ${
              isCurrent ? "text-bronze" : isDone ? "text-bone-dim" : "text-mist"
            }`}
          >
            <span
              className={`size-6 rounded-full border flex items-center justify-center text-[10px] ${
                isCurrent
                  ? "border-bronze bg-bronze/15 text-bronze"
                  : isDone
                  ? "border-bone-dim text-bone-dim"
                  : "border-line text-mist"
              }`}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
```

- [x] **Step 2: Create `src/components/booking-success.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function BookingSuccess({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 0.7, 0.2, 1] }}
      className="relative rounded-2xl border border-bronze/40 bg-charcoal/60 backdrop-blur p-12 md:p-16 text-center"
    >
      <div className="inline-flex size-16 items-center justify-center rounded-full bg-bronze text-ink mb-8">
        <Check size={28} strokeWidth={2.5} />
      </div>
      <p className="eyebrow">Booking received</p>
      <h3 className="headline mt-4 text-4xl md:text-5xl">
        Thanks, {name.split(" ")[0]}.<br />
        <em>We'll be in touch within 24 hours.</em>
      </h3>
      <p className="mt-6 max-w-md mx-auto text-bone-dim leading-relaxed">
        Aiden reviews each request personally. You'll get a confirmation email with the quote and a calendar invite once it's locked in.
      </p>
    </motion.div>
  );
}
```

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/components/booking-progress.tsx src/components/booking-success.tsx
git commit -m "feat(booking): wizard progress indicator + post-submit success state"
```

---

## Task 20: Booking — step 1 (vehicle & service)

**Files:**
- Create: `src/components/booking-step-vehicle.tsx`

- [x] **Step 1: Create `src/components/booking-step-vehicle.tsx`**

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
        <legend className="font-display text-2xl md:text-3xl text-bone mb-6">Choose a service</legend>
        <div role="radiogroup" aria-label="Service" className="grid gap-3 md:grid-cols-2">
          {services.map((s) => {
            const checked = selected === s.slug;
            return (
              <label
                key={s.slug}
                className={`cursor-pointer rounded-xl border p-5 transition-colors ${
                  checked
                    ? "border-bronze bg-bronze/8"
                    : "border-line hover:border-bone-dim bg-charcoal/30"
                }`}
              >
                <input
                  type="radio"
                  value={s.slug}
                  {...register("service")}
                  className="sr-only"
                  onChange={() => setValue("service", s.slug, { shouldValidate: true })}
                />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-xl text-bone">{s.title}</span>
                  <span className="font-mono-accent text-[10px] tracking-[0.2em] uppercase text-bronze">
                    {s.eyebrow.split("·")[0].trim()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-bone-dim leading-relaxed">{s.tagline}</p>
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
  "w-full bg-transparent border border-line rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors";

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
      <span className="block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2">
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
    <p role="alert" className="mt-2 text-[12px] text-ember">
      {msg}
    </p>
  );
}
```

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/booking-step-vehicle.tsx
git commit -m "feat(booking): step 1 — service + vehicle fields"
```

---

## Task 21: Booking — step 2 (when & where)

**Files:**
- Create: `src/components/booking-step-when.tsx`

- [x] **Step 1: Create `src/components/booking-step-when.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { BookingInput } from "@/lib/booking-schema";
import { TIME_WINDOWS, TIME_WINDOW_LABELS } from "@/lib/booking-schema";
import { FormField, FieldError } from "@/components/booking-step-vehicle";

const inputClass =
  "w-full bg-transparent border border-line rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors";

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
          <span className="block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2">
            Time window
          </span>
          <div role="radiogroup" aria-label="Time window" className="grid grid-cols-3 gap-2">
            {TIME_WINDOWS.map((w) => {
              const checked = selectedWindow === w;
              return (
                <label
                  key={w}
                  className={`cursor-pointer rounded-lg border px-3 py-3 text-sm text-center transition-colors ${
                    checked
                      ? "border-bronze bg-bronze/8 text-bronze"
                      : "border-line text-bone-dim hover:border-bone-dim"
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

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/booking-step-when.tsx
git commit -m "feat(booking): step 2 — address + date + time-window"
```

---

## Task 22: Booking — step 3 (photos & contact)

**Files:**
- Create: `src/components/booking-step-photos.tsx`

- [x] **Step 1: Create `src/components/booking-step-photos.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { BookingInput } from "@/lib/booking-schema";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, validateFiles } from "@/lib/booking-schema";
import { FormField, FieldError } from "@/components/booking-step-vehicle";

const inputClass =
  "w-full bg-transparent border border-line rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors";

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
        <span className="block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2">
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
          className={`w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
            dragOver ? "border-bronze bg-bronze/5" : "border-line hover:border-bone-dim"
          }`}
        >
          <Upload size={20} className="text-bronze" />
          <span className="text-bone-dim">
            Drop images here or <span className="text-bronze underline">browse</span>
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
                  className="relative aspect-square rounded-lg overflow-hidden border border-line group"
                >
                  {/* Use <img> for object-URL blobs */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={f.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => removeAt(i)}
                    className="absolute top-2 right-2 size-7 rounded-full bg-ink/80 text-bone flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/booking-step-photos.tsx
git commit -m "feat(booking): step 3 — photo dropzone + contact fields"
```

---

## Task 23: Booking section (wizard orchestrator)

**Files:**
- Create: `src/components/booking-section.tsx`

- [x] **Step 1: Create `src/components/booking-section.tsx`**

```tsx
"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { type BookingInput, bookingSchema, SERVICE_SLUGS } from "@/lib/booking-schema";
import BookingProgress from "@/components/booking-progress";
import BookingStepVehicle from "@/components/booking-step-vehicle";
import BookingStepWhen from "@/components/booking-step-when";
import BookingStepPhotos from "@/components/booking-step-photos";
import BookingSuccess from "@/components/booking-success";
import Reveal from "@/components/reveal";

type Step = 0 | 1 | 2;

const STEP_FIELDS: Record<Step, (keyof BookingInput)[]> = {
  0: ["service", "year", "make", "model", "color"],
  1: ["address", "city", "zip", "date", "timeWindow"],
  2: ["name", "email", "phone", "notes"],
};

export default function BookingSection() {
  const methods = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: {
      service: "full-detail",
      year: undefined as unknown as number,
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

  // Pre-select service from hash, e.g. #book?service=ceramic-coating
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const match = hash.match(/service=([a-z-]+)/);
    if (!match) return;
    const slug = match[1];
    if ((SERVICE_SLUGS as readonly string[]).includes(slug)) {
      methods.setValue("service", slug as BookingInput["service"]);
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
      <section id="book" className="relative py-32 md:py-44 border-t border-line">
        <div className="mx-auto max-w-3xl px-6">
          <BookingSuccess name={submittedName} />
        </div>
      </section>
    );
  }

  return (
    <section id="book" aria-labelledby="book-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="eyebrow">Book a detail</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="book-h" className="headline mt-6 text-5xl md:text-7xl mb-12">
            Tell us about <em>your car.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="rounded-2xl border border-line bg-charcoal/30 backdrop-blur p-8 md:p-12">
            <BookingProgress step={step} />
            <FormProvider {...methods}>
              <form noValidate onSubmit={onSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.45, ease: [0.22, 0.7, 0.2, 1] }}
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
                  <p role="alert" className="mt-6 text-ember text-sm">
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
                    className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
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
                      className="btn-primary disabled:opacity-60"
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

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/booking-section.tsx
git commit -m "feat(booking): wizard orchestrator with step validation + Resend submit"
```

---

## Task 24: Compose `app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx` (replace existing scaffold content entirely)

- [x] **Step 1: Overwrite `src/app/page.tsx`**

```tsx
import Hero from "@/components/hero/hero";
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
      <Hero />
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

- [x] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(page): compose all sections in app/page.tsx"
```

---

## Task 25: Wrap `<MotionConfig reducedMotion>` in layout

**Files:**
- Modify: `src/app/layout.tsx`

- [x] **Step 1: Open `src/app/layout.tsx` and verify current state**

It should already import fonts, `SmoothScroll`, `Cursor`, `Navigation`, `Footer`. We're going to wrap the children with `<MotionConfig reducedMotion="user">` from Framer Motion so all motion respects OS settings consistently.

- [x] **Step 2: Replace the file with this exact content**

```tsx
import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";

import SmoothScroll from "@/components/smooth-scroll";
import Cursor from "@/components/cursor";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
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
  themeColor: "#0a0b0d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-bone grain vignette has-cursor">
        <MotionConfig reducedMotion="user">
          <SmoothScroll>
            <Cursor />
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </SmoothScroll>
        </MotionConfig>
      </body>
    </html>
  );
}
```

> Note: `MotionConfig` is imported from `framer-motion` and re-exports to both server and client — but `MotionConfig` itself is a client API, so this file must mark `'use client'` only if Next complains during build. As of framer-motion v12, MotionConfig may be used in server components when it has no event handlers passed in. If `next build` errors about it, add `"use client";` at the top of this file.

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [x] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "chore(motion): MotionConfig reducedMotion=user wraps the app"
```

---

## Task 26: README

**Files:**
- Modify: `README.md` (overwrite the create-next-app default)

- [x] **Step 1: Overwrite `README.md`**

```markdown
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
```

- [x] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with setup, env vars, and content-editing guide"
```

---

## Task 27: Final verification

**Files:** none — verification only.

- [x] **Step 1: Add `.env.local` for the smoke test (NOT committed)**

Append `.env.local` to `.gitignore` (already there from create-next-app — verify with `grep .env.local .gitignore`). Then:

```bash
cp .env.example .env.local
```

Open `.env.local` and paste a real Resend API key (sign up at https://resend.com). If you don't have one yet, you can still verify everything except the email step.

- [x] **Step 2: Run lint**

```bash
npm run lint
```

Expected: 0 errors. Warnings about `<img>` in `booking-step-photos.tsx` are expected (the inline eslint-disable handles them).

- [x] **Step 3: Run a production build**

```bash
npm run build
```

Expected: build succeeds, no type errors, no runtime errors.

If the build fails with an error mentioning `MotionConfig` and "server components", add `"use client";` as the first line of `src/app/layout.tsx` and re-run.

- [x] **Step 4: Run the dev server and smoke-test manually**

```bash
npm run dev
```

Open `http://localhost:3000` and walk through:
- Hero loads, particles drift, headline animates in character-by-character.
- Scroll → Story section reveals, bronze underline draws.
- Scroll → Services grid appears; hover a card → bronze glow + arrow rotates.
- Scroll → Process section pins, horizontal track scrubs as you scroll.
- Scroll → Gallery: drag the before/after divider, hover grid tiles.
- Scroll → Testimonials: two rows marquee in opposite directions, pause on hover.
- Scroll → Booking: fill step 1, click Next; step 2, click Next; step 3, drop an image, fill contact, click Send request.
- If `RESEND_API_KEY` is set → check `fumarajohn8@gmail.com` inbox for the booking email with photo attached.
- Scroll → FAQ: expand each item, content animates open/closed.
- Click the logo in the nav → smooth-scroll to top.
- Resize to ~375px width → Process degrades to vertical stack, nav becomes hamburger drawer.
- Open OS reduced-motion setting → reload → nothing animates, all content reachable.

- [x] **Step 5: Run Lighthouse (Chrome DevTools, Incognito, mobile preset)**

Targets per spec §11:
- Performance ≥ 80
- Accessibility = 100
- Best Practices = 100
- SEO ≥ 95

If anything fails the target, open a follow-up issue rather than blocking this plan.

- [x] **Step 6: Final commit**

If anything was changed in the verification pass (e.g. adding `"use client"` to layout, fixing a typo), commit it:

```bash
git add -A
git commit -m "chore: verification fixes"
```

If nothing changed, skip the commit.

---

## Plan summary

27 tasks. After completion the site has:

- A 9-section cinematic single-page experience
- A 3-step booking wizard with photo attachment that emails Aiden via Resend
- All copy/data in `src/data/*.ts` for non-developer edits
- Full keyboard + reduced-motion accessibility
- A clean README + `.env.example` for handoff and deploy
