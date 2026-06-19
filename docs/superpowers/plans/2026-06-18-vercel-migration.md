# Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move rockycoastdetailing.net from Netlify to Vercel without downtime and without losing customer booking photos.

**Architecture:** Three-phase migration. Phase 1 swaps `@netlify/blobs` for Supabase Storage so the app becomes vendor-neutral (still ships to Netlify). Phase 2 stands up a Vercel deploy alongside Netlify. Phase 3 flips DNS and retires Netlify. Each phase is independently green and reversible.

**Tech Stack:** Next.js 16 (App Router, Turbopack), Prisma 7, Supabase (Postgres + Storage + Auth), Resend, Upstash Redis, Vitest, TypeScript.

**Linked spec:** `docs/superpowers/specs/2026-06-18-vercel-migration-design.md`

---

## File Structure

**Phase 1 — Storage migration**

| File | Responsibility |
|------|----------------|
| `src/lib/booking-photos.ts` | (rewrite) Same three exports (`storeBookingPhotos`, `getBookingPhoto`, `contentTypeForKey`), now backed by Supabase Storage via `supabaseAdmin()`. |
| `src/lib/__tests__/booking-photos.test.ts` | (new) Unit tests for the rewritten module — mocks the Supabase admin client, verifies key format, content type, upload/download round-trip. |
| `supabase/migrations/0006_booking_photos_bucket.sql` | (new) Creates the private `booking-photos` storage bucket. Idempotent. |
| `next.config.ts` | (modify) Add `headers()` returning the security headers and `/gallery/*` immutable cache rule that used to live in `netlify.toml`. |
| `netlify.toml` | (modify) Remove the two `[[headers]]` blocks. `[build]` stays. |
| `scripts/migrate-netlify-blobs-to-supabase.ts` | (new) One-shot migration: lists keys in the `booking-photos` Netlify Blobs store and uploads each to the Supabase bucket. Idempotent. |
| `prisma/schema.prisma` | (modify) Update the `photoKeys` comment from "Netlify Blobs keys" to "Supabase Storage keys in the `booking-photos` bucket". No schema change. |

**Phase 2 — Vercel deploy**

| File | Responsibility |
|------|----------------|
| `vercel.ts` | (new) Minimal config: framework + buildCommand. |
| `package.json` | (modify) Drop `--webpack` from the `build` script. |
| `scripts/list-required-env.ts` | (new) Greps `process.env.*` from the source tree, prints unique vars, used as input for `vercel env add`. |

**Phase 3 — DNS cutover + cleanup**

| File | Responsibility |
|------|----------------|
| `netlify.toml` | (delete) |
| `scripts/migrate-netlify-blobs-to-supabase.ts` | (delete) Job is done; git history preserves it. |
| `package.json` | (modify) Remove `@netlify/blobs` dependency. |
| `~/.claude/.../memory/project-basics.md`, `deployed-url.md` | (modify) Update deploy target from Netlify to Vercel. |

Note on `eslint.config.mjs`: the only Netlify-related entry is `.netlify/**` in `globalIgnores`, which is benign and left in place.

---

# Phase 1 — Storage Migration

After this phase: app is fully vendor-neutral. Still shipping to Netlify. Production photo writes and reads go through Supabase Storage. Existing photos preserved.

---

### Task 1.1: Create the Supabase Storage bucket migration

**Files:**
- Create: `supabase/migrations/0006_booking_photos_bucket.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0006_booking_photos_bucket.sql`:

```sql
-- Phase 1 / Vercel migration: private storage bucket for customer booking photos.
--
-- The photos that customers upload with a booking request used to live in
-- @netlify/blobs ("booking-photos" store). Moving them to Supabase Storage
-- removes a Netlify-specific dependency and consolidates blob/object storage
-- with the rest of the data model.
--
-- Access goes through the service-role server client in
-- src/lib/booking-photos.ts. Authorization is enforced at the API route, not
-- at the bucket — so this bucket has no row-level policies and is not public.
-- Idempotent via on conflict.

insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', false)
on conflict (id) do nothing;
```

