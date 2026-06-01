import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { vehicles } from "../src/data/gallery";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BEFORE_SRC = "/gallery/brown-truck/driver-side.jpg";
const AFTER_SRC = "/gallery/brown-truck/exterior-front.jpg";

async function main() {
  const sourceImages = vehicles.flatMap((v) => v.images);
  if (sourceImages.length === 0) {
    console.log("No source images to seed.");
    return;
  }

  // Skip rows that already exist (src is not unique in schema, so query-then-insert).
  const { data: existing, error: readErr } = await supabase
    .from("GalleryImage")
    .select("src");
  if (readErr) {
    console.error("Failed to read GalleryImage:", readErr.message);
    process.exit(1);
  }
  const existingSrcs = new Set((existing ?? []).map((r) => r.src));

  let sortOrder = 0;
  for (const img of sourceImages) {
    sortOrder += 10;
    if (existingSrcs.has(img.src)) {
      console.log("Skip (exists):", img.src);
      continue;
    }
    const row = {
      vehicleId: null,
      src: img.src,
      alt: img.alt,
      label: null,
      isBefore: img.src === BEFORE_SRC,
      isAfter: img.src === AFTER_SRC,
      sortOrder,
      published: true,
    };
    const { error } = await supabase.from("GalleryImage").insert(row);
    if (error) {
      console.error("Failed to insert", img.src, error.message);
    } else {
      console.log("Inserted:", img.src);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
