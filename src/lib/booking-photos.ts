/**
 * Persistence for customer-uploaded vehicle photos attached to a booking.
 *
 * Photos are unstructured binary objects, so they live in a site-level
 * Netlify Blobs store (persisting across deploys) rather than the Postgres
 * database. The blob keys are stored on the Booking row so they can be listed
 * and served back without relying on eventual-consistent prefix listing.
 *
 * Key format: `bookings/<bookingId>/<index>-<sanitized-filename>`
 */

import { getStore } from "@netlify/blobs";

const STORE_NAME = "booking-photos";

function store() {
  return getStore(STORE_NAME);
}

function sanitizeName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return cleaned || "photo";
}

/**
 * Uploads the given files to the blob store under the booking's prefix and
 * returns the stored keys (in upload order). Each blob records its original
 * filename and content type as metadata so it can be served back correctly.
 */
export async function saveBookingPhotos(
  bookingId: string,
  files: File[],
): Promise<string[]> {
  const s = store();
  const keys: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const key = `bookings/${bookingId}/${i}-${sanitizeName(file.name)}`;
    const buffer = await file.arrayBuffer();
    await s.set(key, buffer, {
      metadata: {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      },
    });
    keys.push(key);
  }

  return keys;
}

export type BookingPhoto = {
  body: ArrayBuffer;
  contentType: string;
};

/**
 * Reads a single stored photo. Returns null when the key does not exist.
 */
export async function getBookingPhoto(
  key: string,
): Promise<BookingPhoto | null> {
  const result = await store().getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) return null;
  const contentType =
    typeof result.metadata?.contentType === "string"
      ? result.metadata.contentType
      : "application/octet-stream";
  return { body: result.data, contentType };
}
