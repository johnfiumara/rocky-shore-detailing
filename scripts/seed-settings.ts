import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const settings = [
    { key: "contact.phone", value: "(207) 555-0100" },
    { key: "contact.email", value: "hello@rockyshoredetailing.com" },
    { key: "contact.instagram", value: "@rockyshore" },
    {
      key: "contact.hours",
      value: {
        weekday: "Mon – Fri · 8a – 6p",
        saturday: "Saturday · 9a – 4p",
        sunday: "Sunday · by appointment",
      },
    },
    {
      key: "site.tagline",
      value:
        "Mobile auto detailing by Aiden Quinn. From Kittery to Madawaska — we bring the studio to your driveway.",
    },
    { key: "hero.headline", value: "Glass-deep" },
    { key: "hero.subheadline", value: "finish, by hand." },
    { key: "gallery.before_after_label", value: "Recent detail · client pickup" },
  ];

  for (const s of settings) {
    const { error } = await supabase
      .from("site_setting")
      .upsert({ key: s.key, value: s.value }, { onConflict: "key" });

    if (error) {
      console.error("Failed to seed setting:", s.key, error.message);
    } else {
      console.log("Seeded setting:", s.key);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

