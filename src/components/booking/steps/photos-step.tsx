"use client";

import { useFormContext } from "react-hook-form";
import type { BookingInput } from "@/lib/booking-schema";
import { FormField, Input, Textarea } from "@/components/ui";
import { PhotoUpload } from "@/components/booking/photo-upload";

export function PhotosStep({
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
  const {
    register,
    formState: { errors },
  } = useFormContext<BookingInput>();

  return (
    <div className="space-y-10">
      <fieldset className="grid gap-5 md:grid-cols-2">
        <legend className="sr-only">Contact</legend>
        <FormField
          label="Name"
          error={errors.name?.message}
          htmlFor="booking-name"
        >
          <Input
            id="booking-name"
            type="text"
            placeholder="Alex Doe"
            error={!!errors.name}
            {...register("name")}
          />
        </FormField>
        <FormField
          label="Email"
          error={errors.email?.message}
          htmlFor="booking-email"
        >
          <Input
            id="booking-email"
            type="email"
            placeholder="you@example.com"
            error={!!errors.email}
            {...register("email")}
          />
        </FormField>
        <div className="md:col-span-2">
          <FormField
            label="Phone"
            error={errors.phone?.message}
            htmlFor="booking-phone"
          >
            <Input
              id="booking-phone"
              type="tel"
              placeholder="(207) 555-0123"
              error={!!errors.phone}
              {...register("phone")}
            />
          </FormField>
        </div>
      </fieldset>

      <div className="md:col-span-2">
        <FormField
          label="Notes (optional)"
          error={errors.notes?.message}
          htmlFor="booking-notes"
        >
          <Textarea
            id="booking-notes"
            rows={4}
            placeholder="Anything Aiden should know — pet hair, ceramic add-on, gate code, etc."
            error={!!errors.notes}
            {...register("notes")}
          />
        </FormField>
      </div>

      <PhotoUpload
        files={files}
        onFilesChange={onFilesChange}
        filesError={filesError}
        setFilesError={setFilesError}
      />
    </div>
  );
}
