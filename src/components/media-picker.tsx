"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { X, Upload, Search, ImageIcon } from "lucide-react";

type MediaAsset = {
  id: string;
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export default function MediaPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (assetId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const perPage = 24;

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const supabase = supabaseBrowser();
    let query = supabase
      .from("media_asset")
      .select("id, path, alt, width, height")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (search) {
      query = query.or(`alt.ilike.%${search}%,caption.ilike.%${search}%,path.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) setAssets(data as MediaAsset[]);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    if (!open) return;

    const loadAssets = async () => {
      await fetchAssets();
    };

    void loadAssets();
  }, [open, page, search, fetchAssets]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    for (const file of files) await uploadFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    for (const file of files) await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const signRes = await fetch("/api/media/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mime: file.type, size: file.size }),
      });
      if (!signRes.ok) throw new Error("Sign failed");
      const { url, path } = await signRes.json();

      const putRes = await fetch(url, { method: "PUT", body: file });
      if (!putRes.ok) throw new Error("Upload failed");

      const finalizeRes = await fetch("/api/media/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!finalizeRes.ok) throw new Error("Finalize failed");
      const { id } = await finalizeRes.json();

      setSelected(id);
      onChange(id);
      fetchAssets();
    } catch (err) {
      const { logger } = await import("@/lib/logger");
      logger.error("media-picker", "Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  const publicUrl = (path: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;

  return (
    <div>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm" type="button">
        {selected ? "Change image" : "Select image"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-line rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h3 className="text-bone font-display text-lg">Media Library</h3>
              <button onClick={() => setOpen(false)} className="text-bone-dim hover:text-bone" title="Close" aria-label="Close media library">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-line flex gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search by alt or filename..."
                  className="w-full bg-ink border border-line rounded-lg pl-9 pr-3 py-2 text-bone text-sm focus:outline-none focus:border-bronze"
                />
              </div>
              <label className="btn-primary text-sm cursor-pointer flex items-center gap-2">
                <Upload size={14} />
                Upload
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
              </label>
            </div>

            <div
              className={`flex-1 overflow-y-auto p-6 ${dragOver ? "bg-bronze/5" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploading && <p className="text-bone-dim text-sm mb-3">Uploading...</p>}
              {loading ? (
                <p className="text-bone-dim text-sm">Loading...</p>
              ) : assets.length === 0 ? (
                <div className="text-center py-12 text-bone-dim">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No images yet. Drop files here or upload.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {assets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setSelected(a.id); onChange(a.id); }}
                      className={`relative aspect-square rounded-xl overflow-hidden border transition-all ${
                        selected === a.id ? "border-bronze ring-2 ring-bronze/30" : "border-line hover:border-bone/40"
                      }`}
                    >
                      <img
                        src={publicUrl(a.path)}
                        alt={a.alt}
                        className="w-full h-full object-cover"
                      />
                      {selected === a.id && (
                        <div className="absolute inset-0 bg-bronze/20 flex items-center justify-center">
                          <span className="bg-bronze text-ink text-xs font-bold px-2 py-0.5 rounded">Selected</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-line flex justify-between items-center">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="text-sm text-bone-dim hover:text-bone disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-bone-dim text-xs">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={assets.length < perPage}
                className="text-sm text-bone-dim hover:text-bone disabled:opacity-30"
              >
                Next
              </button>
            </div>

            <div className="px-6 py-4 border-t border-line flex justify-end">
              <button onClick={() => setOpen(false)} className="btn-primary text-sm">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

