"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, validateFiles } from "@/lib/booking-schema";
import { FieldError, IconButton } from "@/components/ui";

export function PhotoUpload({
  files,
  onFilesChange,
  filesError,
  setFilesError,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  filesError: string | null;
  setFilesError: (e: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const combined = [...files, ...Array.from(incoming)].slice(0, MAX_PHOTOS);
    const check = validateFiles(combined);
    if (!check.ok) {
      setFilesError(check.message);
      return;
    }
    setFilesError(null);
    onFilesChange(combined);
  };

  const removeAt = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFilesError(null);
    onFilesChange(next);
  };

  return (
    <div>
      <span className="block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2">
        Photos (optional · up to {MAX_PHOTOS})
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors ${
          dragOver
            ? "border-bronze bg-bronze/5"
            : "border-line hover:border-bone-dim"
        }`}
      >
        <Upload size={20} className="text-bronze" />
        <span className="text-bone-dim">
          Drop images here or{" "}
          <span className="text-bronze underline">browse</span>
        </span>
        <span className="text-[11px] text-mist">
          JPG, PNG, HEIC · {MAX_PHOTO_BYTES / 1024 / 1024} MB max each
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <FieldError msg={filesError ?? undefined} />

      {files.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {files.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <li
                key={`${f.name}-${i}`}
                className="relative aspect-square rounded-lg overflow-hidden border border-line group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Uploaded photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <IconButton
                  label={`Remove photo ${i + 1}`}
                  onClick={() => removeAt(i)}
                  className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
