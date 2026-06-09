"use client";

import { createBrowserClient } from "@supabase/ssr";

let cached: ReturnType<typeof createBrowserClient> | null = null;

function getBrowserEnv(): { url: string; key: string } {
  // Access env vars literally so Next.js can inline them for the browser bundle.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return { url, key };
}

export function supabaseBrowser() {
  if (cached) return cached;
  const { url, key } = getBrowserEnv();
  cached = createBrowserClient(url, key);
  return cached;
}
