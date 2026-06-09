import { prisma } from "@/lib/prisma";
import {
  galleryGrid as staticGrid,
  beforeAfterPair as staticPair,
  type BeforeAfterPair,
} from "@/data/gallery";

export type CmsGalleryImage = { src: string; alt: string };

/**
 * Published gallery tiles from the database, ordered by `sortOrder`.
 * Falls back to the static grid when the table is empty or unreachable,
 * so the site always renders.
 */
export async function getGalleryImages(): Promise<CmsGalleryImage[]> {
  try {
    const rows = await prisma.galleryImage.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: { src: true, alt: true },
    });
    return rows.length > 0 ? rows : staticGrid;
  } catch {
    return staticGrid;
  }
}

/**
 * Best before/after pair from the database: the first image flagged
 * `isBefore`, matched to an `isAfter` from the same vehicle when possible
 * (otherwise any `isAfter`). Falls back to the static pair when no suitable
 * pair exists or the query fails.
 */
export async function getBeforeAfterPair(): Promise<BeforeAfterPair> {
  try {
    const rows = await prisma.galleryImage.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: { src: true, alt: true, vehicleId: true, isBefore: true, isAfter: true },
    });
    if (rows.length === 0) return staticPair;

    const before = rows.find((row) => row.isBefore);
    if (!before) return staticPair;

    const after =
      rows.find((row) => row.isAfter && row.vehicleId && row.vehicleId === before.vehicleId) ??
      rows.find((row) => row.isAfter);
    if (!after) return staticPair;

    return {
      label: staticPair.label,
      before: { src: before.src, alt: before.alt },
      after: { src: after.src, alt: after.alt },
    };
  } catch {
    return staticPair;
  }
}