- [ ] **Step 2: Apply the migration to the Supabase project**

Run: `npx supabase db push --linked` (or apply via the Supabase dashboard SQL editor against project `qjlzizldulvxlriheqbr`).
Expected: SQL runs without error. Re-running it should produce "INSERT 0 0" (idempotent).

- [ ] **Step 3: Verify the bucket exists**

Run: `npx supabase storage list --linked` or check the Supabase dashboard → Storage.
Expected: a private bucket named `booking-photos` is listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0006_booking_photos_bucket.sql
git commit -m "feat(storage): add private booking-photos bucket"
```

---

### Task 1.2: Write the failing test for the rewritten booking-photos module

**Files:**
- Test: `src/lib/__tests__/booking-photos.test.ts`

- [ ] **Step 1: Write the test**

Create `src/lib/__tests__/booking-photos.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks so the imported module under test uses them.
const storageMock = vi.hoisted(() => {
  const upload = vi.fn();
  const download = vi.fn();
  return {
    upload,
    download,
    from: vi.fn(() => ({ upload, download })),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: vi.fn(() => ({ storage: storageMock })),
}));

import {
  storeBookingPhotos,
  getBookingPhoto,
  contentTypeForKey,
} from "@/lib/booking-photos";

function fakeFile(name: string, type: string, body = "x"): File {
  return new File([body], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  storageMock.upload.mockResolvedValue({ data: { path: "ok" }, error: null });
  storageMock.download.mockResolvedValue({ data: null, error: null });
});

describe("contentTypeForKey", () => {
  it("maps known extensions", () => {
    expect(contentTypeForKey("abc/0.jpg")).toBe("image/jpeg");
    expect(contentTypeForKey("abc/1.JPEG")).toBe("image/jpeg");
    expect(contentTypeForKey("abc/2.png")).toBe("image/png");
    expect(contentTypeForKey("abc/3.webp")).toBe("image/webp");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(contentTypeForKey("abc/0.xyz")).toBe("application/octet-stream");
    expect(contentTypeForKey("noext")).toBe("application/octet-stream");
  });
});

describe("storeBookingPhotos", () => {
  it("returns empty array for no files", async () => {
    const keys = await storeBookingPhotos("b1", []);
    expect(keys).toEqual([]);
    expect(storageMock.upload).not.toHaveBeenCalled();
  });

  it("uploads each file under <bookingId>/<index>.<ext> and returns the keys", async () => {
    const files = [
      fakeFile("front.jpg", "image/jpeg"),
      fakeFile("side.png", "image/png"),
    ];

    const keys = await storeBookingPhotos("book-123", files);

    expect(keys).toEqual(["book-123/0.jpg", "book-123/1.png"]);
    expect(storageMock.from).toHaveBeenCalledWith("booking-photos");
    expect(storageMock.upload).toHaveBeenCalledTimes(2);
    expect(storageMock.upload).toHaveBeenNthCalledWith(
      1,
      "book-123/0.jpg",
      expect.any(ArrayBuffer),
      { contentType: "image/jpeg", upsert: false },
    );
    expect(storageMock.upload).toHaveBeenNthCalledWith(
      2,
      "book-123/1.png",
      expect.any(ArrayBuffer),
      { contentType: "image/png", upsert: false },
    );
  });

  it("infers extension from MIME when filename has no usable extension", async () => {
    const files = [fakeFile("blob", "image/webp")];
    const keys = await storeBookingPhotos("b2", files);
    expect(keys).toEqual(["b2/0.webp"]);
  });

  it("throws if Supabase Storage returns an error", async () => {
    storageMock.upload.mockResolvedValueOnce({
      data: null,
      error: { message: "bucket disabled" },
    });
    await expect(
      storeBookingPhotos("b3", [fakeFile("x.jpg", "image/jpeg")]),
    ).rejects.toThrow(/bucket disabled/);
  });
});

