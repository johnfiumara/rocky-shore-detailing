"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Check, X } from "lucide-react";
import { uploadMediaFile } from "@/lib/media/upload-flow";

type Item = {
  key: string;
  name: string;
  state: "uploading" | "done" | "error";
  error?: string;
};

export default function ImageUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    // Seed the list so users see every file enter the queue, in order.
    const seeded: Item[] = fileArray.map((f, i) => ({
      key: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      state: "uploading",
    }));
    setItems((prev) => [...seeded, ...prev]);

    // Upload sequentially. Sharp on the server side is the bottleneck — parallel
    // uploads of large files mostly fight for the same Lambda CPU.
    let anySucceeded = false;
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const key = seeded[i].key;
      try {
        await uploadMediaFile(file);
        anySucceeded = true;
        setItems((prev) =>
          prev.map((it) => (it.key === key ? { ...it, state: "done" } : it)),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setItems((prev) =>
          prev.map((it) =>
            it.key === key ? { ...it, state: "error", error: message } : it,
          ),
        );
      }
    }

    if (anySucceeded) {
      // Pull fresh server props so the grid renders the new assets.
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="border border-line rounded-xl bg-charcoal/40 p-4 md:p-6 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="font-display text-bone text-lg">Upload images</p>
          <p className="text-bone-dim text-xs mt-1">
            JPG, PNG, WebP, or GIF. 10&nbsp;MB max per file. Used across the site once added.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="self-start md:self-auto inline-flex items-center gap-2 bg-bronze/20 hover:bg-bronze/30 text-bronze px-4 py-2 rounded transition-colors text-sm font-mono-accent uppercase tracking-[0.18em] disabled:opacity-50"
        >
          <ImagePlus size={14} />
          Choose images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => {
            void handleFiles(e.target.files);
            // Reset so re-selecting the same file fires a change event.
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="border-t border-line pt-3 space-y-1.5 text-xs">
          {items.map((it) => (
            <li
              key={it.key}
              className="flex items-center justify-between gap-3 text-bone-dim"
            >
              <span className="flex items-center gap-2 truncate">
                {it.state === "uploading" && (
                  <Loader2 size={12} className="animate-spin text-bronze shrink-0" />
                )}
                {it.state === "done" && (
                  <Check size={12} className="text-green-400 shrink-0" />
                )}
                {it.state === "error" && (
                  <X size={12} className="text-red-400 shrink-0" />
                )}
                <span className="truncate">{it.name}</span>
              </span>
              {it.state === "error" && it.error && (
                <span className="text-red-400 text-[10px] truncate max-w-[60%]">
                  {it.error}
                </span>
              )}
              {it.state === "done" && (
                <span className="text-green-400 text-[10px]">added</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
