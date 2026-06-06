import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/media/list — returns the staff-visible media library for use by
// the MediaPicker. Same shape as /admin/media renders. Soft-deleted assets
// (deleted_at IS NOT NULL) are excluded.
export async function GET() {
  await requireRole("admin", "editor");

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("media_asset")
    .select("id, path, alt, width, height, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load media library." },
      { status: 500 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const assets = (data ?? []).map((a) => ({
    id: a.id as string,
    path: a.path as string,
    alt: (a.alt ?? "") as string,
    width: a.width as number | null,
    height: a.height as number | null,
    url: `${supabaseUrl}/storage/v1/object/public/media/${a.path as string}`,
  }));

  return NextResponse.json({ assets });
}
