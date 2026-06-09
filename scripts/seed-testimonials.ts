import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { testimonials } from "../src/data/testimonials";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    const { error } = await supabase
      .from("Testimonial")
      .upsert(
        { quote: t.quote, name: t.name, context: t.context, published: true, sortOrder: i },
        { onConflict: "quote" }
      );

    if (error) {
      console.error("Failed to upsert testimonial:", t.name, error.message);
    } else {
      console.log("Seeded testimonial:", t.name);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

