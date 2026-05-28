"use client";

import { useFormContext } from "react-hook-form";
import type { BookingInput } from "@/lib/booking-schema";
import { services } from "@/data/services";

export default function BookingStepVehicle() {
  const { register, formState: { errors }, watch, setValue } =
    useFormContext<BookingInput>();
  const selected = watch("service");

  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="font-display text-2xl md:text-3xl text-bone mb-6">Choose a service</legend>
        <div role="radiogroup" aria-label="Service" className="grid gap-3 md:grid-cols-2">
          {services.map((s) => {
            const checked = selected === s.slug;
            return (
              <label
                key={s.slug}
                className={`cursor-pointer rounded-xl border p-5 transition-colors ${
                  checked
                    ? "border-bronze bg-bronze/8"
                    : "border-line hover:border-bone-dim bg-charcoal/30"
                }`}
              >
                <input
                  type="radio"
                  value={s.slug}
                  {...register("service")}
                  className="sr-only"
                  onChange={() => setValue("service", s.slug as BookingInput["service"], { shouldValidate: true })}
                />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-xl text-bone">{s.title}</span>
                  {s.priceFrom && (
                    <span className="font-mono-accent text-[10px] tracking-[0.2em] uppercase text-bronze">
                      From ${s.priceFrom[0]}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {errors.service && <FieldError msg={errors.service.message} />}
      </fieldset>

      <fieldset className="grid gap-5 md:grid-cols-4">
        <legend className="sr-only">Vehicle details</legend>
        <FormField label="Year" error={errors.year?.message}>
          <input type="number" inputMode="numeric" {...register("year")} className={inputClass} placeholder="2021" />
        </FormField>
        <FormField label="Make" error={errors.make?.message}>
          <input type="text" {...register("make")} className={inputClass} placeholder="Subaru" />
        </FormField>
        <FormField label="Model" error={errors.model?.message}>
          <input type="text" {...register("model")} className={inputClass} placeholder="Outback" />
        </FormField>
        <FormField label="Color" error={errors.color?.message}>
          <input type="text" {...register("color")} className={inputClass} placeholder="Magnetite Gray" />
        </FormField>
      </fieldset>
    </div>
  );
}

const inputClass =
  "w-full bg-transparent border border-line rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors";

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2">
        {label}
      </span>
      {children}
      {error && <FieldError msg={error} />}
    </label>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-2 text-[12px] text-ember">
      {msg}
    </p>
  );
}
