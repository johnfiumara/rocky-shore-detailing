import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchMediaAssets } from "@/lib/media/list";

describe("fetchMediaAssets", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls /api/media/list and returns the parsed assets array", async () => {
    const assets = [
      { id: "a1", path: "2026/06/foo.jpg", alt: "foo", width: 1200, height: 800, url: "https://x.supabase.co/storage/v1/object/public/media/2026/06/foo.jpg" },
      { id: "a2", path: "2026/06/bar.png", alt: "", width: null, height: null, url: "https://x.supabase.co/storage/v1/object/public/media/2026/06/bar.png" },
    ];
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ assets }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchMediaAssets();
    expect(result).toEqual(assets);
    expect(fetchMock).toHaveBeenCalledWith("/api/media/list", expect.objectContaining({ method: "GET" }));
  });

  it("throws a useful error when /api/media/list returns 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Could not load media library." }), { status: 500 }),
      ),
    );

    await expect(fetchMediaAssets()).rejects.toThrow(/Could not load media library/);
  });

  it("returns an empty array when the response has no assets field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })),
    );

    const result = await fetchMediaAssets();
    expect(result).toEqual([]);
  });
});
