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
