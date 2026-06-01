import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation constraints
const IMAGE_VALIDATION = {
  minWidth: 100,
  maxWidth: 10000,
  minHeight: 100,
  maxHeight: 10000,
  maxFileSizeBytes: 50 * 1024 * 1024, // 50MB
};

export async function POST(request: Request) {
  await requireRole("admin", "editor");

  const { path } = await request.json();

  const supabase = await supabaseServer();

  const { data: fileData, error: downloadErr } = await supabase.storage
    .from("media")
    .download(path);

  if (downloadErr || !fileData) {
    console.error(`[media/finalize] Failed to download file at ${path}:`, downloadErr);
    return NextResponse.json(
      { error: downloadErr?.message ?? "Download failed" },
      { status: 500 }
    );
  }

  // Validate file size
  const buffer = Buffer.from(await fileData.arrayBuffer());
  if (buffer.length > IMAGE_VALIDATION.maxFileSizeBytes) {
    console.warn(
      `[media/finalize] File size validation failed: ${buffer.length} bytes exceeds ` +
        `${IMAGE_VALIDATION.maxFileSizeBytes} bytes limit for ${path}`
    );
    return NextResponse.json(
      {
        error: `File size exceeds ${IMAGE_VALIDATION.maxFileSizeBytes / (1024 * 1024)}MB limit. ` +
          `Current size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
      },
      { status: 400 }
    );
  }

  let metadata;
  let blurBuffer;
  let blurDataURL;

  try {
    // Get image metadata and validate dimensions
    metadata = await sharp(buffer).metadata();

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    // Validate image dimensions
    if (
      width < IMAGE_VALIDATION.minWidth ||
      width > IMAGE_VALIDATION.maxWidth ||
      height < IMAGE_VALIDATION.minHeight ||
      height > IMAGE_VALIDATION.maxHeight
    ) {
      console.warn(
        `[media/finalize] Image dimension validation failed for ${path}: ` +
          `${width}x${height}px (valid range: ${IMAGE_VALIDATION.minWidth}-${IMAGE_VALIDATION.maxWidth}x` +
          `${IMAGE_VALIDATION.minHeight}-${IMAGE_VALIDATION.maxHeight}px)`
      );
      return NextResponse.json(
        {
          error: `Invalid image dimensions: ${width}x${height}px. ` +
            `Images must be between ${IMAGE_VALIDATION.minWidth}-${IMAGE_VALIDATION.maxWidth}px wide ` +
            `and ${IMAGE_VALIDATION.minHeight}-${IMAGE_VALIDATION.maxHeight}px tall.`,
        },
        { status: 400 }
      );
    }

    // Generate blur hash
    blurBuffer = await sharp(buffer).resize(10).blur().toBuffer();
    blurDataURL = `data:image/${metadata.format};base64,${blurBuffer.toString("base64")}`;
  } catch (sharpError) {
    const errorMessage =
      sharpError instanceof Error ? sharpError.message : "Unknown sharp error";
    console.error(
      `[media/finalize] Sharp processing failed for ${path}: ${errorMessage}`,
      { path, errorStack: sharpError instanceof Error ? sharpError.stack : "N/A" }
    );
    return NextResponse.json(
      {
        error: "Invalid or corrupted image file. Please upload a valid image.",
      },
      { status: 400 }
    );
  }

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
    console.error(`[media/finalize] Database insert failed for ${path}:`, insertErr);
    return NextResponse.json(
      { error: insertErr?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: asset.id });
}

