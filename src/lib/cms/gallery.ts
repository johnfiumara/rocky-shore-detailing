import { supabaseAnon } from "@/lib/supabase/server";
import {
  galleryGrid as staticGrid,
  beforeAfterPair as staticPair,
  type BeforeAfterPair,
} from "@/data/gallery";
import { getSetting } from "@/lib/cms/settings";

export type CmsGalleryImage = { src: string; alt: string };

export async function getGalleryImages(): Promise<CmsGalleryImage[]> {
  try {
    const { data, error } = await supabaseAnon()
      .from("GalleryImage")
      .select("src, alt")
      .eq("published", true)
      .order("sortOrder");
    if (error || !data || data.length === 0) {
      console.warn("[cms:gallery] No gallery images found, using static fallback", {
        error: error?.message,
        timestamp: new Date().toISOString(),
      });
      return staticGrid;
    }
    return data as CmsGalleryImage[];
  } catch (err) {
    console.error("[cms:gallery] Failed to fetch gallery images", {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return staticGrid;
  }
}

type PairRow = {
  src: string;
  alt: string;
  vehicleId: string | null;
  isBefore: boolean;
  isAfter: boolean;
  sortOrder: number;
};

export async function getBeforeAfterPair(): Promise<BeforeAfterPair> {
  try {
    const { data, error } = await supabaseAnon()
      .from("GalleryImage")
      .select("src, alt, vehicleId, isBefore, isAfter, sortOrder")
      .eq("published", true)
      .order("sortOrder");
    if (error || !data || data.length === 0) {
      console.warn("[cms:gallery] No before/after images found, using static fallback", {
        error: error?.message,
        timestamp: new Date().toISOString(),
      });
      return staticPair;
    }

    const rows = data as PairRow[];
    const before = rows.find((r) => r.isBefore);
    if (!before) {
      console.warn("[cms:gallery] No GalleryImage marked isBefore=true — using static pair", {
        timestamp: new Date().toISOString(),
      });
      return staticPair;
    }

    const after =
      rows.find((r) => r.isAfter && r.vehicleId && r.vehicleId === before.vehicleId) ??
      rows.find((r) => r.isAfter);
    if (!after) {
      console.warn("[cms:gallery] No GalleryImage marked isAfter=true — using static pair", {
        timestamp: new Date().toISOString(),
      });
      return staticPair;
    }

    const label =
      (await getSetting<string>("gallery.before_after_label")) ?? "Recent detail";
    return {
      label,
      before: { src: before.src, alt: before.alt },
      after: { src: after.src, alt: after.alt },
    };
  } catch (err) {
    console.error("[cms:gallery] Failed to fetch before/after pair", {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return staticPair;
  }
}
