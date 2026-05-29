# CMS Phase 1 — Slice 1 (Auth swap) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bcrypt + JWT cookie auth with Supabase Auth, gated by a `user_role` table and RLS. After this slice, every existing `/admin` page works identically but the operator signs in as a real Supabase Auth user with an `admin` or `editor` role. `ADMIN_JWT_SECRET` and `ADMIN_PASSWORD_HASH` are retired.

**Architecture:** Add `@supabase/ssr` for server-side session reads and writes via cookies. Replace `src/lib/session.ts` with `src/lib/auth.ts` exporting `requireRole(...roles)`. Replace `src/proxy.ts` JWT verification with a Supabase session check + `user_role` lookup. Booking-related admin pages require `admin`; content pages allow either `admin` or `editor`. Initial admin user is provisioned via a one-shot script using the Supabase service-role key.

**Tech Stack:** Next.js 16 App Router, React 19, `@supabase/supabase-js`, `@supabase/ssr`, Zod, vitest (new, for unit tests around the auth boundary).

**Spec:** [docs/superpowers/specs/2026-05-28-cms-phase-1-design.md](../specs/2026-05-28-cms-phase-1-design.md)

---

## Prerequisites (user action, before Task 1 starts)

The Supabase project itself has to exist before any code change is meaningful. The engineer running this plan does NOT do this — the project owner does, then hands over the resulting values.

Project owner does:

1. Sign in at https://supabase.com and click **New project**.
2. Name it (e.g., `rocky-shore-detailing`). Pick a region close to Maine (`us-east-1` / `Northern Virginia`).
3. Set a strong database password and **save it in a password manager**.
4. Wait ~2 minutes for the project to provision.
5. In **Project Settings → API**, copy:
   - Project URL → save as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → save as `SUPABASE_SERVICE_ROLE_KEY` (server-only, never commit, never ship to a client bundle)
6. In **Project Settings → Database → Connection string** copy the **pooled** URI (port 6543, `?pgbouncer=true`) → save as the new `DATABASE_URL` value to replace whatever is currently set.
7. In **Authentication → Providers → Email**, confirm "Enable email provider" is on, and turn OFF "Confirm email" for now (we'll wire confirmation later in Phase 1).
8. Hand the four values above to the engineer running this plan, who puts them in `.env.local` and in the production host's env settings.

Once the engineer has those four env values in `.env.local`, proceed to Task 1.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (auto)

- [ ] **Step 1: Install runtime deps**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected: both packages installed, lockfile updated, no warnings about peer dep conflicts. Supabase packages support React 19 + Next 16.

- [ ] **Step 2: Install dev deps (vitest + helpers)**

Run:
```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

Expected: vitest 3.x, testing-library 16.x, jsdom 25.x installed.

- [ ] **Step 3: Add test scripts**

Edit `package.json`. Replace:

```json
    "lint": "eslint",
    "db:generate": "prisma generate",
```

with:

```json
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run",
    "db:generate": "prisma generate",
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @supabase/{supabase-js,ssr} + vitest"
```

---

## Task 2: Configure vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/lib/__tests__/sanity.test.ts`

- [ ] **Step 1: Write vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Write setup file**

Create `src/test/setup.ts`:

```ts
// Intentionally minimal. Per-test mocks live in the test file via vi.mock.
```

- [ ] **Step 3: Write a sanity test**

Create `src/lib/__tests__/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run the test**

Run:
```bash
npm run test:run
```

Expected: 1 test passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/test/setup.ts src/lib/__tests__/sanity.test.ts package.json
git commit -m "chore(test): add vitest with a sanity test"
```

---

## Task 3: Create `user_role` SQL migration and apply it

**Files:**
- Create: `supabase/migrations/0001_user_role.sql`

Supabase SQL migrations live outside Prisma's domain because they touch `auth.users` (managed by Supabase) and use `auth.uid()`. Prisma keeps managing the app-domain tables.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_user_role.sql`:

```sql
-- Phase 1 / Slice 1: roles for CMS editors.
create table public.user_role (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.user_role enable row level security;

-- A user can read their own role row.
create policy user_role_self_read on public.user_role
  for select
  using (user_id = auth.uid());

-- Only admins can insert / update / delete role rows.
create policy user_role_admin_write on public.user_role
  for all
  using (
    exists (
      select 1 from public.user_role ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_role ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
```

- [ ] **Step 2: Apply the migration to the Supabase project**

Open the Supabase project's **SQL Editor**, paste the migration's contents, and run it.

Expected: query succeeds. `public.user_role` exists. RLS is enabled. Two policies appear under **Database → Policies**.

Alternative (if the Supabase CLI is set up): `supabase db push` from the repo root.

- [ ] **Step 3: Verify in the Supabase dashboard**

Navigate to **Table Editor → public → user_role**. Confirm the table exists, has columns `user_id`, `role`, `created_at`, and `RLS Enabled` is on.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_user_role.sql
git commit -m "feat(db): user_role table with self-read + admin-write RLS"
```

---

## Task 4: Add Supabase server + client helpers

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`

- [ ] **Step 1: Write the server helper**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Use in Server Components, route handlers, and server actions where
// you want the request's signed-in user (Supabase Auth session cookie).
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

// Anon-only Supabase client — for public Server Components in later slices
// that read published content with no user context. Stays here so all
// Supabase wiring lives in one folder.
export function supabaseAnon() {
  return createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op: anon reads never need to write cookies */
        },
      },
    },
  );
}
```

- [ ] **Step 2: Write the browser client helper**

Create `src/lib/supabase/client.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (cached) return cached;
  cached = createBrowserClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
  return cached;
}
```

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/client.ts
git commit -m "feat(supabase): server + browser client helpers via @supabase/ssr"
```

