import { describe, it, expect, vi } from "vitest";
import { beforeAfterPair as staticPair, galleryGrid as staticGrid } from "@/data/gallery";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAnon: () => supabaseMock,
}));

vi.mock("@/lib/cms/settings", () => ({
  getSetting: vi.fn().mockResolvedValue("Recent detail · client pickup"),
}));

function chain(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  return { select };
}

describe("getGalleryImages", () => {
  it("returns rows from Supabase when present", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([{ src: "/a.jpg", alt: "a" }, { src: "/b.jpg", alt: "b" }]),
    );
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toEqual([
      { src: "/a.jpg", alt: "a" },
      { src: "/b.jpg", alt: "b" },
    ]);
  });

  it("falls back to static grid when Supabase returns empty", async () => {
    supabaseMock.from.mockReturnValueOnce(chain([]));
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toBe(staticGrid);
  });

  it("falls back to static grid on Supabase error", async () => {
    supabaseMock.from.mockReturnValueOnce(chain(null, { message: "boom" }));
    const { getGalleryImages } = await import("@/lib/cms/gallery");
    const result = await getGalleryImages();
    expect(result).toBe(staticGrid);
  });
});

describe("getBeforeAfterPair", () => {
  it("pairs first isBefore with first isAfter in same vehicle", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([
        { src: "/b1.jpg", alt: "b1", vehicleId: "v1", isBefore: true, isAfter: false, sortOrder: 10 },
        { src: "/a1.jpg", alt: "a1", vehicleId: "v1", isBefore: false, isAfter: true, sortOrder: 20 },
        { src: "/a2.jpg", alt: "a2", vehicleId: "v2", isBefore: false, isAfter: true, sortOrder: 30 },
      ]),
    );
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toEqual({
      label: "Recent detail · client pickup",
      before: { src: "/b1.jpg", alt: "b1" },
      after: { src: "/a1.jpg", alt: "a1" },
    });
  });

  it("falls back to any isAfter when no same-vehicle match", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([
        { src: "/b1.jpg", alt: "b1", vehicleId: null, isBefore: true, isAfter: false, sortOrder: 10 },
        { src: "/a1.jpg", alt: "a1", vehicleId: "v2", isBefore: false, isAfter: true, sortOrder: 20 },
      ]),
    );
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result.before.src).toBe("/b1.jpg");
    expect(result.after.src).toBe("/a1.jpg");
  });

  it("returns static pair when no isBefore exists", async () => {
    supabaseMock.from.mockReturnValueOnce(
      chain([
        { src: "/a1.jpg", alt: "a1", vehicleId: null, isBefore: false, isAfter: true, sortOrder: 10 },
      ]),
    );
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toBe(staticPair);
  });

  it("returns static pair on Supabase error", async () => {
    supabaseMock.from.mockReturnValueOnce(chain(null, { message: "boom" }));
    const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
    const result = await getBeforeAfterPair();
    expect(result).toBe(staticPair);
  });
});
