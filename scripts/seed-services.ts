import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { services } from "../src/data/services";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const { data: service, error } = await supabase
      .from("Service")
      .upsert(
        { slug: s.slug, title: s.title, active: true, sortOrder: i },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error || !service) {
      console.error("Failed to upsert service:", s.slug, error?.message);
      continue;
    }

    for (const t of s.tiers) {
      await supabase
        .from("ServiceTier")
        .upsert(
          { serviceId: service.id, size: t.size, price: t.price },
          { onConflict: "serviceId,size" }
        );
    }

    console.log("Seeded service:", s.slug);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