---

## Task 5: Write `src/lib/auth.ts` test-first

**Files:**
- Create: `src/lib/__tests__/auth.test.ts`
- Create: `src/lib/auth.ts`

The contract: `requireRole(...roles)` reads the Supabase session via the server helper, looks up the user's row in `user_role`, and throws (or redirects) if the role isn't allowed. Pure utility code, but the redirect call must hit the right path, so we test the role-check logic with the redirect mocked.

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/auth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted; outer variables it references must be created via vi.hoisted.
const mocks = vi.hoisted(() => {
  return {
    redirect: vi.fn((to: string) => {
      throw new Error(`__REDIRECT__:${to}`);
    }),
    supabaseMock: {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: vi.fn(async () => mocks.supabaseMock),
}));

import { requireRole } from "@/lib/auth";

function setUser(user: { id: string } | null) {
  mocks.supabaseMock.auth.getUser.mockResolvedValueOnce({
    data: { user },
    error: null,
  });
}

function setRoleLookup(role: "admin" | "editor" | null) {
  const maybeSingle = vi.fn().mockResolvedValueOnce({
    data: role ? { role } : null,
    error: null,
  });
  mocks.supabaseMock.from.mockReturnValueOnce({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    })),
  });
}

describe("requireRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /admin/login when there is no signed-in user", async () => {
    setUser(null);
    await expect(requireRole("admin")).rejects.toThrow(
      "__REDIRECT__:/admin/login",
    );
  });

  it("redirects to /admin/login when the user has no role row", async () => {
    setUser({ id: "u1" });
    setRoleLookup(null);
    await expect(requireRole("admin")).rejects.toThrow(
      "__REDIRECT__:/admin/login",
    );
  });

  it("redirects to /admin when the user has a role but not one we accept", async () => {
    setUser({ id: "u1" });
    setRoleLookup("editor");
    await expect(requireRole("admin")).rejects.toThrow(
      "__REDIRECT__:/admin",
    );
  });

  it("returns the user + role when the role matches", async () => {
    setUser({ id: "u1" });
    setRoleLookup("editor");
    const result = await requireRole("admin", "editor");
    expect(result).toEqual({ userId: "u1", role: "editor" });
  });
});
```

- [ ] **Step 2: Run tests, confirm failure**

Run:
```bash
npm run test:run
```

Expected: 4 failures in `auth.test.ts`. The `auth.ts` module doesn't exist yet.

- [ ] **Step 3: Implement `src/lib/auth.ts`**

Create `src/lib/auth.ts`:

```ts
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type Role = "admin" | "editor";

