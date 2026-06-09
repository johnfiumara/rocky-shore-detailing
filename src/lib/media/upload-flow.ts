/**
 * Client-side media upload flow. Wraps the existing /api/media/sign and
 * /api/media/finalize endpoints into a single async function so the React
 * component can stay trivial and the flow itself stays unit-testable in a
 * node-only Vitest environment.
 *
 *   sign  → returns { url, path, token } from Supabase Storage
 *   PUT   → uploads the raw File to the signed URL
 *   finalize → validates dimensions, writes media_asset row, returns { id }
 *
 * Any non-2xx response is surfaced as an Error whose message preserves the
 * API's `error` field so the UI can display it directly.
 */

export type UploadResult = {
  id: string;
  path: string;
};

type SignResponse = {
  url: string;
  path: string;
  token: string;
};

type FinalizeResponse = {
  id: string;
};

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (body && typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // body wasn't JSON — fall through
  }
  return fallback;
}

export async function uploadMediaFile(file: File): Promise<UploadResult> {
  // 1. Sign.
  const signRes = await fetch("/api/media/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mime: file.type,
      size: file.size,
    }),
  });

  if (!signRes.ok) {
    throw new Error(await readErrorMessage(signRes, "Could not start upload."));
  }

  const signed = (await signRes.json()) as SignResponse;

  // 2. PUT raw file bytes to the signed URL.
  const putRes = await fetch(signed.url, {
    method: "PUT",
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Upload failed (storage returned ${putRes.status}).`);
  }

  // 3. Finalize — validation + media_asset row.
  const finalizeRes = await fetch("/api/media/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: signed.path }),
  });

  if (!finalizeRes.ok) {
    throw new Error(await readErrorMessage(finalizeRes, "Could not finalize upload."));
  }

  const finalized = (await finalizeRes.json()) as FinalizeResponse;
  return { id: finalized.id, path: signed.path };
}
