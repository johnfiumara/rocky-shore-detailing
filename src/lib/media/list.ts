/**
 * Client-side fetcher for the staff media library. Used by MediaPicker and
 * any future picker UIs. Mirrors what /admin/media renders, fetched through
 * /api/media/list which enforces requireRole("admin","editor") server-side.
 */

export type MediaAsset = {
  id: string;
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
  url: string;
};

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (body && typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // body wasn't JSON
  }
  return fallback;
}

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const res = await fetch("/api/media/list", { method: "GET" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not load media library."));
  }
  const body = (await res.json()) as { assets?: MediaAsset[] };
  return body.assets ?? [];
}
