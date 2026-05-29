import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import crypto from "crypto";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = /^image\/(jpeg|png|webp|gif)$/;
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  await requireRole("admin", "editor");

  const body = await request.json();
  const { filename, mime, size } = body;

  if (!ALLOWED_MIME.test(mime)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const ext = path.extname(filename).toLowerCase() || ".jpg";
  const slug = path.basename(filename, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
  const shortid = crypto.randomBytes(2).toString("hex");
  const storagePath = `${yyyy}/${mm}/${slug}-${shortid}${ext}`;

  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create upload URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: data.signedUrl,
    path: storagePath,
    token: data.token,
  });
}

