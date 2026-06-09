import { describe, it, expect, vi, beforeEach } from "vitest";
import { beforeAfterPair as staticPair, galleryGrid as staticGrid } from "@/data/gallery";

const findMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { galleryImage: { findMany } },
}));

beforeEach(() => {
  findMany.mockReset();
});

describe("getGalleryImages", () => {
  it("returns published rows from the database when present", async () => {
    findMany.mockResolvedValueOnce([
      { src: "/a.jpg", alt: "a" },
      { src: "/b.jpg", alt: "b" },
    ]);
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toEqual([
      { src: "/a.jpg", alt: "a" },
      { src: "/b.jpg", alt: "b" },
    ]);
  });

  it("falls back to the static grid when the table is empty", async () => {
    findMany.mockResolvedValueOnce([]);
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toBe(staticGrid);
  });

  it("falls back to the static grid on a query error", async () => {
    findMany.mockRejectedValueOnce(new Error("boom"));
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toBe(staticGrid);
  });
});

describe("getBeforeAfterPair", () => {
  it("pairs the first isBefore with an isAfter from the same vehicle", async () => {
    findMany.mockResolvedValueOnce([
      { src: "/b1.jpg", alt: "b1", vehicleId: "v1", isBefore: true, isAfter: false },
      { src: "/a1.jpg", alt: "a1", vehicleId: "v1", isBefore: false, isAfter: true },
      { src: "/a2.jpg", alt: "a2", vehicleId: "v2", isBefore: false, isAfter: true },
    ]);
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toEqual({
      label: staticPair.label,
      before: { src: "/b1.jpg", alt: "b1" },
      after: { src: "/a1.jpg", alt: "a1" },
    });
  });

  it("falls back to any isAfter when no same-vehicle match exists", async () => {
    findMany.mockResolvedValueOnce([
      { src: "/b1.jpg", alt: "b1", vehicleId: null, isBefore: true, isAfter: false },
      { src: "/a1.jpg", alt: "a1", vehicleId: "v2", isBefore: false, isAfter: true },
    ]);
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result.before.src).toBe("/b1.jpg");
    expect(result.after.src).toBe("/a1.jpg");
  });

  it("returns the static pair when no isBefore exists", async () => {
    findMany.mockResolvedValueOnce([
      { src: "/a1.jpg", alt: "a1", vehicleId: null, isBefore: false, isAfter: true },
    ]);
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toBe(staticPair);
  });

  it("returns the static pair on a query error", async () => {
    findMany.mockRejectedValueOnce(new Error("boom"));
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toBe(staticPair);
  });
});
