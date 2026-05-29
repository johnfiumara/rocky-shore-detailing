import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireRole("admin", "editor");

  const supabase = await supabaseServer();
  const { data: settings, error } = await supabase
    .from("site_setting")
    .select("key, value")
    .order("key");

  if (error) throw error;

  const byKey = Object.fromEntries(settings?.map((s) => [s.key, s.value]) ?? []);

  async function saveSetting(formData: FormData) {
    "use server";
    await requireRole("admin", "editor");
    const key = formData.get("key") as string;
    const raw = formData.get("value") as string;
    let parsed: unknown = raw;
    try { parsed = JSON.parse(raw); } catch { /* keep string */ }
    const sb = await supabaseServer();
    await sb.from("site_setting").upsert({ key, value: parsed }, { onConflict: "key" });
    revalidatePath("/admin/settings");
  }

  const knownKeys = [
    "contact.phone",
    "contact.email",
    "contact.instagram",
    "site.tagline",
    "hero.headline",
    "hero.subheadline",
  ];

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-display text-bone">Site Settings</h1>

      <div className="space-y-4">
        {knownKeys.map((key) => {
          const val = byKey[key];
          const display = typeof val === "object" && val !== null ? JSON.stringify(val) : (val as string) ?? "";
          return (
            <form key={key} action={saveSetting} className="border border-line rounded-xl p-4 space-y-3">
              <label className="text-bone-dim text-xs uppercase tracking-wider">{key}</label>
              <input type="hidden" name="key" value={key} />
              <input
                name="value"
                defaultValue={display}
                className="w-full bg-ink border border-line rounded-lg px-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
              />
              <button type="submit" className="btn-primary text-sm">Save</button>
            </form>
          );
        })}
      </div>
    </div>
  );
}

