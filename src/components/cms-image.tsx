import Image from "next/image";
import { supabaseAnon } from "@/lib/supabase/server";

export default async function CmsImage({
  assetId,
  sizes,
  className,
  fill,
  width,
  height,
  priority,
}: {
  assetId: string;
  sizes?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const { data, error } = await supabaseAnon()
    .from("media_asset")
    .select("path, alt, blur_data_url")
    .eq("id", assetId)
    .single();

  if (error || !data) return null;

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${data.path}`;

  return (
    <Image
      src={url}
      alt={data.alt}
      {...(fill ? { fill } : { width: width ?? 400, height: height ?? 300 })}
      sizes={sizes}
      className={className}
      priority={priority}
      placeholder={data.blur_data_url ? "blur" : undefined}
      blurDataURL={data.blur_data_url ?? undefined}
    />
  );
}

