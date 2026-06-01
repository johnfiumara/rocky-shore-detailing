import { supabaseAnon } from "@/lib/supabase/server";

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabaseAnon()
      .from("site_setting")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) {
      if (error?.code !== "PGRST116") { // PGRST116 is "not found" — expected
        console.warn("[cms:settings] Failed to fetch setting", {
          key,
          error: error?.message,
          code: error?.code,
          timestamp: new Date().toISOString(),
        });
      }
      return null;
    }
    return data.value as T;
  } catch (err) {
    console.error("[cms:settings] Error fetching setting", {
      key,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}

export async function getSettings(): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabaseAnon()
      .from("site_setting")
      .select("key, value");

    if (error || !data) {
      console.warn("[cms:settings] Failed to fetch all settings", {
        error: error?.message,
        timestamp: new Date().toISOString(),
      });
      return {};
    }
    return Object.fromEntries(data.map((r) => [r.key, r.value]));
  } catch (err) {
    console.error("[cms:settings] Error fetching all settings", {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return {};
  }
}

