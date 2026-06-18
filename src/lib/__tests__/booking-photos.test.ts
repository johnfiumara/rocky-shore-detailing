import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks so the imported module under test uses them.
const storageMock = vi.hoisted(() => {
  const upload = vi.fn();
  const download = vi.fn();
  return {
    upload,
    download,
    from: vi.fn(() => ({ upload, download })),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: vi.fn(() => ({ storage: storageMock })),
}));

import {
  storeBookingPhotos,
  getBookingPhoto,
  contentTypeForKey,
} from "@/lib/booking-photos";

function fakeFile(name: string, type: string, body = "x"): File {
  return new File([body], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  storageMock.upload.mockResolvedValue({ data: { path: "ok" }, error: null });
  storageMock.download.mockResolvedValue({ data: null, error: null });
});

describe("contentTypeForKey", () => {
  it("maps known extensions", () => {
    expect(contentTypeForKey("abc/0.jpg")).toBe("image/jpeg");
    expect(contentTypeForKey("abc/1.JPEG")).toBe("image/jpeg");
    expect(contentTypeForKey("abc/2.png")).toBe("image/png");
    expect(contentTypeForKey("abc/3.webp")).toBe("image/webp");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(contentTypeForKey("abc/0.xyz")).toBe("application/octet-stream");
    expect(contentTypeForKey("noext")).toBe("application/octet-stream");
  });
});

describe("storeBookingPhotos", () => {
  it("returns empty array for no files", async () => {
    const keys = await storeBookingPhotos("b1", []);
    expect(keys).toEqual([]);
    expect(storageMock.upload).not.toHaveBeenCalled();
  });

  it("uploads each file under <bookingId>/<index>.<ext> and returns the keys", async () => {
    const files = [
      fakeFile("front.jpg", "image/jpeg"),
      fakeFile("side.png", "image/png"),
    ];

    const keys = await storeBookingPhotos("book-123", files);

    expect(keys).toEqual(["book-123/0.jpg", "book-123/1.png"]);
    expect(storageMock.from).toHaveBeenCalledWith("booking-photos");
    expect(storageMock.upload).toHaveBeenCalledTimes(2);
    expect(storageMock.upload).toHaveBeenNthCalledWith(
      1,
      "book-123/0.jpg",
      expect.any(ArrayBuffer),
      { contentType: "image/jpeg", upsert: false },
    );
    expect(storageMock.upload).toHaveBeenNthCalledWith(
      2,
      "book-123/1.png",
      expect.any(ArrayBuffer),
      { contentType: "image/png", upsert: false },
    );
  });

  it("infers extension from MIME when filename has no usable extension", async () => {
    const files = [fakeFile("blob", "image/webp")];
    const keys = await storeBookingPhotos("b2", files);
    expect(keys).toEqual(["b2/0.webp"]);
  });

  it("throws if Supabase Storage returns an error", async () => {
    storageMock.upload.mockResolvedValueOnce({
      data: null,
      error: { message: "bucket disabled" },
    });
    await expect(
      storeBookingPhotos("b3", [fakeFile("x.jpg", "image/jpeg")]),
    ).rejects.toThrow(/bucket disabled/);
  });
});

describe("getBookingPhoto", () => {
  it("returns the ArrayBuffer when the key exists", async () => {
    const buf = new TextEncoder().encode("hello").buffer;
    storageMock.download.mockResolvedValueOnce({
      data: new Blob([buf]),
      error: null,
    });

    const got = await getBookingPhoto("b1/0.jpg");

    expect(storageMock.from).toHaveBeenCalledWith("booking-photos");
    expect(storageMock.download).toHaveBeenCalledWith("b1/0.jpg");
    expect(got).toBeInstanceOf(ArrayBuffer);
    expect(new TextDecoder().decode(got!)).toBe("hello");
  });

  it("returns null when the key does not exist", async () => {
    storageMock.download.mockResolvedValueOnce({
      data: null,
      error: { message: "Object not found", statusCode: "404" },
    });
    const got = await getBookingPhoto("missing/0.jpg");
    expect(got).toBeNull();
  });
});