export type SessionInfo = {
  userId: string;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionInfo | null> {
  const supabase = await supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_role")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!roleRow) return null;
  return { userId: user.id, role: roleRow.role as Role };
}

export async function requireRole(...allowed: Role[]): Promise<SessionInfo> {
  const session = await getCurrentUser();
  if (!session) redirect("/admin/login");
  if (!allowed.includes(session.role)) redirect("/admin");
  return session;
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run:
```bash
npm run test:run
```

Expected: 5 passing (4 new + 1 sanity).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/__tests__/auth.test.ts
git commit -m "feat(auth): requireRole + getCurrentUser backed by Supabase + user_role"
```

---

## Task 6: Rewrite `src/proxy.ts` test-first

**Files:**
- Create: `src/__tests__/proxy.test.ts`
- Modify: `src/proxy.ts`

The proxy runs on every `/admin/*` request. It must: pass `/admin/login` through always, redirect to `/admin/login` when there's no Supabase session, and otherwise let the request proceed. Role-level access control lives inside each page/server-action via `requireRole(...)` — the proxy only checks "signed in at all."

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/proxy.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

import { proxy } from "@/proxy";

function mockRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = new URL(`http://localhost${pathname}`);
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      get: (name: string) =>
        cookies[name] ? { name, value: cookies[name] } : undefined,
      getAll: () =>
        Object.entries(cookies).map(([name, value]) => ({ name, value })),
    },
  } as unknown as NextRequest;
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("passes non-/admin paths through unchanged", async () => {
    const res = await proxy(mockRequest("/services"));
    expect(res.status).toBe(200);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("passes /admin/login through without checking the session", async () => {
    const res = await proxy(mockRequest("/admin/login"));
    expect(res.status).toBe(200);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("redirects to /admin/login when there is no signed-in user", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await proxy(mockRequest("/admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/admin/login");
  });

  it("passes /admin/* through when there is a signed-in user", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });
    const res = await proxy(mockRequest("/admin/bookings"));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests, confirm failure**

Run:
```bash
npm run test:run
```

Expected: 4 failures in `proxy.test.ts` (current proxy still uses `jose.jwtVerify` and the old cookie name).

- [ ] **Step 3: Rewrite the proxy**

Replace the entire contents of `src/proxy.ts` with:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: "/admin/:path*",
};
```

- [ ] **Step 4: Run tests, confirm pass**

Run:
```bash
npm run test:run
```

Expected: 9 passing (5 prior + 4 proxy).

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts src/__tests__/proxy.test.ts
git commit -m "feat(auth): proxy checks Supabase session, drops JWT verify"
```

---

## Task 7: Rewrite the login form + login server action

**Files:**
- Modify: `src/app/(admin)/admin/actions.ts` (login action only — others touched in Task 9)
- Modify: `src/app/(admin)/admin/login/login-form.tsx` (add email field)

- [ ] **Step 1: Replace the login action**

Open `src/app/(admin)/admin/actions.ts`. Replace the top section (lines 1-37) — the imports, `login`, and `logout` functions — with:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// ─── Auth ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function login(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    return { error: first.email?.[0] ?? first.password?.[0] ?? "Invalid form" };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password" };

  redirect("/admin");
}

export async function logout() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

The rest of `actions.ts` (the booking / customer / content actions) is updated in Task 9.

- [ ] **Step 2: Add an email field to the login form**

Replace `src/app/(admin)/admin/login/login-form.tsx` with:

```tsx
"use client";

import { useActionState } from "react";
import { login } from "../actions";

const initialState = { error: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-bone-dim mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-bone text-sm focus:outline-none focus:border-bronze"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-bone-dim mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-bone text-sm focus:outline-none focus:border-bronze"
        />
      </div>

      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full btn-primary disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: errors are limited to the remaining `requireSession` references — those are fixed in Tasks 8 and 9, not now. Confirm: no errors in `actions.ts` (the parts we just changed), `login-form.tsx`, or any Supabase code.

- [ ] **Step 4: Commit (intermediate — tsc not clean yet, that's OK)**

```bash
git add src/app/(admin)/admin/actions.ts src/app/(admin)/admin/login/login-form.tsx
git commit -m "feat(auth): login form + server action use Supabase Auth"
```

---

## Task 8: Update the admin login page bounce

**Files:**
- Modify: `src/app/(admin)/admin/login/page.tsx`

- [ ] **Step 1: Switch from `getSession` to `getCurrentUser`**

Replace `src/app/(admin)/admin/login/page.tsx` with:

```tsx
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export const metadata = { title: "Admin Login · Rocky Shore Detailing" };

export default async function LoginPage() {
  const session = await getCurrentUser();
  if (session) redirect("/admin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-bone">Rocky Shore</p>
          <p className="text-bone-dim text-sm mt-1">Admin Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(admin)/admin/login/page.tsx
git commit -m "feat(auth): login page bounces signed-in users via getCurrentUser"
```

---

## Task 9: Update every admin page guard

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(admin)/admin/schedule/page.tsx`
- Modify: `src/app/(admin)/admin/gallery/page.tsx`
- Modify: `src/app/(admin)/admin/customers/page.tsx`
- Modify: `src/app/(admin)/admin/customers/[id]/page.tsx`
- Modify: `src/app/(admin)/admin/bookings/page.tsx`
- Modify: `src/app/(admin)/admin/bookings/[id]/page.tsx`
- Modify: `src/app/(admin)/admin/content/page.tsx`

Mechanical: in each file, swap the import and the call. Bookings/customers/schedule (operational data the operator runs the business on) require `"admin"`. Content/gallery (editorial) allows `"admin"` or `"editor"`. The dashboard `/admin` allows either.

- [ ] **Step 1: Update `src/app/(admin)/admin/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin", "editor");`.

- [ ] **Step 2: Update `src/app/(admin)/admin/schedule/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin");`.

- [ ] **Step 3: Update `src/app/(admin)/admin/gallery/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin", "editor");`.

- [ ] **Step 4: Update `src/app/(admin)/admin/customers/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin");`.

- [ ] **Step 5: Update `src/app/(admin)/admin/customers/[id]/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin");`.

- [ ] **Step 6: Update `src/app/(admin)/admin/bookings/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin");`.

- [ ] **Step 7: Update `src/app/(admin)/admin/bookings/[id]/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin");`.

- [ ] **Step 8: Update `src/app/(admin)/admin/content/page.tsx`**

Change the first import from `import { requireSession } from "@/lib/session";` to `import { requireRole } from "@/lib/auth";`.

Change `await requireSession();` to `await requireRole("admin", "editor");`.

- [ ] **Step 9: Commit**

```bash
git add src/app/\(admin\)/admin
git commit -m "feat(auth): admin page guards use requireRole with admin/editor roles"
```

---

## Task 10: Update every server action in `actions.ts`

**Files:**
- Modify: `src/app/(admin)/admin/actions.ts` (lines below the auth block, replaced in Task 7)

Same role rules as page guards: booking/customer actions are admin-only; content actions allow editor.

- [ ] **Step 1: Replace every `requireSession()` call with the right `requireRole(...)`**

In `src/app/(admin)/admin/actions.ts`, replace the booking + customer + content sections (below the auth block from Task 7) with:

```ts
// ─── Bookings ───────────────────────────────────────────────────────────────

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function updateBookingAdminNotes(id: string, adminNotes: string) {
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { adminNotes } });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function updateBookingPrice(id: string, price: number) {
  await requireRole("admin");
  await prisma.booking.update({ where: { id }, data: { price } });
  revalidatePath(`/admin/bookings/${id}`);
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function updateCustomerNotes(id: string, notes: string) {
  await requireRole("admin");
  await prisma.customer.update({ where: { id }, data: { notes } });
  revalidatePath(`/admin/customers/${id}`);
}

// ─── Content: Services ──────────────────────────────────────────────────────

export async function updateServiceTierPrice(tierId: string, price: number) {
  await requireRole("admin", "editor");
  await prisma.serviceTier.update({ where: { id: tierId }, data: { price } });
  revalidatePath("/admin/content");
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  await requireRole("admin", "editor");
  await prisma.service.update({ where: { id: serviceId }, data: { active } });
  revalidatePath("/admin/content");
}

// ─── Content: Testimonials ───────────────────────────────────────────────────

export async function createTestimonial(_: unknown, formData: FormData) {
  await requireRole("admin", "editor");
  const quote = formData.get("quote") as string;
  const name = formData.get("name") as string;
  const context = formData.get("context") as string;
  if (!quote || !name || !context) return { error: "All fields are required" };
  await prisma.testimonial.create({ data: { quote, name, context } });
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteTestimonial(id: string) {
  await requireRole("admin", "editor");
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/content");
}

export async function toggleTestimonialPublished(id: string, published: boolean) {
  await requireRole("admin", "editor");
  await prisma.testimonial.update({ where: { id }, data: { published } });
  revalidatePath("/admin/content");
}

// ─── Content: FAQ ────────────────────────────────────────────────────────────

export async function createFaqItem(_: unknown, formData: FormData) {
  await requireRole("admin", "editor");
  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  if (!question || !answer) return { error: "All fields are required" };
  await prisma.faqItem.create({ data: { question, answer } });
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteFaqItem(id: string) {
  await requireRole("admin", "editor");
  await prisma.faqItem.delete({ where: { id } });
  revalidatePath("/admin/content");
}
```

Remove the old `bcrypt`, `cookies`, and `session`-related imports from the top of the file — they should all be gone after Task 7. The new imports block from Task 7 has everything needed.

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Run the test suite**

Run:
```bash
npm run test:run
```

Expected: all tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/actions.ts
git commit -m "feat(auth): admin server actions use requireRole"
```

---

## Task 11: Write the admin-provisioning script

**Files:**
- Create: `scripts/provision-admin.ts`

This is the one-shot used to create the first admin user (Aiden). It uses the service-role key, which bypasses RLS, so we can insert into `auth.users` (via the admin API) and `public.user_role` in one shot. After Phase 1, additional editors are invited from `/admin/users` (Slice 5) — this script is for the very first admin only.

- [ ] **Step 1: Write the script**

Create `scripts/provision-admin.ts`:

```ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error("Usage: tsx scripts/provision-admin.ts <email> <password>");
    process.exit(1);
  }

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Create or fetch the user.
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId: string;
  if (createErr) {
    if (!/already.*registered/i.test(createErr.message)) {
      console.error("Failed to create user:", createErr.message);
      process.exit(1);
    }
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error("Failed to list users:", listErr.message);
      process.exit(1);
    }
    const existing = list.users.find((u) => u.email === email);
    if (!existing) {
      console.error("User reported as existing but not found in list.");
      process.exit(1);
    }
    userId = existing.id;
  } else {
    userId = created.user.id;
  }

  // Upsert the admin role.
  const { error: roleErr } = await supabase
    .from("user_role")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });
  if (roleErr) {
    console.error("Failed to set role:", roleErr.message);
    process.exit(1);
  }

  console.log(`Provisioned admin: ${email} (${userId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Install `dotenv` so the script reads `.env.local`**

Run:
```bash
npm install -D dotenv
```

- [ ] **Step 3: Add the script entry**

In `package.json`, in the `scripts` block, add this line after `"db:seed"`:

```json
    "provision:admin": "tsx scripts/provision-admin.ts",
```

- [ ] **Step 4: Run the script against the dev Supabase project**

Run (substitute a real email + password):
```bash
npm run provision:admin -- you@example.com 'a-strong-password'
```

Expected output: `Provisioned admin: you@example.com (uuid…)`. In the Supabase dashboard, **Authentication → Users** shows the new user; **Table Editor → user_role** shows a row with `role = 'admin'`.

- [ ] **Step 5: Commit**

```bash
git add scripts/provision-admin.ts package.json package-lock.json
git commit -m "feat(auth): one-shot admin provisioning script"
```

---

## Task 12: Update `.env.example` and README

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Update `.env.example`**

Replace the `Admin auth` block in `.env.example` (the `ADMIN_JWT_SECRET` and `ADMIN_PASSWORD_HASH` lines) with:

```
# ─── Supabase ───────────────────────────────────────────────────────────────
# Created at https://supabase.com. Required — used by Supabase Auth (admin
# login) and by the CMS data layer.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Service-role key for one-shot scripts (scripts/provision-admin.ts) and
# server-side admin operations that bypass RLS. NEVER ship to a client bundle.
SUPABASE_SERVICE_ROLE_KEY=
```

The `DATABASE_URL` line stays — it now points at the Supabase pooled URL.

- [ ] **Step 2: Update the README env-vars table**

In `README.md`, replace the two `ADMIN_*` rows in the env-vars table with:

```
| `NEXT_PUBLIC_SUPABASE_URL` | yes | — | Supabase project URL. From **Project Settings → API**. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | — | Supabase anon key. Public by design (RLS gates access). |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | — | Server-only. Used by `scripts/provision-admin.ts` and future admin-side scripts. **Never commit, never expose.** |
```

- [ ] **Step 3: Update the README "Deploying" section, step 2**

In `README.md`, the existing "Set the required env vars" list (step 2 of Deploying) is now:

```
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
```

And add a new step after step 3 (schema push):

```
**3.5. Provision the first admin user:**

```bash
npm run provision:admin -- you@example.com 'a-strong-password'
```

Subsequent editors are invited from `/admin/users` (Phase 1 Slice 5, once shipped).
```

- [ ] **Step 4: Commit**

```bash
git add .env.example README.md
git commit -m "docs(deploy): document Supabase env vars + first-admin provisioning"
```

---

## Task 13: Delete `src/lib/session.ts`

**Files:**
- Delete: `src/lib/session.ts`

- [ ] **Step 1: Confirm no remaining references**

Run:
```bash
npx tsc --noEmit
```

Then:
```bash
git grep -n "from \"@/lib/session\"" || echo "no matches"
git grep -n "ADMIN_JWT_SECRET\|ADMIN_PASSWORD_HASH" -- ':!.env.example' ':!README.md' ':!docs/' || echo "no matches"
```

Expected: tsc clean. Both greps print "no matches".

- [ ] **Step 2: Delete the file**

Run:
```bash
git rm src/lib/session.ts
```

- [ ] **Step 3: Remove now-unused `bcryptjs` and `jose` from runtime deps**

In `package.json`, the auth swap removed every import of `bcryptjs` and `jose`. Confirm with:

```bash
git grep -n "from \"bcryptjs\"\|from \"jose\"" || echo "no matches"
```

If "no matches": remove `"bcryptjs"`, `"@types/bcryptjs"`, and `"jose"` from `package.json`'s `dependencies`. Then:

```bash
npm install
```

- [ ] **Step 4: Final type-check + test run**

Run:
```bash
npx tsc --noEmit
npm run test:run
```

Expected: zero TS errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(auth): delete src/lib/session.ts + drop bcryptjs/jose deps"
```

---

## Task 14: End-to-end smoke test

This is a manual step, not automation. Confirms the swap actually works in a real browser.

- [ ] **Step 1: Start the dev server**

Run:
```bash
npm run dev
```

- [ ] **Step 2: Verify unauthenticated redirect**

Open http://localhost:3000/admin/bookings in a fresh incognito window. Expected: browser redirects to `/admin/login`.

- [ ] **Step 3: Sign in**

On `/admin/login`, enter the email + password used in Task 11 step 4. Expected: redirect to `/admin`. The dashboard renders.

- [ ] **Step 4: Verify admin-only pages**

Click into `/admin/bookings`, `/admin/customers`, `/admin/schedule`. Each loads.

- [ ] **Step 5: Verify content pages (admin can also reach editor pages)**

Click into `/admin/content` and `/admin/gallery`. Each loads.

- [ ] **Step 6: Verify logout** (if a logout button exists in the admin nav)

Click logout. Expected: redirect to `/admin/login`. Re-visiting `/admin/bookings` redirects to login.

- [ ] **Step 7: (Optional) Verify the editor role**

In the Supabase dashboard, **Table Editor → user_role**, manually insert a row with a freshly-created Supabase Auth user (created in the dashboard) and `role = 'editor'`. Sign in as that user. Expected: `/admin/content` and `/admin/gallery` load; `/admin/bookings` redirects to `/admin`.

- [ ] **Step 8: Stop the dev server and commit nothing**

No code change. This task is verification only. If anything fails, return to the responsible task and fix.

---

## Slice complete

After Task 14 passes:

- `/admin` is gated by Supabase Auth.
- Roles enforced: `admin` for operational data, `admin | editor` for editorial.
- `ADMIN_JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `bcryptjs`, and `jose` are gone.
- 9 vitest tests cover the auth boundary (4 `requireRole`, 4 proxy, 1 sanity).
- Production deploys need the four new env vars (URL, anon key, service-role key, plus an unchanged `DATABASE_URL` pointing at Supabase Postgres) and one run of `provision:admin` per new environment.

Next: Slice 2 (Content reads). Plan it once Slice 1 is on `main`.
