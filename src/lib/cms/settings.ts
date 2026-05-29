import { supabaseAnon } from "@/lib/supabase/server";

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabaseAnon()
      .from("site_setting")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) return null;
    return data.value as T;
  } catch {
    return null;
  }
}

export async function getSettings(): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabaseAnon()
      .from("site_setting")
      .select("key, value");

    if (error || !data) return {};
    return Object.fromEntries(data.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

