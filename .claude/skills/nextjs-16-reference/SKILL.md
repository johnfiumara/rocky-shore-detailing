---
name: nextjs-16-reference
description: Use when editing files under src/app/, middleware.*, proxy.*, next.config.*, or any code importing from "next" or "next/*" in this repo. Points at the canonical Next.js 16.2.6 docs bundled inside node_modules/next/dist/docs/. AGENTS.md mandates reading these before writing Next.js code because training data predates 16.x.
---

# Next.js 16 Reference (this repo: 16.2.6)

This repo runs **Next.js 16.2.6** with the App Router. Many APIs have moved, been renamed, or been replaced since training data. Treat what you "remember" about Next.js as suspect, and read the bundled docs.

The authoritative source is `node_modules/next/dist/docs/`, which Next.js ships inside the installed package. Use the index below to jump to the specific doc you need, then `Read` it.

## Index — `node_modules/next/dist/docs/01-app/`

### Getting started (whole-feature work)

| Topic | Path |
|-------|------|
| Project structure | `01-getting-started/02-project-structure.md` |
| Layouts and pages | `01-getting-started/03-layouts-and-pages.md` |
| Linking and navigating | `01-getting-started/04-linking-and-navigating.md` |
| Server & Client Components | `01-getting-started/05-server-and-client-components.md` |
| Fetching data | `01-getting-started/06-fetching-data.md` |
| Mutating data (Server Actions) | `01-getting-started/07-mutating-data.md` |
| Caching | `01-getting-started/08-caching.md` |
| Revalidating | `01-getting-started/09-revalidating.md` |
| Error handling | `01-getting-started/10-error-handling.md` |
| CSS | `01-getting-started/11-css.md` |
| Images | `01-getting-started/12-images.md` |
| Fonts | `01-getting-started/13-fonts.md` |
| Metadata / OG images | `01-getting-started/14-metadata-and-og-images.md` |
| Route Handlers (API routes) | `01-getting-started/15-route-handlers.md` |
| Proxy | `01-getting-started/16-proxy.md` |
| Deploying | `01-getting-started/17-deploying.md` |
| Upgrading | `01-getting-started/18-upgrading.md` |

(All paths above are relative to `node_modules/next/dist/docs/01-app/`.)

### API reference (specific functions / config)

| Topic | Path |
|-------|------|
| `after()` | `03-api-reference/04-functions/after.md` |
| `cacheLife()` | `03-api-reference/04-functions/cacheLife.md` |
| Cache Components config | `03-api-reference/05-config/01-next-config-js/cacheComponents.md` |
| Cache handlers config | `03-api-reference/05-config/01-next-config-js/cacheHandlers.md` |
| TypeScript config | `03-api-reference/05-config/02-typescript.md` |
| ESLint config | `03-api-reference/05-config/03-eslint.md` |
| Turbopack | `03-api-reference/08-turbopack.md` |
| Adapters (directory) | `03-api-reference/07-adapters/` |

### Guides

| Topic | Path |
|-------|------|
| AI Agents | `02-guides/ai-agents.md` |
| Authentication | `02-guides/authentication.md` |
| Backend for frontend | `02-guides/backend-for-frontend.md` |
| App Router migration | `02-guides/migrating/app-router-migration.md` |

For anything else, `Glob` `node_modules/next/dist/docs/01-app/**/*.md` to find the relevant file by topic.

## What this repo actually uses

- App Router under `src/app/` — `src/app/layout.tsx`, `src/app/page.tsx`
- One Route Handler: `src/app/api/booking/route.ts` (POST validated with Zod, sends mail via Resend)
- No middleware/proxy file currently
- No `next.config.*` overrides
- Tailwind v4 via `@tailwindcss/postcss` in `postcss.config.mjs` (not configured through `next.config`)

## How to use this skill

1. Identify the topic for your edit (route handler? metadata? caching? config?)
2. Look up the path in the index above
3. `Read` the doc before writing any Next.js-API-using code
4. If the topic isn't indexed, `Glob` `node_modules/next/dist/docs/01-app/**/*.md` before falling back to web search or training-data recall

## Red flags — STOP and check the docs

- About to write `getServerSideProps`, `getStaticProps`, `getStaticPaths`, `_app.tsx`, `_document.tsx`, or `pages/api/*` → wrong router. This is an App Router project — see `01-getting-started/06-fetching-data.md` and `07-mutating-data.md`.
- About to use `unstable_cache` → check `01-getting-started/08-caching.md` first; 16 has new cache primitives.
- About to write `middleware.ts` → read `01-getting-started/16-proxy.md` first to confirm the current pattern.
- About to call `headers()`, `cookies()`, `draftMode()` → confirm the async/sync contract in its API-reference page before writing.
- About to add a key to `next.config.*` → confirm it exists under `03-api-reference/05-config/01-next-config-js/`.
