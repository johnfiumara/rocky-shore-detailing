import { supabaseAnon } from "@/lib/supabase/server";
import { services as staticServices } from "@/data/services";

export type CmsService = {
  slug: string;
  title: string;
  description?: string | null;
  tiers: { size: string; price: number }[];
};

export async function getServices(): Promise<CmsService[]> {

  try {
    const { data, error } = await supabaseAnon()
      .from("Service")
      .select("slug, title, description, tiers:ServiceTier(size, price)")
      .eq("active", true)
      .order("sortOrder");

    if (error || !data || data.length === 0) {
      console.warn("[cms:services] No services found, using static fallback", {
        error: error?.message,
        timestamp: new Date().toISOString(),
      });
      return staticServices;
    }
    return data as CmsService[];
  } catch (err) {
    console.error("[cms:services] Failed to fetch services", {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return staticServices;
  }
}



