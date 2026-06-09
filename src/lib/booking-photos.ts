import { getStore, getDeployStore } from "@netlify/blobs";

const STORE_NAME = "booking-photos";

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
};

// Site-level store in production so photos survive redeploys; deploy-scoped
// elsewhere so preview/branch uploads don't pollute the production store.
// When the deploy context is unknown (e.g. local tooling) we default to the
// persistent site store.
function photoStore() {
  const deployContext = (
    globalThis as {
      Netlify?: { context?: { deploy?: { context?: string } } };
    }
  ).Netlify?.context?.deploy?.context;

  return deployContext && deployContext !== "production"
    ? getDeployStore(STORE_NAME)
    : getStore(STORE_NAME);
}

function extFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && EXT_CONTENT_TYPE[fromName]) return fromName;
  const fromType = file.type.split("/").pop()?.toLowerCase();
  if (fromType && EXT_CONTENT_TYPE[fromType]) return fromType;
  return "jpg";
}

/** Content type to serve a stored photo with, inferred from its key extension. */
export function contentTypeForKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";
}

/**
 * Persist the photos a customer uploaded with a booking. Keys are namespaced
 * by booking id (`<bookingId>/<index>.<ext>`) so they're easy to scope and
 * validate when serving. Returns the stored keys.
 */
export async function storeBookingPhotos(
  bookingId: string,
  files: File[],
): Promise<string[]> {
  if (files.length === 0) return [];

  const store = photoStore();
  const keys: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const key = `${bookingId}/${i}.${extFor(file)}`;
    await store.set(key, await file.arrayBuffer());
    keys.push(key);
  }
  return keys;
}

/** Fetch a stored booking photo by key, or null if it doesn't exist. */
export async function getBookingPhoto(key: string): Promise<ArrayBuffer | null> {
  const store = photoStore();
  return (await store.get(key, { type: "arrayBuffer" })) as ArrayBuffer | null;
}
