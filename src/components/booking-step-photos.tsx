"use client";

import { useFormContext } from "react-hook-form";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { BookingInput } from "@/lib/booking-schema";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, validateFiles } from "@/lib/booking-schema";
import { FormField, FieldError } from "@/components/booking-step-vehicle";

const inputClass =
  "w-full bg-transparent border border-line rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors";

type Props = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  filesError: string | null;
  setFilesError: (e: string | null) => void;
};

export default function BookingStepPhotos({
  files,
  onFilesChange,
  filesError,
  setFilesError,
}: Props) {
  const { register, formState: { errors } } = useFormContext<BookingInput>();
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
    <div className="space-y-10">
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
            dragOver ? "border-bronze bg-bronze/5" : "border-line hover:border-bone-dim"
          }`}
        >
          <Upload size={20} className="text-bronze" />
          <span className="text-bone-dim">
            Drop images here or <span className="text-bronze underline">browse</span>
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
        {filesError && <FieldError msg={filesError} />}

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
                  <img src={url} alt={f.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => removeAt(i)}
                    className="absolute top-2 right-2 size-7 rounded-full bg-ink/80 text-bone flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <fieldset className="grid gap-5 md:grid-cols-2">
        <legend className="sr-only">Contact</legend>
        <FormField label="Name" error={errors.name?.message}>
          <input type="text" {...register("name")} className={inputClass} placeholder="Alex Doe" />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className={inputClass} placeholder="you@example.com" />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Phone" error={errors.phone?.message}>
            <input type="tel" {...register("phone")} className={inputClass} placeholder="(207) 555-0123" />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="Notes (optional)" error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={4}
              className={`${inputClass} resize-y`}
              placeholder="Anything Aiden should know — pet hair, ceramic add-on, gate code, etc."
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}
