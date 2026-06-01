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
    if (error || !data || data.length === 0) return staticGrid;
    return data as CmsGalleryImage[];
  } catch {
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
    if (error || !data || data.length === 0) return staticPair;

    const rows = data as PairRow[];
    const before = rows.find((r) => r.isBefore);
    if (!before) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[gallery] No GalleryImage marked isBefore=true — using static pair.");
      }
      return staticPair;
    }

    const after =
      rows.find((r) => r.isAfter && r.vehicleId && r.vehicleId === before.vehicleId) ??
      rows.find((r) => r.isAfter);
    if (!after) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[gallery] No GalleryImage marked isAfter=true — using static pair.");
      }
      return staticPair;
    }

    const label =
      (await getSetting<string>("gallery.before_after_label")) ?? "Recent detail";
    return {
      label,
      before: { src: before.src, alt: before.alt },
      after: { src: after.src, alt: after.alt },
    };
  } catch {
    return staticPair;
  }
}
