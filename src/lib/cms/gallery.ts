import {
  galleryGrid as staticGrid,
  beforeAfterPair as staticPair,
  type BeforeAfterPair,
} from "@/data/gallery";
import { getSetting } from "@/lib/cms/settings";
import { fetchPublishedRows } from "@/lib/cms/published-list";

export type CmsGalleryImage = { src: string; alt: string };

export async function getGalleryImages(): Promise<CmsGalleryImage[]> {
  const rows = await fetchPublishedRows<CmsGalleryImage>({
    scope: "gallery",
    noun: "gallery images",
    table: "GalleryImage",
    columns: "src, alt",
  });

  return rows ?? staticGrid;
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
  const rows = await fetchPublishedRows<PairRow>({
    scope: "gallery",
    noun: "before/after images",
    table: "GalleryImage",
    columns: "src, alt, vehicleId, isBefore, isAfter, sortOrder",
    errorMessage: "[cms:gallery] Failed to fetch before/after pair",
  });
  if (!rows) return staticPair;

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

  const label = (await getSetting<string>("gallery.before_after_label")) ?? "Recent detail";
  return {
    label,
    before: { src: before.src, alt: before.alt },
    after: { src: after.src, alt: after.alt },
  };
}