describe("getBookingPhoto", () => {
  it("returns the ArrayBuffer when the key exists", async () => {
    const buf = new TextEncoder().encode("hello").buffer;
    storageMock.download.mockResolvedValueOnce({
      data: new Blob([buf]),
      error: null,
    });

    const got = await getBookingPhoto("b1/0.jpg");

    expect(storageMock.from).toHaveBeenCalledWith("booking-photos");
    expect(storageMock.download).toHaveBeenCalledWith("b1/0.jpg");
    expect(got).toBeInstanceOf(ArrayBuffer);
    expect(new TextDecoder().decode(got!)).toBe("hello");
  });

  it("returns null when the key does not exist", async () => {
    storageMock.download.mockResolvedValueOnce({
      data: null,
      error: { message: "Object not found", statusCode: "404" },
    });
    const got = await getBookingPhoto("missing/0.jpg");
    expect(got).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/lib/__tests__/booking-photos.test.ts`
Expected: FAIL — the existing module still imports `@netlify/blobs`, so either the `contentTypeForKey` tests pass (it's unchanged) but the `storeBookingPhotos` / `getBookingPhoto` tests fail because the mocked Supabase client isn't called by the @netlify/blobs implementation.

- [ ] **Step 3: Commit the test file**

```bash
git add src/lib/__tests__/booking-photos.test.ts
git commit -m "test(booking-photos): add coverage for Supabase Storage rewrite"
```

---

### Task 1.3: Rewrite booking-photos.ts on Supabase Storage

**Files:**
- Modify: `src/lib/booking-photos.ts` (full replacement)

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/lib/booking-photos.ts` with:

```ts
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "booking-photos";

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
};

function bucket() {
  return supabaseAdmin().storage.from(BUCKET);
}

function extFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && EXT_CONTENT_TYPE[fromName]) return fromName;
  const fromType = file.type.split("/").pop()?.toLowerCase();
  if (fromType && EXT_CONTENT_TYPE[fromType]) return fromType;
  return "jpg";
}

/** Content type to serve a stored photo with, inferred from its key extension. */
export function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";
}

/**
 * Persist the photos a customer uploaded with a booking. Keys are namespaced
 * by booking id (`<bookingId>/<index>.<ext>`) so they're easy to scope and
 * validate when serving. Returns the stored keys.
 */
export async function storeBookingPhotos(
  bookingId: string,
  files: File[],
): Promise<string[]> {
  if (files.length === 0) return [];

  const keys: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = extFor(file);
    const key = `${bookingId}/${i}.${ext}`;
    const { error } = await bucket().upload(key, await file.arrayBuffer(), {
      contentType: contentTypeForKey(key),
      upsert: false,
    });
    if (error) {
      throw new Error(
        `Failed to upload booking photo ${key}: ${error.message}`,
      );
    }
    keys.push(key);
  }
  return keys;
}

/** Fetch a stored booking photo by key, or null if it doesn't exist. */
export async function getBookingPhoto(key: string): Promise<ArrayBuffer | null> {
  const { data, error } = await bucket().download(key);
  if (error || !data) return null;
  return await data.arrayBuffer();
}
```

- [ ] **Step 2: Run the test and verify it passes**

Run: `npx vitest run src/lib/__tests__/booking-photos.test.ts`
Expected: PASS — all describe blocks green.

- [ ] **Step 3: Run typecheck and full test suite**

Run: `npm run typecheck && npm run test:run`
Expected: typecheck clean, all tests pass.

- [ ] **Step 4: Update the photoKeys comment in prisma/schema.prisma**

Find the line in `prisma/schema.prisma` near `photoKeys`:

```prisma
  // Netlify Blobs keys for the photos the customer uploaded with the request.
  photoKeys   String[]      @default([]) @map("photo_keys")
```

Change the comment to:

```prisma
  // Supabase Storage keys (`<bookingId>/<index>.<ext>`) in the booking-photos bucket.
  photoKeys   String[]      @default([]) @map("photo_keys")
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/booking-photos.ts prisma/schema.prisma
git commit -m "refactor(booking-photos): swap @netlify/blobs for Supabase Storage"
```

---

### Task 1.4: Move security and cache headers into next.config.ts

**Files:**
- Modify: `next.config.ts`
- Modify: `netlify.toml`

- [ ] **Step 1: Update next.config.ts**

Replace the contents of `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        // Site-wide security headers. Previously enforced in netlify.toml; moved
        // here so they're framework-native and apply on any host (Netlify or
        // Vercel) during the migration.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Long-cache user-facing static assets under /public/gallery.
        source: "/gallery/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Remove the header blocks from netlify.toml**

Replace `netlify.toml` with:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "24"
  NEXT_TELEMETRY_DISABLED = "1"

# Site-wide security headers and gallery cache headers were moved into
# next.config.ts headers() so they apply on both Netlify and Vercel during
# the migration. See docs/superpowers/plans/2026-06-18-vercel-migration.md.
```

- [ ] **Step 3: Run the build locally to confirm headers register**

Run: `npm run build`
Expected: build succeeds. Look in the output for the headers compile step — Next prints a summary that includes `headers` when defined.

- [ ] **Step 4: Smoke-test headers in dev**

Run: `npm run dev` (in another shell). Then:
```bash
curl -sI http://localhost:3000/ | grep -i "x-frame-options\|strict-transport\|referrer-policy"
```
Expected: the three headers appear in the response.

Stop the dev server (`Ctrl+C`) once verified.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts netlify.toml
git commit -m "chore(headers): move security/cache headers from netlify.toml to next.config.ts"
```

---

### Task 1.5: Write the Netlify Blobs → Supabase Storage migration script

**Files:**
- Create: `scripts/migrate-netlify-blobs-to-supabase.ts`

- [ ] **Step 1: Create the script**

Create `scripts/migrate-netlify-blobs-to-supabase.ts`:

```ts
/**
 * One-shot migration: copy every key in the Netlify Blobs `booking-photos`
 * store into the Supabase Storage `booking-photos` bucket, preserving the
 * `<bookingId>/<index>.<ext>` key format used by src/lib/booking-photos.ts.
 *
 * Idempotent: if a key already exists in Supabase, it is skipped (Supabase
 * returns a Duplicate error which we treat as success).
 *
 * Required env vars (load via .env or export before running):
 *   NETLIFY_SITE_ID         site UUID — 6cb7305d-41c1-4b24-92dd-87bf38652f28
 *   NETLIFY_BLOBS_TOKEN     personal access token with Blobs read access
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run with: `npx tsx scripts/migrate-netlify-blobs-to-supabase.ts`
 *
 * Delete this file in Phase 3 once the migration has run and DNS has cut over.
 */
import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const STORE_NAME = "booking-photos";
const BUCKET = "booking-photos";

async function main() {
  const netlify = getStore({
    name: STORE_NAME,
    siteID: requiredEnv("NETLIFY_SITE_ID"),
    token: requiredEnv("NETLIFY_BLOBS_TOKEN"),
  });

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  let total = 0;

  for await (const { blobs } of netlify.list({ paginate: true })) {
    for (const blob of blobs) {
      total++;
      const key = blob.key;
      const buf = (await netlify.get(key, { type: "arrayBuffer" })) as
        | ArrayBuffer
        | null;
      if (!buf) {
        console.warn(`[skip] ${key}: empty blob`);
        skipped++;
        continue;
      }
      const ext = key.split(".").pop()?.toLowerCase() ?? "";
      const contentType =
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : "application/octet-stream";

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, buf, { contentType, upsert: false });
      if (error) {
        // Supabase returns this error message when a key already exists.
        if (error.message.includes("already exists")) {
          skipped++;
          continue;
        }
        console.error(`[fail] ${key}: ${error.message}`);
        failed++;
        continue;
      }
      copied++;
      if (copied % 25 === 0) console.log(`...${copied} copied`);
    }
  }

  console.log(
    `\nDone. total=${total} copied=${copied} skipped=${skipped} failed=${failed}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Dry-run the script against a local/empty source**

Run: `NETLIFY_SITE_ID=6cb7305d-41c1-4b24-92dd-87bf38652f28 NETLIFY_BLOBS_TOKEN=<personal-token> npx tsx scripts/migrate-netlify-blobs-to-supabase.ts`

(Substitute a real personal access token from `https://app.netlify.com/user/applications` → Personal access tokens.)

Expected: the script exits 0 with `total=N copied=N skipped=0 failed=0` (or `skipped` matches keys already migrated if you re-run it).

- [ ] **Step 3: Verify a sample photo loads after migration**

Run in the browser, while signed in as admin: open the admin bookings detail page for a booking that has photos. Each photo should render via `/api/admin/booking-photo?key=...`.

If a photo 404s, look at the storage browser in the Supabase dashboard to confirm the key exists in the `booking-photos` bucket.

- [ ] **Step 4: Commit the migration script**

```bash
git add scripts/migrate-netlify-blobs-to-supabase.ts
git commit -m "chore(migration): one-shot script for Netlify Blobs to Supabase Storage"
```

---

### Task 1.6: Ship Phase 1 to Netlify and verify production

**Files:** none (deploy task)

- [ ] **Step 1: Open Phase 1 PR**

Push the branch and open a PR. Ensure the description references the spec and the plan.

- [ ] **Step 2: Wait for Netlify preview build to go green**

Expected: preview deploy succeeds. The build still runs `prisma generate && next build --webpack` — we haven't dropped `--webpack` yet.

- [ ] **Step 3: Manual smoke test on the Netlify preview**

On the preview URL:
1. Submit a new booking with two photos attached.
2. Sign in as admin, open the booking, confirm both photos render.
3. View response headers: `curl -sI <preview-url>/ | grep -i x-frame-options` should still show `SAMEORIGIN`.

- [ ] **Step 4: Merge to master and let production deploy**

- [ ] **Step 5: Run the migration script against production**

After production has deployed:
```bash
NETLIFY_SITE_ID=6cb7305d-41c1-4b24-92dd-87bf38652f28 \
NETLIFY_BLOBS_TOKEN=<token> \
NEXT_PUBLIC_SUPABASE_URL=https://qjlzizldulvxlriheqbr.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role> \
npx tsx scripts/migrate-netlify-blobs-to-supabase.ts
```

Expected: zero failures. Note the count of copied keys.

- [ ] **Step 6: Confirm an existing booking still shows its photos**

On `https://rockycoastdetailing.net/admin/bookings/<id>`, confirm photos on a pre-existing booking still render (they now come from Supabase Storage).

Phase 1 is complete when this step is green.

---

# Phase 2 — Vercel Deploy Alongside Netlify

After this phase: the app builds and serves correctly on Vercel via `*.vercel.app`. Netlify is still primary. DNS unchanged.

---

### Task 2.1: Install Vercel CLI and link the project

**Files:** none

- [ ] **Step 1: Install the Vercel CLI globally**

Run: `npm i -g vercel`
Verify: `vercel --version` prints a version number (≥40).

- [ ] **Step 2: Log in**

Run: `vercel login`
Follow the browser flow. Expected: "Success! GitHub authentication complete."

- [ ] **Step 3: Link the repo to a new Vercel project**

From the repo root:
```bash
vercel link
```
Answer prompts: scope = personal account; link to existing project = N; project name = `rocky-shore-detailing` (or `rocky-coast-detailing` — whichever the user prefers); directory = `./`.

Expected: creates `.vercel/project.json`. Add `.vercel/` to `.gitignore` if it isn't already.

- [ ] **Step 4: Confirm `.vercel/` is gitignored**

Run: `git status` — `.vercel/` should not appear. If it does, append `.vercel/` to `.gitignore` and commit:

```bash
echo ".vercel/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore .vercel directory"
```

---

### Task 2.2: Enumerate and push environment variables

**Files:**
- Create: `scripts/list-required-env.ts`

- [ ] **Step 1: Create the env enumeration helper**

Create `scripts/list-required-env.ts`:

```ts
/**
 * Print the unique set of `process.env.*` variable names referenced in
 * src/ and scripts/. Used as input for `vercel env add` so no env var is
 * missed when standing up the Vercel project.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src", "scripts"];
const RE = /process\.env\.([A-Z][A-Z0-9_]*)/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|js|mjs)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const seen = new Set<string>();
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    let m: RegExpExecArray | null;
    while ((m = RE.exec(text)) !== null) seen.add(m[1]);
  }
}

for (const name of [...seen].sort()) console.log(name);
```

- [ ] **Step 2: Run the helper and capture the list**

Run: `npx tsx scripts/list-required-env.ts | tee env-required.txt`

Expected output (representative — confirm against actual run):
```
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NETLIFY_BLOBS_TOKEN
NETLIFY_SITE_ID
RESEND_API_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_TOKEN
UPSTASH_REDIS_REST_URL
```

`NETLIFY_*` come from the migration script — skip those when adding to Vercel.

- [ ] **Step 3: Push each var to Vercel (Preview + Production)**

For each non-Netlify var in the list, paste the value from the current Netlify dashboard into:
```bash
vercel env add <NAME> production
vercel env add <NAME> preview
```

Special-case `NEXT_PUBLIC_SITE_URL`:
- Production: `https://rockycoastdetailing.net`
- Preview: leave unset on Vercel — the app should fall back to `process.env.VERCEL_URL` (handled in Task 2.4).

- [ ] **Step 4: Pull env locally for parity check**

Run: `vercel env pull .env.vercel.local`
Compare against `.env.local`:
```bash
diff <(sort .env.local) <(sort .env.vercel.local) || echo "(see diff above)"
```
Expected: differences only in `NETLIFY_*` (not pushed to Vercel) and `NEXT_PUBLIC_SITE_URL`.

- [ ] **Step 5: Clean up the temporary list file**

```bash
rm env-required.txt .env.vercel.local
```

- [ ] **Step 6: Commit the helper script**

```bash
git add scripts/list-required-env.ts
git commit -m "chore(scripts): add env enumeration helper for Vercel setup"
```

---

### Task 2.3: Add vercel.ts and drop the --webpack flag

**Files:**
- Create: `vercel.ts`
- Modify: `package.json`

- [ ] **Step 1: Create vercel.ts**

Create `vercel.ts` at the repo root:

```ts
import type { VercelConfig } from "@vercel/config/v1";

// Minimal config. Framework auto-detection is reliable for Next.js, but we
// pin it explicitly so a future framework swap is loud. Security/cache
// headers live in next.config.ts so they apply identically on any host.
export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "prisma generate && next build",
};

export default config;
```

- [ ] **Step 2: Install the config types package**

Run: `npm install --save-dev @vercel/config`
Expected: `@vercel/config` appears in devDependencies.

- [ ] **Step 3: Drop the --webpack flag from the build script**

Edit `package.json`. Find:
```json
    "build": "prisma generate && next build --webpack",
```
Change to:
```json
    "build": "prisma generate && next build",
```

- [ ] **Step 4: Verify the build still passes locally with Turbopack**

Run: `npm run build`
Expected: build succeeds. If Turbopack reports an error, revert the build-script change (`next build --webpack`) and add a `BLOCKER` note to the PR — do not block the rest of Phase 2.

- [ ] **Step 5: Run the full test suite**

Run: `npm run typecheck && npm run test:run`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add vercel.ts package.json package-lock.json
git commit -m "chore(vercel): add vercel.ts and drop --webpack from build"
```

---

### Task 2.4: Make NEXT_PUBLIC_SITE_URL fall back to VERCEL_URL

Verify whether the app already handles missing `NEXT_PUBLIC_SITE_URL`. If so, skip steps 2–4.

- [ ] **Step 1: Confirm the two known call sites**

The codebase reads `NEXT_PUBLIC_SITE_URL` in exactly two places (verified at plan time):
- `src/app/(admin)/admin/actions.ts:123`
- `src/app/(account)/account/actions.ts:67`

Both use this pattern:
```ts
const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
```

Confirm with: `grep -rn "NEXT_PUBLIC_SITE_URL" src/`
Expected: those two lines (plus any `.test.ts` matches, which can be ignored).

- [ ] **Step 2: Update both call sites to fall back to VERCEL_URL**

In `src/app/(admin)/admin/actions.ts:123` and `src/app/(account)/account/actions.ts:67`, replace:

```ts
const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
```

with:

```ts
const base =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
```

This preserves the existing `localhost:3000` fallback for local dev, adds the `VERCEL_URL` fallback for Vercel previews, and keeps production behavior unchanged when `NEXT_PUBLIC_SITE_URL` is set.

- [ ] **Step 3: Run typecheck and tests**

Run: `npm run typecheck && npm run test:run`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "fix(site-url): fall back to VERCEL_URL when NEXT_PUBLIC_SITE_URL unset"
```

---

### Task 2.5: First Vercel deploy and verification

**Files:** none (deploy task)

- [ ] **Step 1: Trigger a preview deploy**

Run: `vercel deploy`
Expected: build succeeds; the CLI prints a preview URL.

- [ ] **Step 2: Smoke-test the preview URL**

On the preview URL:
1. Home page renders without console errors.
2. `/admin/login` accepts admin credentials and redirects to `/admin`.
3. Submit a fresh booking with one photo from an incognito window.
4. Sign in as admin, open the new booking, confirm the photo renders.

If any step fails, fix in a follow-up commit and re-deploy. Do not move on until all four are green.

- [ ] **Step 3: Promote to Vercel production URL**

Run: `vercel deploy --prod`
Expected: a `*.vercel.app` production deploy succeeds. (Custom domain is still on Netlify — only Vercel's `*.vercel.app` is affected.)

- [ ] **Step 4: Open the Phase 2 PR and merge**

The PR contains: `vercel.ts`, build script change, env helper, optional site-url fallback. Merge after preview is verified.

Phase 2 is complete when the Vercel production URL serves the site identically to Netlify production.

---

# Phase 3 — DNS Cutover + Netlify Retirement

After this phase: `rockycoastdetailing.net` is served by Vercel. Netlify is decommissioned. Vendor lock is gone.

---

### Task 3.1: Attach the custom domain to Vercel

**Files:** none

- [ ] **Step 1: Add the domain in the Vercel dashboard**

Vercel project → Settings → Domains → add `rockycoastdetailing.net` and `www.rockycoastdetailing.net`.
Expected: Vercel shows the required DNS records (A/ALIAS for apex, CNAME for www).

- [ ] **Step 2: Lower the current Netlify DNS TTL**

In whatever DNS provider hosts the zone (Cloudflare, Route53, GoDaddy, etc.), lower the TTL on the apex and `www` records to 60 seconds. Wait at least the old TTL before cutting over so the new TTL has propagated.

---

### Task 3.2: Flip DNS

**Files:** none

- [ ] **Step 1: Update DNS records**

In the DNS provider:
- Apex `A`/`ALIAS` → Vercel's IP / ALIAS target.
- `www` `CNAME` → `cname.vercel-dns.com`.

- [ ] **Step 2: Wait for propagation**

Run, in a loop until both return Vercel:
```bash
dig +short rockycoastdetailing.net
dig +short www.rockycoastdetailing.net
```
Expected: resolves to Vercel's IPs.

- [ ] **Step 3: Verify the cert is issued**

Vercel dashboard → Domains → both domains show "Valid Configuration" with a green check.

---

### Task 3.3: Production smoke test on Vercel

**Files:** none

- [ ] **Step 1: Smoke-test**

On `https://rockycoastdetailing.net`:
1. Home page renders.
2. `/admin/login` round-trips cookies, redirects to `/admin`.
3. Submit a brand-new booking with photo upload.
4. Sign in as admin, view the new booking — photo renders.
5. Generate an admin invite — confirm the email body contains a `https://rockycoastdetailing.net/...` link (not a `*.vercel.app` URL). This validates `NEXT_PUBLIC_SITE_URL` is set correctly in production.

If anything fails, see Rollback below.

- [ ] **Step 2: Watch for 24h before cleanup**

Leave Netlify and Vercel both healthy for 24 hours. If anything breaks, flip DNS back to Netlify — no code changes needed, Netlify still has the post-Phase-1 build that reads/writes the same Supabase Storage bucket.

---

### Task 3.4: Remove Netlify-specific code and config

**Files:**
- Delete: `netlify.toml`
- Delete: `scripts/migrate-netlify-blobs-to-supabase.ts`
- Modify: `package.json`

- [ ] **Step 1: Delete netlify.toml**

```bash
git rm netlify.toml
```

- [ ] **Step 2: Delete the migration script**

```bash
git rm scripts/migrate-netlify-blobs-to-supabase.ts
```

- [ ] **Step 3: Remove `@netlify/blobs` from package.json**

Run: `npm uninstall @netlify/blobs`
Expected: dependency disappears from `package.json` and `package-lock.json`.

- [ ] **Step 4: Leave eslint.config.mjs alone**

The only Netlify-related entry in `eslint.config.mjs` is `.netlify/**` in the `globalIgnores` list. That's a directory ignore, not a runtime reference — it's harmless to leave in place and removing it is busywork. Skip this step.

- [ ] **Step 5: Verify the build and tests are clean**

Run: `npm run typecheck && npm run test:run && npm run build`
Expected: all green. No remaining import of `@netlify/blobs`.

- [ ] **Step 6: Push and verify Vercel build**

```bash
git add -A
git commit -m "chore: remove Netlify-specific config and dependencies"
git push
```

Expected: Vercel preview and production deploys are green.

---

### Task 3.5: Pause the Netlify site and update memory

**Files:**
- Modify: `~/.claude/projects/C--Users-fumar-Videos-New-folder-rocky-shore-detailing/memory/project-basics.md`
- Modify: `~/.claude/projects/C--Users-fumar-Videos-New-folder-rocky-shore-detailing/memory/deployed-url.md`

- [ ] **Step 1: Disable the Netlify site**

Netlify dashboard → Site settings → General → "Stop builds" and "Lock site." Don't delete it yet — keep it paused for two weeks as a safety net.

- [ ] **Step 2: Update project-basics memory**

Replace the deploy section so it reads:

```markdown
- Deploy: **Vercel**, not Netlify. Migrated 2026-06-XX. `vercel.ts` lives at the root. Vercel project linked via `.vercel/project.json` (gitignored).
- (Netlify site `6cb7305d-41c1-4b24-92dd-87bf38652f28` remains paused for ~2 weeks as a rollback option, then will be deleted.)
```

- [ ] **Step 3: Update deployed-url memory**

The production URL is unchanged (`https://rockycoastdetailing.net`) but the host is now Vercel. Update the "How to apply" block to reference Vercel CLI / Vercel docs instead of Netlify.

- [ ] **Step 4: Final commit**

If any code is still uncommitted from earlier tasks (e.g. eslint config), commit it. The memory files are outside the repo — they don't go in git.

---

## Rollback

At any point during or after Phase 3, if production breaks:

1. **DNS rollback (preferred):** revert the DNS records to Netlify's targets. Within the lowered TTL (60s), traffic returns to Netlify. The Netlify site is still healthy and reads/writes the same Supabase Storage bucket from Phase 1, so no data is lost.
2. **Code rollback:** if the issue is code-level (rare — by Phase 3 the only code change is removing `@netlify/blobs` and the migration script), revert the latest commit and redeploy on Vercel. The DNS still points to Vercel.

---

## Success criteria

- `https://rockycoastdetailing.net` is served by Vercel.
- A brand-new booking with photos works end-to-end.
- A pre-existing booking still shows its (migrated) photos.
- Admin invite emails contain the correct production URL.
- `netlify.toml`, `@netlify/blobs`, and the migration script are gone from the repo.
- `npm run build` succeeds with `prisma generate && next build` (no `--webpack`).
- Memory entries reflect the new deploy target.
