"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2, Check } from "lucide-react";
import { fetchMediaAssets, type MediaAsset } from "@/lib/media/list";

type Props = {
  value: string | null;
  onSelect: (asset: { id: string; url: string; alt: string }) => void;
  triggerLabel?: string;
  triggerClassName?: string;
};

export default function MediaPicker({
  value,
  onSelect,
  triggerLabel = "Choose image",
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Fetch the library the first time the picker opens, then keep it cached.
  // Re-fetch happens only if the user closes and reopens after an upload — the
  // calling page should pass a `key` that changes after upload to force a remount
  // if it cares about that. For simple cases, a refresh of the parent will work.
  useEffect(() => {
    if (!open || assets !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchMediaAssets();
        if (!cancelled) setAssets(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load media.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, assets]);

  // ESC closes the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const confirm = useCallback(() => {
    if (!selectedId || !assets) return;
    const picked = assets.find((a) => a.id === selectedId);
    if (!picked) return;
    onSelect({ id: picked.id, url: picked.url, alt: picked.alt });
    setOpen(false);
    setSelectedId(null);
  }, [selectedId, assets, onSelect]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "inline-flex items-center gap-2 border border-line rounded px-3 py-2 text-xs text-bone-dim hover:text-bone hover:border-bronze/50 transition-colors"
        }
      >
        {value ? (
          <span className="relative inline-block w-6 h-6 rounded overflow-hidden border border-line">
            <Image src={value} alt="" fill className="object-cover" sizes="24px" />
          </span>
        ) : (
          <ImagePlus size={14} />
        )}
        {triggerLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-picker-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/85 backdrop-blur-sm"
          onClick={(e) => {
            // Click on the backdrop closes; ignore clicks inside the card.
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-5xl max-h-[85vh] flex flex-col bg-charcoal border border-line rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 id="media-picker-title" className="font-display text-bone text-lg">
                Pick an image
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-bone-dim hover:text-bone p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {assets === null && !error && (
                <div className="flex items-center justify-center py-16 text-bone-dim text-sm">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Loading media…
                </div>
              )}

              {error && (
                <div className="border border-red-400/30 bg-red-400/5 rounded p-4 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {assets !== null && assets.length === 0 && (
                <div className="border border-line rounded-xl p-12 text-center text-bone-dim text-sm">
                  No media yet. Upload images from{" "}
                  <a href="/admin/media" className="text-bronze hover:underline">
                    Media Library
                  </a>
                  .
                </div>
              )}

              {assets !== null && assets.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {assets.map((a) => {
                    const isSelected = a.id === selectedId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedId(a.id)}
                        onDoubleClick={() => {
                          setSelectedId(a.id);
                          onSelect({ id: a.id, url: a.url, alt: a.alt });
                          setOpen(false);
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? "border-bronze ring-2 ring-bronze/40"
                            : "border-line hover:border-bronze/50"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <Image
                          src={a.url}
                          alt={a.alt}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 16vw, 33vw"
                        />
                        {isSelected && (
                          <span className="absolute top-1 right-1 bg-bronze text-ink rounded-full p-0.5">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-line">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs text-bone-dim hover:text-bone rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!selectedId}
                className="bg-bronze/20 hover:bg-bronze/30 text-bronze disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 text-xs rounded transition-colors font-mono-accent uppercase tracking-[0.18em]"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
