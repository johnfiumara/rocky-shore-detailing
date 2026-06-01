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

  if (!pathname.startsWith("/admin")) return NextResponse.next({ request });
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next({ request });
  }

  // Canonical Supabase SSR middleware pattern: response is rebuilt inside
  // setAll so refreshed cookies propagate both to the next handler (via
  // request) and back to the browser (via response). See:
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: nothing between createServerClient and getUser() — Supabase
  // docs warn this can cause subtle session-loss bugs.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    // Copy any refreshed cookies onto the redirect so the next request
    // doesn't get stuck in a bounce loop.
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    supabaseResponse.cookies.getAll().forEach((c) =>
      redirect.cookies.set(c.name, c.value, c),
    );
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: "/admin/:path*",
};
