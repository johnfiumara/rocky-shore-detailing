import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { faq } from "../src/data/faq";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  for (let i = 0; i < faq.length; i++) {
    const item = faq[i];
    const { error } = await supabase
      .from("FaqItem")
      .upsert(
        { question: item.q, answer: item.a, published: true, sortOrder: i },
        { onConflict: "question" }
      );

    if (error) {
      console.error("Failed to upsert FAQ:", item.q, error.message);
    } else {
      console.log("Seeded FAQ:", item.q);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

