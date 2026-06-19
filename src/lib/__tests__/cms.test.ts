import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CmsGalleryImage } from "@/lib/cms/gallery";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAnon: () => supabaseMock,
}));

vi.mock("@/lib/cms/settings", () => ({
  getSetting: vi.fn().mockResolvedValue("Recent detail"),
}));

function createMockChain(data: unknown[] | null, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  return { select };
}

describe("getGalleryImages - CMS Gallery Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy Path - Valid Gallery Data", () => {
    it("should return gallery images from Supabase", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          { src: "/gallery/image1.jpg", alt: "Beautiful car detailing" },
          { src: "/gallery/image2.jpg", alt: "Professional polish" },
          { src: "/gallery/image3.jpg", alt: "Shiny exterior" },
        ])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      expect(result).toEqual([
        { src: "/gallery/image1.jpg", alt: "Beautiful car detailing" },
        { src: "/gallery/image2.jpg", alt: "Professional polish" },
        { src: "/gallery/image3.jpg", alt: "Shiny exterior" },
      ]);
      expect(result.length).toBe(3);
    });

    it("should return images with correct structure", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          { src: "/img/car1.jpg", alt: "Car 1" },
          { src: "/img/car2.jpg", alt: "Car 2" },
        ])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      result.forEach((image: CmsGalleryImage) => {
        expect(image).toHaveProperty("src");
        expect(image).toHaveProperty("alt");
        expect(typeof image.src).toBe("string");
        expect(typeof image.alt).toBe("string");
      });
    });

    it("should query with published filter", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([{ src: "/img/published.jpg", alt: "Published" }])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      await getGalleryImages();

      const selectCall = supabaseMock.from.mock.results[0].value.select;
      expect(selectCall).toHaveBeenCalledWith("src, alt");

      const eqCall = selectCall.mock.results[0].value.eq;
      expect(eqCall).toHaveBeenCalledWith("published", true);
    });

    it("should order images by sortOrder", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          { src: "/img/first.jpg", alt: "First" },
          { src: "/img/second.jpg", alt: "Second" },
        ])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      await getGalleryImages();

      const orderCall = supabaseMock.from.mock.results[0].value.select
        .mock.results[0].value.eq.mock.results[0].value.order;
      expect(orderCall).toHaveBeenCalledWith("sortOrder");
    });
  });

  describe("Error Handling - Supabase Failures", () => {
    it("should return fallback on Supabase error", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain(null, { message: "Connection timeout" })
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      // Should return static fallback
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return fallback when data is null", async () => {
      supabaseMock.from.mockReturnValueOnce(createMockChain(null));

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return fallback when data is empty", async () => {
      supabaseMock.from.mockReturnValueOnce(createMockChain([]));

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should log error when Supabase call fails", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      supabaseMock.from.mockReturnValueOnce(
        createMockChain(null, { message: "Network error" })
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      await getGalleryImages();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[cms:gallery] No gallery images found, using static fallback",
        expect.objectContaining({
          error: "Network error",
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle exceptions during fetch", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      supabaseMock.from.mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[cms:gallery] Failed to fetch gallery images",
        expect.any(Object)
      );
      expect(Array.isArray(result)).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge Cases - Data Validation", () => {
    it("should handle images with missing alt text", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          { src: "/img/no-alt.jpg", alt: "" },
          { src: "/img/no-alt2.jpg", alt: null },
        ])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      expect(result.length).toBe(2);
    });

    it("should handle images with special characters", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/img/car-&-details.jpg",
            alt: "Car & detail <special> image",
          },
        ])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      expect(result[0].src).toContain("&");
      expect(result[0].alt).toContain("&");
    });

    it("should handle very large image URLs", async () => {
      const longUrl = "/img/" + "a".repeat(1000) + ".jpg";
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([{ src: longUrl, alt: "Long URL" }])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");
      const result = await getGalleryImages();

      expect(result[0].src).toBe(longUrl);
    });
  });

  describe("Cache Behavior (if implemented)", () => {
    it("should call Supabase every time if no caching", async () => {
      supabaseMock.from.mockReturnValue(
        createMockChain([{ src: "/img/test.jpg", alt: "Test" }])
      );

      const { getGalleryImages } = await import("@/lib/cms/gallery");

      await getGalleryImages();
      await getGalleryImages();

      // Should call supabase twice (no caching)
      expect(supabaseMock.from).toHaveBeenCalledTimes(2);
    });
  });
});

