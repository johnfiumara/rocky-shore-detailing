import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadMediaFile } from "@/lib/media/upload-flow";

// Minimal File polyfill — the node env doesn't ship one, but the upload
// flow only cares about .name, .type, .size, and being passable to fetch.
function makeFile(name: string, type: string, contents = "fake-bytes"): File {
  const blob = new Blob([contents], { type });
  return new File([blob], name, { type });
}

const SIGN_URL = "/api/media/sign";
const FINALIZE_URL = "/api/media/finalize";

describe("uploadMediaFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to /api/media/sign with filename/mime/size, PUTs to the signed URL, and finalizes", async () => {
    const file = makeFile("Sunset on the Coast.jpg", "image/jpeg", "x".repeat(123));
    const signed = {
      url: "https://example.supabase.co/storage/v1/upload/sign?token=abc",
      path: "2026/06/sunset-on-the-coast-1a2b.jpg",
      token: "abc",
    };

    const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === SIGN_URL) {
        return new Response(JSON.stringify(signed), { status: 200 });
      }
      if (url === signed.url) {
        return new Response(null, { status: 200 });
      }
      if (url === FINALIZE_URL) {
        return new Response(JSON.stringify({ id: "asset_1" }), { status: 200 });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadMediaFile(file);

    expect(result).toEqual({ id: "asset_1", path: signed.path });

    // /api/media/sign body
    const signCall = fetchMock.mock.calls.find((c) => c[0] === SIGN_URL);
    expect(signCall).toBeDefined();
    const signBody = JSON.parse((signCall![1] as RequestInit).body as string);
    expect(signBody).toEqual({
      filename: "Sunset on the Coast.jpg",
      mime: "image/jpeg",
      size: 123,
    });

    // PUT to signed URL with the raw file as body
    const putCall = fetchMock.mock.calls.find((c) => c[0] === signed.url);
    expect(putCall).toBeDefined();
    expect((putCall![1] as RequestInit).method).toBe("PUT");
    expect((putCall![1] as RequestInit).body).toBe(file);

    // /api/media/finalize body
    const finalizeCall = fetchMock.mock.calls.find((c) => c[0] === FINALIZE_URL);
    expect(finalizeCall).toBeDefined();
    const finalizeBody = JSON.parse((finalizeCall![1] as RequestInit).body as string);
    expect(finalizeBody).toEqual({ path: signed.path });
  });

  it("throws a useful error when /api/media/sign rejects with 400 (invalid mime)", async () => {
    const file = makeFile("notes.pdf", "application/pdf");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Invalid file type" }), { status: 400 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadMediaFile(file)).rejects.toThrow(/Invalid file type/);
    // Only the sign request — never attempts PUT or finalize.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the storage PUT fails (does not call finalize)", async () => {
    const file = makeFile("img.jpg", "image/jpeg");
    const signed = { url: "https://storage/upload", path: "2026/06/img-xx.jpg", token: "t" };

    const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === SIGN_URL) return new Response(JSON.stringify(signed), { status: 200 });
      if (url === signed.url) return new Response("storage error", { status: 500 });
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadMediaFile(file)).rejects.toThrow(/Upload failed/i);
    // Sign + PUT, but no finalize.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when finalize rejects (bad image dimensions or sharp failure)", async () => {
    const file = makeFile("tiny.png", "image/png");
    const signed = { url: "https://storage/upload", path: "2026/06/tiny-xx.png", token: "t" };

    const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === SIGN_URL) return new Response(JSON.stringify(signed), { status: 200 });
      if (url === signed.url) return new Response(null, { status: 200 });
      if (url === FINALIZE_URL) {
        return new Response(
          JSON.stringify({ error: "Invalid image dimensions: 40x40px." }),
          { status: 400 },
        );
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadMediaFile(file)).rejects.toThrow(/Invalid image dimensions/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
