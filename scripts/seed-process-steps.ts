import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { processSteps } from "../src/data/process-steps";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  for (let i = 0; i < processSteps.length; i++) {
    const step = processSteps[i];
    const { error } = await supabase
      .from("ProcessStep")
      .upsert(
        { title: step.title, body: step.body, published: true, sortOrder: i },
        { onConflict: "title" }
      );

    if (error) {
      console.error("Failed to upsert process step:", step.title, error.message);
    } else {
      console.log("Seeded process step:", step.title);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