describe("getBeforeAfterPair - Before/After Image Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy Path - Valid Before/After Data", () => {
    it("should return matching before/after pair from same vehicle", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/gallery/before.jpg",
            alt: "Before detailing",
            vehicleId: "v1",
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
          {
            src: "/gallery/after.jpg",
            alt: "After detailing",
            vehicleId: "v1",
            isBefore: false,
            isAfter: true,
            sortOrder: 2,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(result.before.src).toBe("/gallery/before.jpg");
      expect(result.after.src).toBe("/gallery/after.jpg");
      expect(result.before.alt).toBe("Before detailing");
      expect(result.after.alt).toBe("After detailing");
    });

    it("should return pair with label from settings", async () => {
      const { getSetting } = await import("@/lib/cms/settings");
      vi.mocked(getSetting).mockResolvedValueOnce("Recent detail · client pickup");

      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before",
            vehicleId: "v1",
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
          {
            src: "/a.jpg",
            alt: "After",
            vehicleId: "v1",
            isBefore: false,
            isAfter: true,
            sortOrder: 2,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(result.label).toBe("Recent detail · client pickup");
    });

    it("should have correct structure", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before",
            vehicleId: "v1",
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
          {
            src: "/a.jpg",
            alt: "After",
            vehicleId: "v1",
            isBefore: false,
            isAfter: true,
            sortOrder: 2,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(result).toHaveProperty("label");
      expect(result).toHaveProperty("before");
      expect(result).toHaveProperty("after");
      expect(result.before).toHaveProperty("src");
      expect(result.before).toHaveProperty("alt");
      expect(result.after).toHaveProperty("src");
      expect(result.after).toHaveProperty("alt");
    });
  });

  describe("Matching Logic", () => {
    it("should match after image in same vehicle as before", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before",
            vehicleId: "vehicle-1",
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
          {
            src: "/a-wrong.jpg",
            alt: "Wrong after",
            vehicleId: "vehicle-2",
            isBefore: false,
            isAfter: true,
            sortOrder: 2,
          },
          {
            src: "/a-correct.jpg",
            alt: "Correct after",
            vehicleId: "vehicle-1",
            isBefore: false,
            isAfter: true,
            sortOrder: 3,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(result.after.src).toBe("/a-correct.jpg");
    });

    it("should fallback to any after image when no same-vehicle match", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before",
            vehicleId: null,
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
          {
            src: "/a.jpg",
            alt: "After",
            vehicleId: "vehicle-2",
            isBefore: false,
            isAfter: true,
            sortOrder: 2,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(result.before.src).toBe("/b.jpg");
      expect(result.after.src).toBe("/a.jpg");
    });

    it("should return fallback when no isBefore exists", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/a.jpg",
            alt: "After only",
            vehicleId: "v1",
            isBefore: false,
            isAfter: true,
            sortOrder: 1,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      // Should return static fallback
      expect(result).toHaveProperty("label");
      expect(result).toHaveProperty("before");
      expect(result).toHaveProperty("after");
    });

    it("should return fallback when no isAfter exists", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before only",
            vehicleId: "v1",
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      // Should return static fallback
      expect(result).toHaveProperty("label");
      expect(result).toHaveProperty("before");
      expect(result).toHaveProperty("after");
    });
  });

  describe("Error Handling", () => {
    it("should return fallback on Supabase error", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain(null, { message: "Error" })
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(result).toHaveProperty("label");
      expect(result).toHaveProperty("before");
      expect(result).toHaveProperty("after");
    });

    it("should return fallback on exception", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      supabaseMock.from.mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[cms:gallery] Failed to fetch before/after pair",
        expect.any(Object)
      );
      expect(result).toHaveProperty("label");

      consoleErrorSpy.mockRestore();
    });

    it("should log warning when empty data returned", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      supabaseMock.from.mockReturnValueOnce(createMockChain([]));

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      await getBeforeAfterPair();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[cms:gallery] No before/after images found, using static fallback",
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });

    it("should log warning when no isBefore found", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/a.jpg",
            alt: "After",
            vehicleId: "v1",
            isBefore: false,
            isAfter: true,
            sortOrder: 1,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      await getBeforeAfterPair();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[cms:gallery] No GalleryImage marked isBefore=true — using static pair",
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });

    it("should log warning when no isAfter found", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before",
            vehicleId: "v1",
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      await getBeforeAfterPair();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[cms:gallery] No GalleryImage marked isAfter=true — using static pair",
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Data Validation", () => {
    it("should handle null vehicleIds correctly", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before",
            vehicleId: null,
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
          {
            src: "/a.jpg",
            alt: "After",
            vehicleId: null,
            isBefore: false,
            isAfter: true,
            sortOrder: 2,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      expect(result.before.src).toBe("/b.jpg");
      expect(result.after.src).toBe("/a.jpg");
    });

    it("should handle mixed null and non-null vehicleIds", async () => {
      supabaseMock.from.mockReturnValueOnce(
        createMockChain([
          {
            src: "/b.jpg",
            alt: "Before",
            vehicleId: "v1",
            isBefore: true,
            isAfter: false,
            sortOrder: 1,
          },
          {
            src: "/a1.jpg",
            alt: "After different vehicle",
            vehicleId: "v2",
            isBefore: false,
            isAfter: true,
            sortOrder: 2,
          },
          {
            src: "/a2.jpg",
            alt: "After same vehicle",
            vehicleId: "v1",
            isBefore: false,
            isAfter: true,
            sortOrder: 3,
          },
        ])
      );

      const { getBeforeAfterPair } = await import("@/lib/cms/gallery");
      const result = await getBeforeAfterPair();

      // Should match v1 after with v1 before
      expect(result.after.src).toBe("/a2.jpg");
    });
  });
});
