"use client";

import { useState, useTransition } from "react";
import { reorderGalleryImages } from "../actions";

export default function GalleryReorder({
  images,
}: {
  images: { id: string; sortOrder: number }[];
}) {
  const [items, setItems] = useState(images);
  const [saving, setSaving] = useState(false);
  const [, start] = useTransition();

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const tmp = copy[index];
    copy[index] = copy[next];
    copy[next] = tmp;
    setItems(copy);
  };

  const save = () => {
    setSaving(true);
    const updates = items.map((i, idx) => ({ id: i.id, sortOrder: idx }));
    start(() => {
      reorderGalleryImages(updates);
      setSaving(false);
    });
  };

  return (
    <div className="border border-line rounded-xl p-4 space-y-3">
      <h3 className="text-bone-dim text-xs uppercase tracking-wider">Reorder Images</h3>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-surface/50 rounded-lg px-3 py-2"
          >
            <span className="text-bone text-xs font-mono truncate">{item.id.slice(0, 8)}…</span>
            <div className="flex gap-1">
              <button
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="px-2 py-0.5 text-xs bg-line rounded text-bone-dim hover:text-bone disabled:opacity-30 transition-colors"
              >
                ↑
              </button>
              <button
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                className="px-2 py-0.5 text-xs bg-line rounded text-bone-dim hover:text-bone disabled:opacity-30 transition-colors"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-bronze/20 hover:bg-bronze/30 text-bronze text-xs py-2 rounded transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Order"}
      </button>
    </div>
  );
}

