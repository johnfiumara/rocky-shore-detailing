"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus } from "lucide-react";
import MediaPicker from "../_components/media-picker";
import { createGalleryImage } from "../actions";

export default function NewGalleryImageButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setSrc(null);
    setMediaAssetId(null);
    setAlt("");
    setLabel("");
    setError(null);
  };

  const onSubmit = () => {
    if (!src) {
      setError("Pick an image first.");
      return;
    }
    const fd = new FormData();
    fd.set("src", src);
    fd.set("alt", alt);
    fd.set("label", label);
    if (mediaAssetId) fd.set("mediaAssetId", mediaAssetId);

    setError(null);
    startTransition(async () => {
      const result = await createGalleryImage(null, fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-bronze/20 hover:bg-bronze/30 text-bronze px-3 py-1.5 rounded text-xs font-mono-accent uppercase tracking-[0.18em] transition-colors"
      >
        <Plus size={14} />
        Add gallery image
      </button>
    );
  }

  return (
    <div className="border border-line rounded-xl bg-charcoal/40 p-4 md:p-5 space-y-3">
      <p className="font-display text-bone text-base">New gallery image</p>

      <div className="grid gap-3 md:grid-cols-[auto_1fr] md:gap-4 items-start">
        <div className="relative w-32 h-32 rounded border border-line overflow-hidden bg-ink shrink-0">
          {src ? (
            <Image src={src} alt={alt} fill className="object-cover" sizes="128px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-bone-dim text-[10px] uppercase tracking-wider text-center p-2">
              No image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <MediaPicker
            value={src}
            onSelect={(asset) => {
              setSrc(asset.url);
              setMediaAssetId(asset.id);
              if (!alt) setAlt(asset.alt);
            }}
            triggerLabel={src ? "Change image" : "Pick from media library"}
          />
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text (describe the image for screen readers)"
            maxLength={160}
            className="w-full bg-ink border border-line rounded px-2 py-1.5 text-bone text-sm focus:outline-none focus:border-bronze"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional, shown on the public gallery)"
            maxLength={80}
            className="w-full bg-ink border border-line rounded px-2 py-1.5 text-bone text-sm focus:outline-none focus:border-bronze"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-300 text-xs border border-red-400/30 bg-red-400/5 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="text-xs text-bone-dim hover:text-bone px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !src || !alt.trim()}
          className="bg-bronze/20 hover:bg-bronze/30 text-bronze disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 text-xs rounded font-mono-accent uppercase tracking-[0.18em] transition-colors"
        >
          {isPending ? "Adding…" : "Add to gallery"}
        </button>
      </div>
    </div>
  );
}
