import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "booking-photos";

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

function bucket() {
  return supabaseAdmin().storage.from(BUCKET);
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

  const keys: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = extFor(file);
    const key = `${bookingId}/${i}.${ext}`;
    const { error } = await bucket().upload(key, await file.arrayBuffer(), {
      contentType: contentTypeForKey(key),
      upsert: false,
    });
    if (error) {
      throw new Error(
        `Failed to upload booking photo ${key}: ${error.message}`,
      );
    }
    keys.push(key);
  }
  return keys;
}

/** Fetch a stored booking photo by key, or null if it doesn't exist. */
export async function getBookingPhoto(key: string): Promise<ArrayBuffer | null> {
  const { data, error } = await bucket().download(key);
  if (error || !data) return null;
  return await data.arrayBuffer();
}
