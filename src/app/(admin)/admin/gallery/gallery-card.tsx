"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  updateGalleryImage,
  toggleGalleryImagePublished,
} from "../actions";

export default function GalleryCard({
  img,
}: {
  img: {
    id: string;
    src: string;
    alt: string;
    label: string | null;
    published: boolean;
    isBefore: boolean;
    isAfter: boolean;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();

  const [alt, setAlt] = useState(img.alt);
  const [label, setLabel] = useState(img.label ?? "");
  const [isBefore, setIsBefore] = useState(img.isBefore);
  const [isAfter, setIsAfter] = useState(img.isAfter);
  const [published, setPublished] = useState(img.published);

  const save = () => {
    start(() =>
      updateGalleryImage(img.id, {
        alt,
        label: label || undefined,
        isBefore,
        isAfter,
      })
    );
    setEditing(false);
  };

  const togglePublished = () => {
    const next = !published;
    setPublished(next);
    start(() => toggleGalleryImagePublished(img.id, next));
  };

  return (
    <div
      className={`relative group border rounded-xl overflow-hidden ${
        published ? "border-line" : "border-red-400/30 opacity-60"
      }`}
    >
      <div className="relative aspect-[4/5]">
        <Image
          src={img.src}
          alt={alt}
          fill
          className="object-cover"
          sizes="25vw"
        />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-ink/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 p-2 overflow-y-auto">
        {editing ? (
          <div className="space-y-2">
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Alt text"
              className="w-full bg-surface/90 border border-line rounded px-2 py-1 text-bone text-xs focus:outline-none focus:border-bronze"
            />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label"
              className="w-full bg-surface/90 border border-line rounded px-2 py-1 text-bone text-xs focus:outline-none focus:border-bronze"
            />
            <div className="flex gap-2 text-xs text-bone-dim">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBefore}
                  onChange={(e) => setIsBefore(e.target.checked)}
                  className="accent-bronze"
                />
                Before
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAfter}
                  onChange={(e) => setIsAfter(e.target.checked)}
                  className="accent-bronze"
                />
                After
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={save}
                className="flex-1 bg-bronze/20 hover:bg-bronze/30 text-bronze text-xs py-1 rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-2 py-1 rounded text-xs bg-line text-bone-dim hover:text-bone transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 h-full justify-end">
            <p className="text-bone text-xs leading-tight truncate">{alt}</p>
            {label && (
              <p className="text-bone-dim text-[10px] leading-tight truncate">{label}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 bg-bronze/20 hover:bg-bronze/30 text-bronze text-xs py-1 rounded transition-colors"
              >
                Edit
              </button>
              <button
                onClick={togglePublished}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  published
                    ? "bg-red-400/10 text-red-400 hover:bg-red-400/20"
                    : "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                }`}
              >
                {published ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom badges */}
      <div className="absolute bottom-0 inset-x-0 bg-ink/60 px-2 py-1 flex gap-1 flex-wrap pointer-events-none">
        {isBefore && (
          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 rounded">Before</span>
        )}
        {isAfter && (
          <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 rounded">After</span>
        )}
        {!published && (
          <span className="text-[10px] bg-red-400/20 text-red-300 px-1.5 rounded">Hidden</span>
        )}
      </div>
    </div>
  );
}


