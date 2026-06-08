"use client";

import { useFormContext } from "react-hook-form";
import { TIME_WINDOWS, TIME_WINDOW_LABELS } from "@/lib/booking-schema";
import type { BookingInput } from "@/lib/booking-schema";
import { FormField, Input } from "@/components/ui";

export function WhenStep() {
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
          <FormField
            label="Street address"
            error={errors.address?.message}
            htmlFor="booking-address"
          >
            <Input
              id="booking-address"
              type="text"
              placeholder="123 Coastal Rd."
              error={!!errors.address}
              {...register("address")}
            />
          </FormField>
        </div>
        <div className="md:col-span-4">
          <FormField
            label="City"
            error={errors.city?.message}
            htmlFor="booking-city"
          >
            <Input
              id="booking-city"
              type="text"
              placeholder="Portland"
              error={!!errors.city}
              {...register("city")}
            />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField
            label="ZIP"
            error={errors.zip?.message}
            htmlFor="booking-zip"
          >
            <Input
              id="booking-zip"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="04101"
              error={!!errors.zip}
              {...register("zip")}
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="sr-only">When</legend>
        <FormField
          label="Preferred date"
          error={errors.date?.message}
          htmlFor="booking-date"
        >
          <Input
            id="booking-date"
            type="date"
            min={minDate}
            error={!!errors.date}
            {...register("date")}
          />
        </FormField>
        <div>
          <span className="block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2">
            Time window
          </span>
          <div
            role="radiogroup"
            aria-label="Time window"
            className="grid grid-cols-3 gap-2"
          >
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
                    onChange={() =>
                      setValue("timeWindow", w, { shouldValidate: true })
                    }
                  />
                  {TIME_WINDOW_LABELS[w].split(" ")[0]}
                </label>
              );
            })}
          </div>
          {errors.timeWindow && (
            <p role="alert" className="mt-2 text-[12px] text-ember">
              {errors.timeWindow.message}
            </p>
          )}
        </div>
      </fieldset>
    </div>
  );
}
