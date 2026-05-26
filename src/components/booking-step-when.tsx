"use client";

import { useFormContext } from "react-hook-form";
import type { BookingInput } from "@/lib/booking-schema";
import { TIME_WINDOWS, TIME_WINDOW_LABELS } from "@/lib/booking-schema";
import { FormField, FieldError } from "@/components/booking-step-vehicle";

const inputClass =
  "w-full bg-transparent border border-line rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors";

export default function BookingStepWhen() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BookingInput>();

  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().slice(0, 10);
  const selectedWindow = watch("timeWindow");

  return (
    <div className="space-y-10">
      <fieldset className="grid gap-5 md:grid-cols-6">
        <legend className="sr-only">Service location</legend>
        <div className="md:col-span-6">
          <FormField label="Street address" error={errors.address?.message}>
            <input type="text" {...register("address")} className={inputClass} placeholder="123 Coastal Rd." />
          </FormField>
        </div>
        <div className="md:col-span-4">
          <FormField label="City" error={errors.city?.message}>
            <input type="text" {...register("city")} className={inputClass} placeholder="Portland" />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="ZIP" error={errors.zip?.message}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              {...register("zip")}
              className={inputClass}
              placeholder="04101"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="sr-only">When</legend>
        <FormField label="Preferred date" error={errors.date?.message}>
          <input
            type="date"
            min={minDate}
            {...register("date")}
            className={inputClass}
          />
        </FormField>
        <div>
          <span className="block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2">
            Time window
          </span>
          <div role="radiogroup" aria-label="Time window" className="grid grid-cols-3 gap-2">
            {TIME_WINDOWS.map((w) => {
              const checked = selectedWindow === w;
              return (
                <label
                  key={w}
                  className={`cursor-pointer rounded-lg border px-3 py-3 text-sm text-center transition-colors ${
                    checked
                      ? "border-bronze bg-bronze/8 text-bronze"
                      : "border-line text-bone-dim hover:border-bone-dim"
                  }`}
                >
                  <input
                    type="radio"
                    value={w}
                    {...register("timeWindow")}
                    className="sr-only"
                    onChange={() => setValue("timeWindow", w, { shouldValidate: true })}
                  />
                  {TIME_WINDOW_LABELS[w].split(" ")[0]}
                </label>
              );
            })}
          </div>
          {errors.timeWindow && <FieldError msg={errors.timeWindow.message} />}
        </div>
      </fieldset>
    </div>
  );
}
