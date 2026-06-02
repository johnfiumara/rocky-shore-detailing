# Section Routes Design

**Date:** 2026-06-02
**Author:** Claude (with John Fiumara)
**Status:** Approved — pending implementation plan

## Problem

The public site is a one-pager: sections (`#book`, `#gallery`, `#services`, etc.) live as anchors on `/`. Direct URLs like `https://rockyshoredetail.netlify.app/services` return 404, which breaks shared links, search engine deep-linking, and any external integration that assumes per-section URLs.

## Goal

Promote each homepage section to a real route while keeping the one-page layout intact. After this change:

- `/services`, `/gallery`, `/book`, `/process`, `/faq`, `/story`, `/testimonials` all return 200 and render the corresponding section as the whole page.
- The homepage (`/`) still renders every section in order — no regression to the marketing landing flow.
- The main navigation links to routes (`/services`) instead of anchors (`#services`).
- The booking deep-link `/book?service=<slug>` preselects the service in the form.

## Non-goals

- Removing homepage sections — they stay.
- Writing net-new content for each route. Each route renders the same section component used on the homepage.
- Adding breadcrumbs, i18n, hreflang, or other SEO chrome beyond per-route metadata.
- Touching admin routes or any API.

## Scope inventory

### New files (7)

Each route is a thin server component that imports the existing section and exports route metadata.

```
src/app/(site)/services/page.tsx
src/app/(site)/gallery/page.tsx
src/app/(site)/book/page.tsx
src/app/(site)/process/page.tsx
src/app/(site)/faq/page.tsx
src/app/(site)/story/page.tsx
src/app/(site)/testimonials/page.tsx
```

**Template** (each follows this shape, only title/description/component change):

```tsx
// src/app/(site)/services/page.tsx
import type { Metadata } from "next";
import ServicesSection from "@/components/services-section";

export const metadata: Metadata = {
  title: "Services · Rocky Shore Detailing",
  description: "Mobile detailing packages serving Maine — full package, interior+exterior, interior restoration, refresh, and more.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <ServicesSection />;
}
```

The booking page uses the same template but wraps with `<Suspense>` because `BookingSection` uses `useSearchParams()`:

```tsx
// src/app/(site)/book/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import BookingSection from "@/components/booking-section";
import { BookingSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Book a Detail · Rocky Shore Detailing",
  description: "Book a mobile detail with Aiden Quinn. Vehicle, location, time window — done in three steps.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <BookingSection />
    </Suspense>
  );
}
```

### Files modified

| File | Change |
|---|---|
| `src/components/navigation.tsx` | `NAV_LINKS` href values: `#section` → `/section`. Wrap each link in `next/link`. Top + mobile "Book a Detail" buttons: `#book` → `/book`. Logo `<a href="#top">` → `<Link href="/">`. |
| `src/components/hero/hero.tsx` | Three CTAs (`#book`, `#gallery`, `#story`) → routes via `next/link`. |
| `src/components/service-card.tsx` | Replace `<motion.a href="#book?service=...">` + scrollIntoView with `<Link href={`/book?service=${slug}`}>`. Drop the click handler. |
| `src/components/booking-section.tsx` | Extend service-prefill: in addition to reading `window.location.hash`, also read `useSearchParams().get("service")`. The component already runs client-side; just add the searchParam path. |
| `src/app/sitemap.ts` | Replace 6 `${baseUrl}/#anchor` URLs with 7 route URLs (`/services`, `/gallery`, `/book`, `/process`, `/faq`, `/story`, `/testimonials`). Adjust priorities (see "Sitemap" below). |
| `src/components/footer.tsx` | No change — has no section anchors, only `tel:` and `mailto:`. |

### Layout & chrome

`src/app/(site)/layout.tsx` already wraps with smooth-scroll, motion-provider, navigation, and footer. Sub-routes inherit this layout automatically. No new layout files needed.

### Sitemap

Replace the existing entries with:

| URL | Priority | changeFreq |
|---|---|---|
| `/` | 1.0 | weekly |
| `/book` | 0.9 | weekly |
| `/services` | 0.8 | monthly |
| `/gallery` | 0.8 | weekly |
| `/story` | 0.7 | monthly |
| `/testimonials` | 0.7 | monthly |
| `/process` | 0.6 | monthly |
| `/faq` | 0.6 | monthly |

Use the canonical brand base URL `https://rockyshoredetailing.com` (existing constant) — even though the live deploy is `rockyshoredetail.netlify.app`, the canonical brand URL is what's already used everywhere in the codebase for SEO, and changing that is out of scope here.

## Verification

1. `npm run build` succeeds.
2. `npm run dev`, then `curl -o /dev/null -w "%{http_code} %{url_effective}\n"` against `/`, `/services`, `/gallery`, `/book`, `/process`, `/faq`, `/story`, `/testimonials` — every one returns 200.
3. Open `/` in browser, click each nav link → real navigation (URL bar changes, no smooth scroll).
4. Open `/book?service=full-package` directly → form opens with "Full Package" preselected.
5. `npm run test:run` passes.
6. After deploy: hit the live site, repeat (2)-(4).

## Risks / open questions

- **Sub-route components rely on layout providers.** Each section component uses `framer-motion`, `Lenis` smooth scroll, etc. These are all provided by `(site)/layout.tsx`, so this is fine. Verify in dev that motion still animates on the standalone routes.
- **Duplicate `id="<section>"` attributes when both `/` and `/section` render the same component.** Harmless (only one is on screen at a time), but if any code uses `document.getElementById('book')` it will resolve to the section regardless of which page is rendered — still correct.
- **`/book` Suspense boundary** — required because `useSearchParams()` would otherwise opt the entire route into client rendering. Falls back to `BookingSkeleton` while suspended.

## Out of scope (parking lot)

- Real custom domain switchover (`rockyshoredetailing.com` doesn't resolve yet).
- Per-route OpenGraph images.
- Schema.org markup variations per route.
- Replacing the homepage with a slim landing page that doesn't repeat every section.
