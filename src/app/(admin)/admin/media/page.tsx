import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Image from "next/image";

export const metadata = { title: "Media Library" };

export default async function MediaPage() {
  await requireRole("admin", "editor");

  const supabase = await supabaseServer();
  const { data: assets, error } = await supabase
    .from("media_asset")
    .select("id, path, alt, width, height, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const publicUrl = (path: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;

  async function updateAlt(formData: FormData) {
    "use server";
    await requireRole("admin", "editor");
    const id = formData.get("id") as string;
    const alt = formData.get("alt") as string;
    const sb = await supabaseServer();
    await sb.from("media_asset").update({ alt }).eq("id", id);
    revalidatePath("/admin/media");
  }

  async function softDelete(formData: FormData) {
    "use server";
    await requireRole("admin", "editor");
    const id = formData.get("id") as string;
    const sb = await supabaseServer();
    await sb.from("media_asset").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/admin/media");
  }

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-bone">Media Library</h1>
        <p className="text-bone-dim text-sm">{assets?.length ?? 0} assets</p>
      </div>

      {(!assets || assets.length === 0) && (
        <div className="border border-line rounded-xl p-12 text-center text-bone-dim text-sm">
          No media assets yet. Use the Upload button below to add images.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {assets?.map((a) => (
          <div key={a.id} className="border border-line rounded-xl overflow-hidden group">
            <div className="relative aspect-square bg-ink">
              <Image
                src={publicUrl(a.path)}
                alt={a.alt}
                fill
                className="object-cover"
                sizes="20vw"
              />
            </div>
            <div className="p-3 space-y-2">
              <form action={updateAlt} className="flex gap-2">
                <input type="hidden" name="id" value={a.id} />
                <input
                  name="alt"
                  defaultValue={a.alt}
                  placeholder="Alt text"
                  className="flex-1 bg-ink border border-line rounded px-2 py-1 text-bone text-xs focus:outline-none focus:border-bronze"
                />
                <button
                  type="submit"
                  className="text-xs bg-bronze/20 hover:bg-bronze/30 text-bronze px-2 py-1 rounded transition-colors"
                >
                  Save
                </button>
              </form>
              <form action={softDelete}>
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  className="w-full text-xs bg-red-400/10 hover:bg-red-400/20 text-red-400 py-1 rounded transition-colors"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

