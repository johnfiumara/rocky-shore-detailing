/**
 * One-shot migration: copy every key in the Netlify Blobs `booking-photos`
 * store into the Supabase Storage `booking-photos` bucket, preserving the
 * `<bookingId>/<index>.<ext>` key format used by src/lib/booking-photos.ts.
 *
 * Idempotent: if a key already exists in Supabase, it is skipped (Supabase
 * returns a Duplicate error which we treat as success).
 *
 * Required env vars (load via .env or export before running):
 *   NETLIFY_SITE_ID         site UUID — 6cb7305d-41c1-4b24-92dd-87bf38652f28
 *   NETLIFY_BLOBS_TOKEN     personal access token with Blobs read access
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run with: `npx tsx scripts/migrate-netlify-blobs-to-supabase.ts`
 *
 * Delete this file in Phase 3 once the migration has run and DNS has cut over.
 */
import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const STORE_NAME = "booking-photos";
const BUCKET = "booking-photos";

// Mirrors EXT_CONTENT_TYPE in src/lib/booking-photos.ts. Duplicated here
// instead of imported so this one-shot script avoids pulling in
// supabaseAdmin and other module-level side effects.
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

async function main() {
  const netlify = getStore({
    name: STORE_NAME,
    siteID: requiredEnv("NETLIFY_SITE_ID"),
    token: requiredEnv("NETLIFY_BLOBS_TOKEN"),
  });

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  let total = 0;

  for await (const { blobs } of netlify.list({ paginate: true })) {
    for (const blob of blobs) {
      total++;
      const key = blob.key;
      const buf = (await netlify.get(key, { type: "arrayBuffer" })) as
        | ArrayBuffer
        | null;
      if (!buf) {
        console.warn(`[skip] ${key}: empty blob`);
        skipped++;
        continue;
      }
      const ext = key.split(".").pop()?.toLowerCase() ?? "";
      const contentType = EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, buf, { contentType, upsert: false });
      if (error) {
        // Supabase storage returns `name: "Duplicate"` / statusCode 409 when the
        // object already exists. Fall back to the message substring in case the
        // SDK changes the error shape.
        const isDuplicate =
          (error as { name?: string }).name === "Duplicate" ||
          (error as { statusCode?: string }).statusCode === "409" ||
          error.message.includes("already exists");
        if (isDuplicate) {
          skipped++;
          continue;
        }
        console.error(`[fail] ${key}: ${error.message}`);
        failed++;
        continue;
      }
      copied++;
      if (copied % 25 === 0) console.log(`...${copied} copied`);
    }
  }

  console.log(
    `\nDone. total=${total} copied=${copied} skipped=${skipped} failed=${failed}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
