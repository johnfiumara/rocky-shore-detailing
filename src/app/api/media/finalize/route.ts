import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireRole("admin", "editor");

  const { path } = await request.json();

  const supabase = await supabaseServer();

  const { data: fileData, error: downloadErr } = await supabase.storage
    .from("media")
    .download(path);

  if (downloadErr || !fileData) {
    return NextResponse.json(
      { error: downloadErr?.message ?? "Download failed" },
      { status: 500 }
    );
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  const blurBuffer = await sharp(buffer).resize(10).blur().toBuffer();
  const blurDataURL = `data:image/${metadata.format};base64,${blurBuffer.toString("base64")}`;

  const { data: asset, error: insertErr } = await supabase
    .from("media_asset")
    .insert({
      path,
      mime: metadata.format ? `image/${metadata.format}` : "image/jpeg",
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      blur_data_url: blurDataURL,
    })
    .select("id")
    .single();

  if (insertErr || !asset) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: asset.id });
}

